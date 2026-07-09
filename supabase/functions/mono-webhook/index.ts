import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MonoWebhookData {
  invoiceId: string;
  status: 'created' | 'processing' | 'success' | 'failure' | 'reversed';
  amount: number;
  ccy: number;
  reference: string;
  createdDate: string;
  modifiedDate: string;
  failureReason?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const data: MonoWebhookData = await req.json();

    console.log('Monobank webhook received:', JSON.stringify(data, null, 2));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find payment by invoice number (reference)
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, tenants!inner(*)')
      .eq('invoice_number', data.reference)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error('Payment not found:', data.reference);
      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Update payment status
    const paymentStatus = data.status === 'success' ? 'paid' :
                          data.status === 'failure' ? 'failed' :
                          data.status === 'reversed' ? 'refunded' : 'pending';

    await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        mono_payment_id: data.invoiceId,
        paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
      })
      .eq('id', payment.id);

    // If payment successful, update tenant and subscription
    if (paymentStatus === 'paid') {
      const tenantId = payment.tenant_id;

      // Update tenant status
      await supabase
        .from('tenants')
        .update({ status: 'active' })
        .eq('id', tenantId);

      // Update subscription
      const periodStart = new Date();
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1); // 1 year subscription

      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
        })
        .eq('tenant_id', tenantId);

      console.log('Subscription activated for tenant:', tenantId);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// This function should be called via cron to check bank statements
// for IBAN payments that reference our invoices

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const monoToken = Deno.env.get('MONOBANK_API_TOKEN');

    // Get pending payments with IBAN method
    const { data: pendingPayments, error } = await supabase
      .from('payments')
      .select('*, tenants!inner(*)')
      .eq('status', 'pending')
      .eq('payment_method', 'iban')
      .limit(50);

    if (error || !pendingPayments?.length) {
      return new Response(JSON.stringify({ checked: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!monoToken) {
      console.log('No Monobank token configured, skipping bank statement check');
      return new Response(JSON.stringify({
        checked: pendingPayments.length,
        matched: 0,
        note: 'Monobank token not configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const account = Deno.env.get('MONOBANK_FOP_ACCOUNT');
    if (!account) {
      throw new Error('MONOBANK_FOP_ACCOUNT not configured');
    }

    // Get bank statement for last 7 days
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);

    const fromStr = from.toISOString().split('T')[0].replace(/-/g, '');
    const toStr = to.toISOString().split('T')[0].replace(/-/g, '');

    const response = await fetch(
      `https://api.monobank.ua/personal/statement/${account}/${fromStr}/${toStr}`,
      {
        headers: { 'X-Token': monoToken },
      }
    );

    const statements = await response.json();

    if (!response.ok) {
      throw new Error(statements.errorDescription || 'Failed to get statements');
    }

    let matched = 0;

    // Check each statement against pending payments
    for (const stmt of statements) {
      const amount = stmt.amount / 100; // Convert from kopiykas
      const description = stmt.description || '';

      // Look for invoice number in description
      for (const payment of pendingPayments) {
        if (
          Math.abs(amount - payment.amount) < 1 && // Amount matches (within 1 UAH)
          description.includes(payment.invoice_number?.split('-')[1] || '') // Invoice reference
        ) {
          // Match found!
          await supabase
            .from('payments')
            .update({
              status: 'paid',
              mono_payment_id: stmt.id,
              paid_at: new Date(stmt.time * 1000).toISOString(),
            })
            .eq('id', payment.id);

          // Update tenant status
          await supabase
            .from('tenants')
            .update({ status: 'active' })
            .eq('id', payment.tenant_id);

          // Update subscription
          const periodStart = new Date();
          const periodEnd = new Date();
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);

          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              current_period_start: periodStart.toISOString(),
              current_period_end: periodEnd.toISOString(),
            })
            .eq('tenant_id', payment.tenant_id);

          matched++;
          console.log(`Payment matched: ${payment.invoice_number}`);
          break;
        }
      }
    }

    return new Response(JSON.stringify({
      checked: pendingPayments.length,
      matched,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Check payments error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

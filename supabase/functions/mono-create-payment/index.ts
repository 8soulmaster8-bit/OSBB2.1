import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentRequest {
  tenantId: string;
  amount: number;
  invoiceNumber: string;
  redirectUrl: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { tenantId, amount, invoiceNumber, redirectUrl }: PaymentRequest = await req.json();

    // Get Monobank API token from environment
    const monoToken = Deno.env.get('MONOBANK_API_TOKEN');
    if (!monoToken) {
      // Mock response for demo
      return new Response(JSON.stringify({
        pageUrl: `${redirectUrl}?payment=demo&invoice=${invoiceNumber}`,
        invoiceId: invoiceNumber,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create payment invoice via Monobank API
    const response = await fetch('https://api.monobank.ua/api/merchant/invoice/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Token': monoToken,
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to kopiykas
        ccy: 980, // UAH
        reference: invoiceNumber,
        redirectUrl,
        webHookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mono-webhook`,
        merchantPaymInfo: {
          reference: invoiceNumber,
          destination: `Підписка OSBB Platform (${invoiceNumber})`,
          basketOrder: [{
            name: 'Підписка OSBB Platform',
            qty: 1,
            sum: amount * 100,
            code: invoiceNumber,
          }],
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errorDescription || 'Failed to create payment');
    }

    // Store payment ID in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase
      .from('payments')
      .update({ mono_payment_id: data.invoiceId })
      .eq('invoice_number', invoiceNumber);

    return new Response(JSON.stringify({
      pageUrl: data.pageUrl,
      invoiceId: data.invoiceId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

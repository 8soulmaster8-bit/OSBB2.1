import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { edrpou } = await req.json();

    if (!edrpou || edrpou.length !== 8) {
      return new Response(JSON.stringify({
        error: 'ЄДРПОУ має містити 8 цифр',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const opendatabotToken = Deno.env.get('OPENDATABOT_API_KEY');

    if (!opendatabotToken) {
      // Return mock data for demo
      const mockData = generateMockEDRPOUData(edrpou);
      return new Response(JSON.stringify(mockData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Query OpenDataBot API
    const response = await fetch(
      `https://opendatabot.com/api/v3/company/${edrpou}`,
      {
        headers: {
          'Authorization': `Bearer ${opendatabotToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(JSON.stringify({
          error: 'Компанію не знайдено в реєстрі',
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('API Error');
    }

    const data = await response.json();

    // Check if it's an OSBB
    const isOsbb = data.name?.toLowerCase().includes('осбб') ||
                   data.shortName?.toLowerCase().includes('осбб') ||
                   data.activityKind?.includes('43.10') ||
                   data.activityKind?.includes('управління будинками');

    if (!isOsbb) {
      return new Response(JSON.stringify({
        error: 'Ця організація не є ОСББ. Будь ласка, введіть код ЄДРПОУ ОСББ.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      edrpou: data.edrpou,
      name: data.name,
      shortName: data.shortName || data.name,
      address: data.address || '',
      status: data.status || 'зареєстровано',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('OpenDataBot lookup error:', error);
    return new Response(JSON.stringify({ error: 'Помилка пошуку в реєстрі' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateMockEDRPOUData(edrpou: string) {
  const cities = ['Київ', 'Львів', 'Одеса', 'Харків', 'Дніпро', 'Вінниця'];
  const streets = ['Шевченка', 'Франка', 'Богдана Хмельницького', 'Соборна', 'Мазепи'];

  const city = cities[Math.floor(parseFloat(edrpou.slice(2, 4)) % cities.length)];
  const street = streets[Math.floor(parseFloat(edrpou.slice(5, 6)) % streets.length)];
  const number = Math.floor(parseFloat(edrpou.slice(6, 8))) + 1;

  return {
    edrpou,
    name: `ОСББ "БЕРЕГ-2024"`,
    shortName: `ОСББ "БЕРЕГ"`,
    address: `м. ${city}, вул. ${street}, ${number}`,
    status: 'зареєстровано',
  };
}

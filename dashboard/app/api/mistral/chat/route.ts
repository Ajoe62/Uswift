import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Read prompt and options from request body
  const body = await req.json();
  const { prompt, model = 'mistral-tiny', max_tokens = 512, temperature = 0.7 } = body;

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid prompt.' }, { status: 400 });
  }

  // Read API key and URL from env
  const apiKey = process.env.MISTRAL_API_KEY;
  const apiUrl = process.env.MISTRAL_API_URL;
  if (!apiKey || !apiUrl) {
    return NextResponse.json({ error: 'Mistral API key or URL not configured.' }, { status: 500 });
  }

  // Prepare request to Mistral
  const mistralPayload = {
    model,
    messages: [
      { role: 'user', content: prompt }
    ],
    max_tokens,
    temperature
  };

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mistralPayload),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error || 'Mistral API error', details: data }, { status: res.status });
    }
    return NextResponse.json({ result: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Request failed.' }, { status: 500 });
  }
}

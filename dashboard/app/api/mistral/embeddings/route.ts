import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Read text or file from request body
  const apiKey = process.env.MISTRAL_API_KEY;
  const apiUrl = process.env.MISTRAL_EMBEDDINGS_API_URL;
  if (!apiKey || !apiUrl) {
    return NextResponse.json({ error: 'Mistral API key or embeddings URL not configured.' }, { status: 500 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const { input } = body;
  if (!input || typeof input !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid input.' }, { status: 400 });
  }
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input }),
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

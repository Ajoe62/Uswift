import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  // List files
  const apiKey = process.env.MISTRAL_API_KEY;
  const apiUrl = process.env.MISTRAL_FILES_API_URL;
  if (!apiKey || !apiUrl) {
    return NextResponse.json({ error: 'Mistral API key or files URL not configured.' }, { status: 500 });
  }
  try {
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
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

export async function POST(req: NextRequest) {
  // Upload file
  const apiKey = process.env.MISTRAL_API_KEY;
  const apiUrl = process.env.MISTRAL_FILES_API_URL;
  if (!apiKey || !apiUrl) {
    return NextResponse.json({ error: 'Mistral API key or files URL not configured.' }, { status: 500 });
  }
  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file.' }, { status: 400 });
  }
  try {
    const uploadRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: file,
    });
    const data = await uploadRes.json();
    if (!uploadRes.ok) {
      return NextResponse.json({ error: data.error || 'Mistral API error', details: data }, { status: uploadRes.status });
    }
    return NextResponse.json({ result: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Upload failed.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // Delete file by id
  const apiKey = process.env.MISTRAL_API_KEY;
  const apiUrl = process.env.MISTRAL_FILES_API_URL;
  if (!apiKey || !apiUrl) {
    return NextResponse.json({ error: 'Mistral API key or files URL not configured.' }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('id');
  if (!fileId) {
    return NextResponse.json({ error: 'Missing file id.' }, { status: 400 });
  }
  try {
    const deleteRes = await fetch(`${apiUrl}/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    const data = await deleteRes.json();
    if (!deleteRes.ok) {
      return NextResponse.json({ error: data.error || 'Mistral API error', details: data }, { status: deleteRes.status });
    }
    return NextResponse.json({ result: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Delete failed.' }, { status: 500 });
  }
}

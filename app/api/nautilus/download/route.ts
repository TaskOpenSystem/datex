import { NextRequest, NextResponse } from 'next/server';

interface NautilusResponse {
  response: {
    data: {
      content_type: string | null;
      dataset_id: string;
      file_count: number | null;
      file_name: string;
      full_data: string; // base64 encoded
      mime_type: string;
      size: number;
    };
    intent: number;
    timestamp_ms: number;
  };
  signature: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataset_id, blob_id, payment_tx_digest, buyer_address, mime_type, file_name } = body;

    if (!dataset_id || !blob_id || !payment_tx_digest || !buyer_address) {
      return NextResponse.json(
        { error: 'Missing required fields: dataset_id, blob_id, payment_tx_digest, buyer_address' },
        { status: 400 }
      );
    }

    const nautilusServer = process.env.NEXT_NAUTILUS_SERVER;
    if (!nautilusServer) {
      return NextResponse.json(
        { error: 'NEXT_NAUTILUS_SERVER not configured' },
        { status: 500 }
      );
    }

    const payload = { 
      dataset_id, 
      blob_id,
      payment_tx_digest,
      buyer_address,
      mime_type: mime_type || 'application/octet-stream',
      file_name: file_name || 'download',
    };

    console.log('🚀 [Nautilus Download] Calling:', `${nautilusServer}/process_data`);
    console.log('🚀 [Nautilus Download] Payload:', JSON.stringify({ payload }, null, 2));

    const response = await fetch(`${nautilusServer}/process_data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });

    console.log('📥 [Nautilus Download] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Nautilus Download] Error:', errorText);
      return NextResponse.json(
        { error: 'Nautilus server error', details: errorText },
        { status: response.status }
      );
    }

    const data: NautilusResponse = await response.json();
    console.log('📥 [Nautilus Download] Response received, file_name:', data.response.data.file_name);
    console.log('📥 [Nautilus Download] File size:', data.response.data.size);

    // Decode base64 full_data
    const fullDataBase64 = data.response.data.full_data;
    const fileBuffer = Buffer.from(fullDataBase64, 'base64');
    
    const responseFileName = data.response.data.file_name || file_name || 'download';
    const responseMimeType = data.response.data.mime_type || mime_type || 'application/octet-stream';

    console.log('📥 [Nautilus Download] Decoded size:', fileBuffer.length);

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': responseMimeType,
        'Content-Disposition': `attachment; filename="${responseFileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('❌ [Nautilus Download] Error:', errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

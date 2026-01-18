 import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataset_id, blob_id, preview_bytes, requester_address, mime_type, file_name } = body;

    if (!dataset_id || !blob_id) {
      return NextResponse.json(
        { error: 'Missing required fields: dataset_id, blob_id' },
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

    const payload: Record<string, string | number> = { 
      dataset_id, 
      blob_id,
      preview_bytes: preview_bytes || 1024,
      requester_address: requester_address || '',
      mime_type: mime_type || 'application/octet-stream',
      file_name: file_name || 'download',
    };

    console.log('🚀 [Nautilus API] Calling:', `${nautilusServer}/process_data`);
    console.log('🚀 [Nautilus API] Payload:', JSON.stringify({ payload }, null, 2));

    const response = await fetch(`${nautilusServer}/process_data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });

    const data = await response.json();
    console.log('📥 [Nautilus API] Response status:', response.status);
    // console.log('📥 [Nautilus API] Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Nautilus server error', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [Nautilus API] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

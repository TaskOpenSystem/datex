import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataset_id, blob_id, payment_tx_digest, buyer_address } = body;

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

    const payload: Record<string, string> = { dataset_id, blob_id };
    if (payment_tx_digest) payload.payment_tx_digest = payment_tx_digest;
    if (buyer_address) payload.buyer_address = buyer_address;

    const response = await fetch(`${nautilusServer}/process_data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Nautilus server error', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getRefillStatus, processRefill } from '@/lib/stackauth-credits';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const refillStatus = await getRefillStatus(params.userId);
    return NextResponse.json(refillStatus);
  } catch {
    return NextResponse.json({ error: 'Failed to get refill status' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const result = await processRefill(params.userId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to process refill' }, { status: 500 });
  }
}

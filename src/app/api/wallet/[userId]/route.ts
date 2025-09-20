import { NextRequest, NextResponse } from 'next/server';
import { getUserWallet } from '@/lib/wallet';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const wallet = await getUserWallet(params.userId);
    return NextResponse.json({ wallet });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}

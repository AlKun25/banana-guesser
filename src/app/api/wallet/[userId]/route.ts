import { NextRequest, NextResponse } from 'next/server';
import { getUserCredits } from '@/lib/stackauth-credits';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const credits = await getUserCredits(params.userId);
    return NextResponse.json({ wallet: credits }); // Keep 'wallet' key for backward compatibility
  } catch {
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}

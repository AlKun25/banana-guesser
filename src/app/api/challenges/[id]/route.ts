import { NextRequest, NextResponse } from 'next/server';
import { readChallenges } from '@/lib/data';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challenges = await readChallenges();
    const challenge = challenges.find(c => c.id === params.id);
    
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    return NextResponse.json(challenge);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch challenge' }, { status: 500 });
  }
}

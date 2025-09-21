import { NextRequest, NextResponse } from 'next/server';
import { readChallenges } from '@/lib/data';
import { Challenge } from '@/lib/types';
import { sanitizeChallengeForClient } from '@/app/challenge/[id]/page';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const challenges = await readChallenges();
    
    const challenge = challenges.find(c => c.id === id);
    
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Try to get userId from headers for personalized word visibility
    const userId = request.headers.get('x-user-id');
    return NextResponse.json(sanitizeChallengeForClient(challenge, userId || undefined));
  } catch (error) {
    console.error('Error in challenge route:', error);
    return NextResponse.json({ error: 'Failed to fetch challenge' }, { status: 500 });
  }
}

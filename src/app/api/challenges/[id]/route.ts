import { NextRequest, NextResponse } from 'next/server';
import { readChallenges } from '@/lib/data';
import { Challenge } from '@/lib/types';

// Function to sanitize challenge data for client
function sanitizeChallengeForClient(challenge: Challenge) {
  return {
    ...challenge,
    words: challenge.words.map(word => ({
      ...word,
      text: word.isPurchased ? '*'.repeat(word.text.length) : word.text.charAt(0) + '_'.repeat(word.text.length - 1)
    }))
  };
}

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

    return NextResponse.json(sanitizeChallengeForClient(challenge));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch challenge' }, { status: 500 });
  }
}

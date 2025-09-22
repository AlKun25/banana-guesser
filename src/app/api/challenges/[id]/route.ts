import { NextRequest, NextResponse } from 'next/server';
import { readChallenges } from '@/lib/data';
import { sanitizeChallengeForClient, getUserDisplayInfo } from '@/lib/challenge-utils';


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

    // Enrich challenge with creator display information
    const creatorInfo = await getUserDisplayInfo(challenge.createdBy);
    const enrichedChallenge = {
      ...challenge,
      createdByDisplayName: creatorInfo?.displayName || 'Anonymous User',
      createdByProfileImage: creatorInfo?.profileImageUrl || null
    };

    // Try to get userId from headers for personalized word visibility
    const userId = request.headers.get('x-user-id');
    return NextResponse.json(sanitizeChallengeForClient(enrichedChallenge, userId || undefined));
  } catch (error) {
    console.error('Error in challenge route:', error);
    return NextResponse.json({ error: 'Failed to fetch challenge' }, { status: 500 });
  }
}

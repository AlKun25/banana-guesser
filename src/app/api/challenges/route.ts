import { NextRequest, NextResponse } from 'next/server';
import { readChallenges, writeChallenges, generateId } from '@/lib/data';
import { Challenge } from '@/lib/types';
import { canAffordCredits, burnUserCredits } from '@/lib/stackauth-credits';
import { sanitizeChallengeForClient, getUserDisplayInfo } from '@/lib/challenge-utils';
import { rateLimitChallengeCreation } from '@/lib/rate-limiter';


export async function GET(request: NextRequest) {
  try {
    const challenges = await readChallenges();
    // Try to get userId from headers for personalized word visibility
    const userId = request.headers.get('x-user-id');
    
    // Sort challenges by creation date (most recent first)
    const sortedChallenges = challenges.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Enrich challenges with creator display information
    const enrichedChallenges = await Promise.all(
      sortedChallenges.map(async (challenge) => {
        const creatorInfo = await getUserDisplayInfo(challenge.createdBy);
        return {
          ...challenge,
          createdByDisplayName: creatorInfo?.displayName || 'Anonymous User',
          createdByProfileImage: creatorInfo?.profileImageUrl || null
        };
      })
    );
    
    const sanitizedChallenges = enrichedChallenges.map(challenge => sanitizeChallengeForClient(challenge, userId || undefined));
    return NextResponse.json(sanitizedChallenges);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sentence, createdBy, prizeAmount } = await request.json();
    
    if (!sentence || !createdBy || prizeAmount === undefined || prizeAmount === null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check rate limits
    const rateLimitResult = await rateLimitChallengeCreation(createdBy);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ 
        error: rateLimitResult.error,
        rateLimited: true,
        minuteRemaining: rateLimitResult.minuteRemaining,
        dayRemaining: rateLimitResult.dayRemaining
      }, { status: 429 }); // 429 Too Many Requests
    }

    if (sentence.split(' ').length > 25) {
      return NextResponse.json({ error: 'Sentence too long (max 25 words)' }, { status: 400 });
    }

    if (prizeAmount < 0) {
      return NextResponse.json({ error: 'Prize amount cannot be negative' }, { status: 400 });
    }

    // Check if creator can afford the prize (only if prize > 0)
    // Convert prize amount from dollars to cents for credit system
    const prizeAmountCents = Math.round(prizeAmount * 100);
    if (prizeAmount > 0) {
      if (!(await canAffordCredits(createdBy, prizeAmountCents))) {
        return NextResponse.json({ error: 'Insufficient credits to create this challenge' }, { status: 400 });
      }

      // Deduct prize amount from creator's credits upfront
      const success = await burnUserCredits(createdBy, prizeAmountCents);
      if (!success) {
        return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 400 });
      }
    }

    // Parse words and identify purchasable ones
    const words = sentence.split(' ').map((word: string, index: number) => ({
      text: word,
      position: index,
      isPurchased: false,
      purchasedBy: null,
      purchaseTime: null
    }));

    // For hackathon: make every 3rd word purchasable (simplified logic)
    words.forEach((word: any, index: number) => {
      if (index % 3 === 2 && word.text.length > 3) {
        word.isPurchased = false; // This will be purchasable
      }
    });

    const newChallenge: Challenge = {
      id: generateId(),
      sentence,
      imageUrl: '', // Will be generated after creation
      prizeAmount,
      words,
      createdBy,
      solvedBy: null,
      isActive: true,
      createdAt: new Date()
    };

    const challenges = await readChallenges();
    challenges.push(newChallenge);
    await writeChallenges(challenges);

    return NextResponse.json(sanitizeChallengeForClient(newChallenge), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { readChallenges, writeChallenges, generateId } from '@/lib/data';
import { Challenge } from '@/lib/types';
import { canAffordCredits, burnUserCredits } from '@/lib/stackauth-credits';
import { sanitizeChallengeForClient } from '@/lib/challenge-utils';


export async function GET() {
  try {
    const challenges = await readChallenges();
    const sanitizedChallenges = challenges.map(challenge => sanitizeChallengeForClient(challenge));
    return NextResponse.json(sanitizedChallenges);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sentence, createdBy, prizeAmount } = await request.json();
    
    if (!sentence || !createdBy || !prizeAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (sentence.split(' ').length > 25) {
      return NextResponse.json({ error: 'Sentence too long (max 25 words)' }, { status: 400 });
    }

    if (prizeAmount < 1) {
      return NextResponse.json({ error: 'Prize amount must be at least $1' }, { status: 400 });
    }

    // Check if creator can afford the prize
    if (!(await canAffordCredits(createdBy, prizeAmount))) {
      return NextResponse.json({ error: 'Insufficient credits to create this challenge' }, { status: 400 });
    }

    // Deduct prize amount from creator's credits upfront
    const success = await burnUserCredits(createdBy, prizeAmount);
    if (!success) {
      return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 400 });
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

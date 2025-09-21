import { NextRequest, NextResponse } from 'next/server';
import { readChallenges, writeChallenges, generateId } from '@/lib/data';
import { Challenge } from '@/lib/types';
import { canAfford, updateUserWallet } from '@/lib/wallet';

// Function to sanitize challenge data for client
function sanitizeChallengeForClient(challenge: Challenge, userId?: string) {
  return {
    ...challenge,
    words: challenge.words.map(word => ({
      ...word,
      text: word.isPurchased || (userId && word.guessedBy?.[userId]) 
        ? word.text  // Show full word if purchased OR correctly guessed by this user
        : word.text.charAt(0) + '_'.repeat(word.text.length - 1) // Show only first letter
    }))
  };
}

export async function GET() {
  try {
    const challenges = await readChallenges();
    const sanitizedChallenges = challenges.map(sanitizeChallengeForClient);
    return NextResponse.json(sanitizedChallenges);
  } catch (error) {
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
    if (!(await canAfford(createdBy, prizeAmount))) {
      return NextResponse.json({ error: 'Insufficient funds to create this challenge' }, { status: 400 });
    }

    // Deduct prize amount from creator's wallet upfront
    await updateUserWallet(createdBy, -prizeAmount);

    // Parse words and identify purchasable ones
    const words = sentence.split(' ').map((word: string, index: number) => ({
      text: word,
      position: index,
      isPurchased: false,
      purchasedBy: null,
      purchaseTime: null
    }));

    // For hackathon: make every 3rd word purchasable (simplified logic)
    words.forEach((word, index) => {
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}

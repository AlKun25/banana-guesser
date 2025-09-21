import { NextRequest, NextResponse } from 'next/server';
import { readChallenges, writeChallenges } from '@/lib/data';
import { updateUserWallet } from '@/lib/wallet';

const WINNING_REWARD = 50; // $50 for solving a challenge

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { guess, userId } = await request.json();
    
    if (!userId || !guess?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const challenges = await readChallenges();
    const challengeIndex = challenges.findIndex(c => c.id === id);
    
    if (challengeIndex === -1) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const challenge = challenges[challengeIndex];
    
    if (challenge.solvedBy) {
      return NextResponse.json({ error: 'Challenge already solved' }, { status: 400 });
    }

    // Normalize both strings for comparison
    const normalizeText = (text: string) => 
      text.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');

    const normalizedGuess = normalizeText(guess);
    const normalizedSentence = normalizeText(challenge.sentence);

    const isCorrect = normalizedGuess === normalizedSentence;

    if (isCorrect) {
      // Mark challenge as solved
      challenge.solvedBy = userId;
      challenge.isActive = false;
      
      // Make all words visible
      challenge.words.forEach(word => {
        word.isPurchased = true;
      });

      await writeChallenges(challenges);

      // Reward the solver
      await updateUserWallet(userId, WINNING_REWARD);

      return NextResponse.json({
        correct: true,
        message: 'Congratulations! You solved the challenge!',
        reward: WINNING_REWARD,
        solution: challenge.sentence
      });
    } else {
      return NextResponse.json({
        correct: false,
        message: 'Incorrect guess. Try again!',
        hint: `Your guess: "${guess}"`
      });
    }

  } catch (error) {
    console.error('Guess error:', error);
    return NextResponse.json({ error: 'Failed to process guess' }, { status: 500 });
  }
}

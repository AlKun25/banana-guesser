import { NextRequest, NextResponse } from 'next/server';
import { readChallenges, writeChallenges } from '@/lib/data';
import { addUserCredits } from '@/lib/stackauth-credits';

const WINNING_REWARD = 50; // 50 GC for solving a challenge

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
    
    // Check if challenge was already solved - for messaging/reward purposes
    const wasAlreadySolved = challenge.solvedBy !== null;

    // Normalize both strings for comparison
    const normalizeText = (text: string) => 
      text.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');

    const normalizedGuess = normalizeText(guess);
    const normalizedSentence = normalizeText(challenge.sentence);

    const isCorrect = normalizedGuess === normalizedSentence;

    if (isCorrect) {
      let message: string;
      let reward = 0;
      
      if (wasAlreadySolved) {
        // Challenge already solved - no reward
        message = 'Congratulations! You got the right answer! Unfortunately, you won\'t receive any reward as you weren\'t the first solver of this challenge.';
      } else {
        // First time being solved - award prize and mark as solved
        challenge.solvedBy = userId;
        challenge.isActive = false;
        reward = WINNING_REWARD;
        message = 'Congratulations! You solved the challenge!';
        
        // Make all words visible
        challenge.words.forEach(word => {
          word.isPurchased = true;
        });

        // Reward the solver
        await addUserCredits(userId, WINNING_REWARD);
      }

      await writeChallenges(challenges);

      return NextResponse.json({
        correct: true,
        message,
        reward,
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

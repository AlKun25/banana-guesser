import { NextRequest, NextResponse } from 'next/server';
import { readChallenges, writeChallenges } from '@/lib/data';
import { updateUserWallet } from '@/lib/wallet';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { guess, userId, wordIndex } = await request.json();
    
    if (!userId || !guess?.trim() || wordIndex === undefined) {
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

    if (wordIndex >= challenge.words.length) {
      return NextResponse.json({ error: 'Invalid word index' }, { status: 400 });
    }

    const word = challenge.words[wordIndex];

    // Check if user already guessed this word correctly
    if (word.guessedBy?.[userId]) {
      return NextResponse.json({ error: 'You already guessed this word correctly' }, { status: 400 });
    }

    // Normalize both strings for comparison
    const normalizeText = (text: string) => 
      text.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');

    const normalizedGuess = normalizeText(guess);
    const normalizedWord = normalizeText(word.text);

    const isCorrect = normalizedGuess === normalizedWord;

    if (isCorrect) {
      // Mark word as guessed by this user
      if (!word.guessedBy) {
        word.guessedBy = {};
      }
      word.guessedBy[userId] = true;

      // Check if user has now guessed ALL words to win the game
      const allWordsGuessed = challenge.words.every(w => 
        w.guessedBy?.[userId] === true // User must have guessed every single word
      );

      let message = `Correct! You guessed "${word.text}".`;
      let totalReward = 0;

      if (allWordsGuessed) {
        // User solved the entire challenge - award the full prize
        challenge.solvedBy = userId;
        challenge.isActive = false;
        totalReward = challenge.prizeAmount;
        message = `🎉 Congratulations! You solved the entire challenge! You won $${totalReward}!`;
        
        // Award the prize to the winner
        await updateUserWallet(userId, totalReward);
      }

      await writeChallenges(challenges);

      return NextResponse.json({
        correct: true,
        message,
        reward: totalReward,
        wordText: word.text,
        challengeSolved: allWordsGuessed,
        solution: allWordsGuessed ? challenge.sentence : undefined
      });
    } else {
      return NextResponse.json({
        correct: false,
        message: `Incorrect guess for this word. Try again!`,
        hint: `Your guess: "${guess}"`
      });
    }

  } catch (error) {
    console.error('Word guess error:', error);
    return NextResponse.json({ error: 'Failed to process word guess' }, { status: 500 });
  }
}

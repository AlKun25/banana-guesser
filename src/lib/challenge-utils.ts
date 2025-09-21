import { Challenge } from './types';

// Function to sanitize challenge data for client
export function sanitizeChallengeForClient(challenge: Challenge): Challenge {
  return {
    ...challenge,
    words: challenge.words.map(word => ({
      ...word,
      // Don't expose the actual word text to client unless it's been guessed or purchased
      text: word.isPurchased || (word.guessedBy && Object.keys(word.guessedBy).length > 0) ? word.text : '***',
      // Remove sensitive data by setting to null
      purchasedBy: null, // Don't expose who purchased
      guessedBy: undefined,   // Don't expose who guessed
    }))
  };
}

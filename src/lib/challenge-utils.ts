import { Challenge } from './types';
import { stackServerApp } from '@/stack/server';

// Function to get user display information
export async function getUserDisplayInfo(userId: string): Promise<{ displayName: string; profileImageUrl: string | null } | null> {
  try {
    const user = await stackServerApp.getUser(userId);
    if (!user) {
      return null;
    }
    return {
      displayName: user.displayName || 'Anonymous User',
      profileImageUrl: user.profileImageUrl || null
    };
  } catch (error) {
    console.error('Failed to get user display info:', error);
    return null;
  }
}

// Function to sanitize challenge data for client
export function sanitizeChallengeForClient(challenge: Challenge, userId?: string): Challenge {
  return {
    ...challenge,
    words: challenge.words.map(word => ({
      ...word,
      // Show full word if current user guessed it correctly, otherwise always show asterisks
      text: (userId && word.guessedBy?.[userId]) 
        ? word.text  // Show full word for correctly guessed (green)
        : '*'.repeat(word.text.length), // Show asterisks for all other states (gray/blue depending on purchase status)
      // Keep guessedBy data for the client to determine blue highlighting
      guessedBy: word.guessedBy,
      // Remove sensitive purchase data
      purchasedBy: null, // Don't expose who purchased
    }))
  };
}

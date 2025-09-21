'use client';

import { useState, useEffect } from 'react';
import { ChallengeCard } from '@/components/ChallengeCard';
import { Challenge } from '@/lib/types';

interface ChallengePageClientProps {
  challenge: Challenge;
  currentUserId: string;
  initialWallet: number;
}

export function ChallengePageClient({ 
  challenge: initialChallenge, 
  currentUserId, 
  initialWallet 
}: ChallengePageClientProps) {
  const [challenge, setChallenge] = useState<Challenge>(initialChallenge);
  const [wallet] = useState<number>(initialWallet);

  const refreshCredits = () => {
    // Credits will be updated automatically when user object refreshes
    // This function is kept for compatibility with existing code
  };

  const fetchChallenge = async () => {
    try {
      const response = await fetch(`/api/challenges/${challenge.id}`, {
        headers: {
          'x-user-id': currentUserId
        }
      });
      const data = await response.json();
      setChallenge(data);
    } catch (error) {
      console.error('Failed to fetch challenge:', error);
    }
  };

  // Update wallet display in header
  useEffect(() => {
    const walletElement = document.querySelector('[data-wallet-amount]');
    if (walletElement) {
      walletElement.textContent = `$${wallet}`;
    }
  }, [wallet]);

  return (
    <ChallengeCard 
      challenge={challenge}
      currentUserId={currentUserId}
      onWalletUpdate={refreshCredits}
      onChallengeUpdate={fetchChallenge}
    />
  );
}

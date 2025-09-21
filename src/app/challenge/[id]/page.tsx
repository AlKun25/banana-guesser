import { ChallengePageClient } from '@/components/ChallengePageClient';
import { stackServerApp } from '@/stack/server';
import { redirect } from 'next/navigation';
import { ArrowLeft, Wallet } from 'lucide-react';
import Link from 'next/link';
import { readChallenges } from '@/lib/data';
import { Challenge } from '@/lib/types';

interface ChallengePageProps {
  params: Promise<{
    id: string;
  }>;
}

// Function to sanitize challenge data for client (same as API route)
function sanitizeChallengeForClient(challenge: Challenge) {
  return {
    ...challenge,
    words: challenge.words.map(word => ({
      ...word,
      text: word.isPurchased ? '*'.repeat(word.text.length) : word.text.charAt(0) + '_'.repeat(word.text.length - 1)
    }))
  };
}

async function getChallenge(id: string) {
  try {
    const challenges = await readChallenges();
    const challenge = challenges.find(c => c.id === id);
    
    if (!challenge) {
      return null;
    }
    
    return sanitizeChallengeForClient(challenge);
  } catch (error) {
    console.error('Failed to fetch challenge:', error);
    return null;
  }
}

async function getUserWallet(userId: string) {
  try {
    const { getUserWallet: getWallet } = await import('@/lib/wallet');
    return await getWallet(userId);
  } catch (error) {
    console.error('Failed to fetch wallet:', error);
    return 0;
  }
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { id } = await params;
  const user = await stackServerApp.getUser();
  
  if (!user) {
    redirect('/handler/sign-in');
  }

  const challenge = await getChallenge(id);
  
  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Challenge Not Found</h1>
          <p className="text-gray-600 mb-6">The challenge you're looking for doesn't exist or has been removed.</p>
          <Link 
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Challenges</span>
          </Link>
        </div>
      </div>
    );
  }

  const wallet = await getUserWallet(user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Challenges</span>
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-900">Challenge #{challenge.id.slice(0, 8)}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <Wallet className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium" data-wallet-amount>${wallet}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <img 
                  src={user.profileImageUrl || '/default-avatar.png'} 
                  alt={user.displayName || 'User'} 
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-gray-700">{user.displayName}</span>
              </div>
              
              <a 
                href="/handler/account-settings"
                className="text-gray-500 hover:text-gray-700"
              >
                Settings
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ChallengePageClient 
          challenge={challenge}
          currentUserId={user.id}
          initialWallet={wallet}
        />
      </main>
    </div>
  );
}

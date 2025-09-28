import { ChallengePageClient } from '@/components/ChallengePageClient';
import { stackServerApp } from '@/stack/server';
import { redirect } from 'next/navigation';
import { ArrowLeft, Wallet } from 'lucide-react';
import Link from 'next/link';
import { readChallenges } from '@/lib/data';
import { sanitizeChallengeForClient, getUserDisplayInfo } from '@/lib/challenge-utils';

interface ChallengePageProps {
  params: Promise<{
    id: string;
  }>;
}


async function getChallenge(id: string) {
  try {
    const challenges = await readChallenges();
    const challenge = challenges.find(c => c.id === id);

    if (!challenge) {
      return null;
    }

    // Enrich challenge with creator display information
    const creatorInfo = await getUserDisplayInfo(challenge.createdBy);
    return {
      ...challenge,
      createdByDisplayName: creatorInfo?.displayName || 'Anonymous User',
      createdByProfileImage: creatorInfo?.profileImageUrl || null
    };
  } catch (error) {
    console.error('Failed to fetch challenge:', error);
    return null;
  }
}

async function getUserCredits(userId: string) {
  try {
    const { getUserCredits: getCredits } = await import('@/lib/stackauth-credits');
    return await getCredits(userId);
  } catch (error) {
    console.error('Failed to get user credits:', error);
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
          <p className="text-gray-600 mb-6">The challenge you&apos;re looking for doesn&apos;t exist or has been removed.</p>
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

  const wallet = await getUserCredits(user.id);

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
              <a 
                href="/credits"
                className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full hover:bg-green-200 transition-colors cursor-pointer"
                title="View credits and refill status"
              >
                <Wallet className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium" data-wallet-amount>{wallet} GC</span>
              </a>

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
          challenge={sanitizeChallengeForClient(challenge, user.id)}
          currentUserId={user.id}
          initialWallet={wallet}
        />
      </main>
    </div>
  );
}

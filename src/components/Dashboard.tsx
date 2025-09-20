'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@stackframe/stack';
import { Plus, Wallet } from 'lucide-react';
import { Challenge } from '@/lib/types';
import { ChallengeCard } from './ChallengeCard';
import { CreateChallengeModal } from './CreateChallengeModal';
import { getUserWallet } from '@/lib/wallet';

export function Dashboard() {
  const user = useUser();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [wallet, setWallet] = useState<number>(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/challenges');
      const data = await response.json();
      setChallenges(data);
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/wallet/${user.id}`);
      const data = await response.json();
      setWallet(data.wallet);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    }
  };

  const handleChallengeCreated = (newChallenge: Challenge) => {
    setChallenges(prev => [newChallenge, ...prev]);
    setShowCreateModal(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Word Reveal Game</h1>
          <p className="text-gray-600 mb-4">Please sign in to continue</p>
          <a 
            href="/handler/sign-in"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Word Reveal Game</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <Wallet className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium">${wallet}</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading challenges...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Empty State */}
            {challenges.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">No challenges yet!</h2>
                <p className="text-gray-600 mb-6">Be the first to create a word reveal challenge</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Challenge</span>
                </button>
              </div>
            ) : (
              <>
                {/* Challenge Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {challenges.map((challenge) => (
                    <ChallengeCard 
                      key={challenge.id} 
                      challenge={challenge}
                      currentUserId={user.id}
                      onWalletUpdate={fetchWallet}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <CreateChallengeModal
          onClose={() => setShowCreateModal(false)}
          onChallengeCreated={handleChallengeCreated}
          userId={user.id}
        />
      )}
    </div>
  );
}

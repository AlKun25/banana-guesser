'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@stackframe/stack';
import { Plus, Wallet, RefreshCw } from 'lucide-react';
import { Challenge } from '@/lib/types';
import { ChallengePreview } from '@/components/ChallengePreview';
import { CreateChallengeModal } from '@/components/CreateChallengeModal';
import { useToast } from '@/components/ToastProvider';

export function Dashboard() {
  const user = useUser();
  const { showToast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [wallet, setWallet] = useState<number>(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  
  const fetchChallenges = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      const response = await fetch('/api/challenges', {
        headers: user?.id ? {
          'x-user-id': user.id
        } : {}
      });
      const data = await response.json();
      setChallenges(data);
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    fetchChallenges(true);
    showToast('Refreshing challenges...', 'info', 2000);
  };
  
  const fetchWallet = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/wallet/${user.id}`);
      const data = await response.json();
      setWallet(data.wallet);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    }
  }, [user]);
  
  useEffect(() => {
    fetchChallenges();
    if (user) {
      fetchWallet();
    }
  }, [user, fetchWallet]);
  
  const handleChallengeCreated = (newChallenge: Challenge) => {
    setChallenges(prev => [newChallenge, ...prev]);
    setShowCreateModal(false);
    
    // Start polling for image generation updates for the new challenge
    pollForChallengeImageGeneration(newChallenge.id);
  };

  const pollForChallengeImageGeneration = (challengeId: string) => {
    const checkImageGeneration = async () => {
      try {
        const response = await fetch('/api/challenges');
        const data = await response.json();
        const updatedChallenge = data.find((c: Challenge) => c.id === challengeId);
        
        if (updatedChallenge && updatedChallenge.imageUrl) {
          // Image is ready, update the challenges list
          setChallenges(prev => 
            prev.map(c => c.id === challengeId ? updatedChallenge : c)
          );
          return true; // Stop polling
        }
        
        // Check if generation might have failed (after 60 seconds)
        const challengeAge = new Date().getTime() - new Date(updatedChallenge?.createdAt || 0).getTime();
        if (challengeAge > 60000) {
          // Refresh challenges to get the latest status
          setChallenges(prev => 
            prev.map(c => c.id === challengeId ? (updatedChallenge || c) : c)
          );
          return true; // Stop polling
        }
      } catch (error) {
        console.error('Error checking image generation:', error);
      }
      return false; // Continue polling
    };

    // Poll every 3 seconds for up to 2 minutes
    let attempts = 0;
    const maxAttempts = 40; // 2 minutes
    
    const pollInterval = setInterval(async () => {
      attempts++;
      const completed = await checkImageGeneration();
      
      if (completed || attempts >= maxAttempts) {
        clearInterval(pollInterval);
      }
    }, 3000);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Banana Guesser 🍌</h1>
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
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Banana Guesser 🍌</h1>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Refresh challenges"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <a 
                href="/payments"
                className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full hover:bg-green-200 transition-colors cursor-pointer"
                title="Click to add credits"
              >
                <Wallet className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium">${(wallet / 100).toFixed(2)}</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                  {challenges.map((challenge) => (
                    <ChallengePreview 
                      key={challenge.id} 
                      challenge={challenge}
                      currentUserId={user.id}
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

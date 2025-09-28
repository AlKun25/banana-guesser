'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@stackframe/stack';
import { Trophy, Wallet, Coins } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

interface PaymentsPageClientProps {
  initialWallet: number;
}

export function PaymentsPageClient({ initialWallet }: PaymentsPageClientProps) {
  const user = useUser();
  const { showToast } = useToast();
  const [wallet, setWallet] = useState<number>(initialWallet);

  const refreshWallet = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/wallet/${user.id}`);
      const data = await response.json();
      const newWallet = data.wallet;
      
      setWallet(newWallet);
      
      // Update the header wallet display
      const walletElement = document.querySelector('[data-wallet-amount]');
      if (walletElement) {
        walletElement.textContent = `${newWallet} GC`;
      }
    } catch (error) {
      console.error('Failed to refresh wallet:', error);
    }
  }, [user, showToast]);

  // Refresh wallet when component mounts
  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  const earningMethods = [
    {
      title: 'Complete Challenges',
      amount: 'Prize Amount',
      description: 'Win the full prize by solving word challenges',
      icon: Trophy,
      color: 'blue'
    },
    {
      title: 'Create Popular Challenges',
      amount: 'Varies',
      description: 'Get recognition when your challenges are played',
      icon: Coins,
      color: 'green'
    },
    {
      title: 'Daily Bonus',
      amount: '5 GC',
      description: 'Coming soon - daily login rewards',
      icon: Wallet,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <Coins className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Earn Game Credits (GC)</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Earn Game Credits by playing and creating challenges. Use GC to create challenges, 
          unlock word hints, and participate in the game.
        </p>
        <div className="mt-4 inline-flex items-center space-x-2 bg-yellow-100 px-4 py-2 rounded-full">
          <Wallet className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-800 font-medium">Current Balance: {wallet} GC</span>
        </div>
      </div>

      {/* Earning Methods */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {earningMethods.map((method, index) => {
          const IconComponent = method.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border-2 border-gray-200 hover:border-gray-300 p-6 text-center transition-colors"
            >
              <div className="mb-4">
                <div className="flex justify-center mb-2">
                  <div className={`p-3 rounded-full ${
                    method.color === 'blue' ? 'bg-blue-100' :
                    method.color === 'green' ? 'bg-green-100' :
                    'bg-purple-100'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      method.color === 'blue' ? 'text-blue-600' :
                      method.color === 'green' ? 'text-green-600' :
                      'text-purple-600'
                    }`} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{method.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{method.description}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Reward:</span>
                    <span className="font-medium">{method.amount}</span>
                  </div>
                </div>
              </div>

              <div className={`w-full py-3 px-4 rounded-lg font-medium ${
                method.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                method.color === 'green' ? 'bg-green-100 text-green-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {method.title === 'Daily Bonus' ? 'Coming Soon' : 'Available Now'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
        <h3 className="font-medium text-blue-900 mb-2">How Game Credits Work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Everyone starts with 20 GC when they sign up</li>
          <li>• Create challenges: Prize amount is deducted from your wallet upfront</li>
          <li>• Purchase word hints: 5 GC per word for exclusive access</li>
          <li>• Win prizes: Earn the full prize amount by solving complete challenges</li>
          <li>• All Game Credits are earned through gameplay - no purchases required</li>
        </ul>
      </div>
    </div>
  );
}

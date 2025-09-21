'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@stackframe/stack';
import { CreditCard, Wallet, DollarSign } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

interface PaymentsPageClientProps {
  initialWallet: number;
}

export function PaymentsPageClient({ initialWallet }: PaymentsPageClientProps) {
  const user = useUser();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [wallet, setWallet] = useState<number>(initialWallet);
  const [checkoutOpened, setCheckoutOpened] = useState<string | null>(null);

  const refreshWallet = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`/api/wallet/${user.id}`);
      const data = await response.json();
      const newWallet = data.wallet;
      
      // Check if wallet increased (payment successful)
      if (newWallet > wallet && checkoutOpened) {
        const creditsPurchased = newWallet - wallet;
        showToast(`Payment successful! Added ${creditsPurchased} credits to your wallet.`, 'success', 5000);
        setCheckoutOpened(null);
      }
      
      setWallet(newWallet);
      
      // Update the header wallet display
      const walletElement = document.querySelector('[data-wallet-amount]');
      if (walletElement) {
        walletElement.textContent = `$${newWallet}`;
      }
    } catch (error) {
      console.error('Failed to refresh wallet:', error);
    }
  }, [user, wallet, checkoutOpened, showToast]);

  // Listen for window focus to detect when user returns from checkout
  useEffect(() => {
    const handleWindowFocus = () => {
      if (checkoutOpened) {
        // Delay refresh to allow payment processing
        setTimeout(() => {
          refreshWallet();
        }, 1000);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [checkoutOpened, refreshWallet]);

  const handlePurchase = async (amount: number, offerId: string) => {
    if (!user) {
      showToast('Please sign in to purchase credits', 'error');
      return;
    }

    setLoading(offerId);
    
    try {
      const checkoutUrl = await user.createCheckoutUrl({ offerId });
      window.open(checkoutUrl, "_blank");
      setCheckoutOpened(offerId);
      showToast(`Opening checkout for $${amount} credits...`, 'info');
    } catch (error) {
      console.error('Failed to create checkout URL:', error);
      showToast('Failed to open checkout. Please try again.', 'error');
    } finally {
      setLoading(null);
    }
  };

  const creditOptions = [
    {
      amount: 1,
      offerId: 'offer-3',
      description: 'Perfect for trying out the game',
      popular: false
    },
    {
      amount: 5,
      offerId: 'offer',
      description: 'Great for casual gaming',
      popular: true
    },
    {
      amount: 1000,
      offerId: 'offer-5',
      description: 'Best value for serious players',
      popular: false
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-green-100 p-3 rounded-full">
            <Wallet className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Credits to Your Wallet</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Purchase credits to create challenges, unlock word hints, and participate in the game. 
          Credits are used for creating challenges and purchasing word access.
        </p>
      </div>

      {/* Credit Options */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {creditOptions.map((option) => (
          <div
            key={option.offerId}
            className={`relative bg-white rounded-lg shadow-sm border-2 p-6 text-center ${
              option.popular 
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-gray-300'
            } transition-colors`}
          >
            {option.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-4">
              <div className="flex justify-center mb-2">
                <div className={`p-3 rounded-full ${
                  option.popular ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <DollarSign className={`w-6 h-6 ${
                    option.popular ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">${option.amount}</h3>
              <p className="text-sm text-gray-500 mt-1">{option.description}</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Credits:</span>
                  <span className="font-medium">${option.amount}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePurchase(option.amount, option.offerId)}
              disabled={loading === option.offerId}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                option.popular
                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                  : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400'
              } disabled:cursor-not-allowed`}
            >
              {loading === option.offerId ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Opening Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Purchase ${option.amount}</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
        <h3 className="font-medium text-blue-900 mb-2">How Credits Work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Create challenges: Prize amount is deducted from your wallet upfront</li>
          <li>• Purchase word hints: $5 per word for 20-second exclusive access</li>
          <li>• Win prizes: Earn credits by solving complete challenges</li>
          <li>• Secure payments: All transactions are processed securely</li>
        </ul>
      </div>
    </div>
  );
}

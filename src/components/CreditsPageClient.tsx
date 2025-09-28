'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coins, Clock, Zap, Info } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

interface RefillStatus {
  isEligible: boolean;
  currentCredits: number;
  nextRefillAt: Date | null;
  timeUntilRefill: number;
}

interface CreditsPageClientProps {
  initialCredits: number;
  userId: string;
}

export function CreditsPageClient({ initialCredits, userId }: CreditsPageClientProps) {
  const { showToast } = useToast();
  const [credits, setCredits] = useState<number>(initialCredits);
  const [refillStatus, setRefillStatus] = useState<RefillStatus | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const fetchRefillStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/credits/${userId}`);
      const status: RefillStatus = await response.json();
      setRefillStatus(status);
      setCredits(status.currentCredits);
      
      // Update header display
      const walletElement = document.querySelector('[data-wallet-amount]');
      if (walletElement) {
        walletElement.textContent = `${status.currentCredits} GC`;
      }
    } catch (error) {
      console.error('Failed to fetch refill status:', error);
    }
  }, [userId]);

  const formatTimeRemaining = useCallback((milliseconds: number) => {
    if (milliseconds <= 0) return '00:00:00';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const processRefill = useCallback(async () => {
    try {
      const response = await fetch(`/api/credits/${userId}`, { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        showToast(`Refilled ${result.creditsAdded} GC! Balance: ${result.newBalance} GC`, 'success');
        setCredits(result.newBalance);
        fetchRefillStatus(); // Refresh status
      }
    } catch (error) {
      console.error('Failed to process refill:', error);
    }
  }, [userId, showToast, fetchRefillStatus]);

  // Fetch refill status on component mount
  useEffect(() => {
    fetchRefillStatus();
  }, [fetchRefillStatus]);

  // Update time remaining every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (refillStatus && refillStatus.isEligible && refillStatus.nextRefillAt) {
        const now = Date.now();
        const timeUntil = new Date(refillStatus.nextRefillAt).getTime() - now;
        setTimeRemaining(formatTimeRemaining(Math.max(0, timeUntil)));
        
        // Check if refill is ready
        if (timeUntil <= 0) {
          processRefill();
        }
      }
    }, 1000); // Update every second

    // Initial calculation
    if (refillStatus && refillStatus.isEligible && refillStatus.nextRefillAt) {
      const now = Date.now();
      const timeUntil = new Date(refillStatus.nextRefillAt).getTime() - now;
      setTimeRemaining(formatTimeRemaining(Math.max(0, timeUntil)));
    }

    return () => clearInterval(interval);
  }, [refillStatus, formatTimeRemaining, processRefill]);

  // Auto-process refill when ready
  useEffect(() => {
    if (refillStatus && refillStatus.isEligible && refillStatus.timeUntilRefill <= 0) {
      processRefill();
    }
  }, [refillStatus]);

  const getRefillProgress = () => {
    if (!refillStatus || !refillStatus.isEligible) return 100;
    
    const totalTime = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    const remaining = Math.max(0, refillStatus.timeUntilRefill);
    const elapsed = totalTime - remaining;
    return Math.min(100, (elapsed / totalTime) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Coins className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Game Credits</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Manage your Game Credits balance and track automatic refills
        </p>
      </div>

      {/* Credits Display */}
      <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="mb-6">
          <div className="text-5xl font-bold text-blue-600 mb-2">{credits}</div>
          <div className="text-lg text-gray-600">Game Credits</div>
        </div>

        {/* Refill Status */}
        {refillStatus && (
          <div className="mt-8">
            {refillStatus.isEligible ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-green-600 mr-2" />
                  <h3 className="font-medium text-gray-800">Auto-Refill Active</h3>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Next refill: +{Math.min(5, 20 - credits)} GC (to reach 20 GC)</span>
                    <span className="font-mono text-lg text-gray-800">{timeRemaining}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-green-500 h-4 rounded-full transition-all duration-1000"
                      style={{ width: `${getRefillProgress()}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 text-center">
                  You'll receive credits every 6 hours to reach exactly 20 GC (no overfill)
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="w-6 h-6 text-green-600 mr-2" />
                  <h3 className="font-medium text-green-800">You're All Set!</h3>
                </div>
                <p className="text-sm text-green-700">
                  {credits >= 20 
                    ? "You have enough credits. Auto-refill will activate when you drop below 20 GC."
                    : "Auto-refill is not active. You have sufficient credits."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <Info className="w-6 h-6 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">How Auto-Refill Works</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Auto-refill only activates when you have less than 20 GC</li>
              <li>• You'll receive just enough GC every 6 hours to reach exactly 20 GC (never overfilled)</li>
              <li>• If you earn credits from winning challenges and exceed 20 GC, auto-refill stops</li>
              <li>• Word unlock costs vary per challenge: Prize Amount ÷ Number of Words (minimum 1 GC)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

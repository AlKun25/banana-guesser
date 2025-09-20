'use client';

import { useState, useEffect } from 'react';
import { Challenge } from '@/lib/types';
import { Clock, DollarSign, Eye, Trophy, Timer } from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId: string;
  onWalletUpdate: () => void;
}

interface PurchasedWord {
  wordIndex: number;
  wordText: string;
  expiresAt: Date;
}

export function ChallengeCard({ challenge, currentUserId, onWalletUpdate }: ChallengeCardProps) {
  const [purchasedWords, setPurchasedWords] = useState<PurchasedWord[]>([]);
  const [guess, setGuess] = useState('');
  const [showGuessInput, setShowGuessInput] = useState(false);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  // Timer effect for purchased words
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setPurchasedWords(prev => prev.filter(pw => pw.expiresAt > now));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleWordClick = async (wordIndex: number) => {
    if (challenge.words[wordIndex].isPurchased || purchasing === wordIndex) return;
    
    setPurchasing(wordIndex);
    setMessage('');

    try {
      const response = await fetch(`/api/challenges/${challenge.id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wordIndex,
          userId: currentUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to purchase word');
      }

      // Add to purchased words with timer
      setPurchasedWords(prev => [...prev, {
        wordIndex,
        wordText: data.wordText,
        expiresAt: new Date(data.accessExpiresAt),
      }]);

      setMessage(`Word revealed for 20 seconds! Cost: $${data.cost}`);
      onWalletUpdate();

    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to purchase word');
    } finally {
      setPurchasing(null);
    }
  };

  const handleGuessSubmit = async () => {
    if (!guess.trim()) return;
    
    try {
      const response = await fetch(`/api/challenges/${challenge.id}/guess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guess: guess.trim(),
          userId: currentUserId,
        }),
      });

      const data = await response.json();

      if (data.correct) {
        setMessage(`🎉 ${data.message} You earned $${data.reward}!`);
        onWalletUpdate();
        // Refresh the page to show the solved state
        window.location.reload();
      } else {
        setMessage(`❌ ${data.message}`);
      }

    } catch (error) {
      setMessage('Failed to submit guess');
    }

    setGuess('');
    setShowGuessInput(false);
  };

  const renderWord = (word: any, index: number) => {
    // Check if word is currently purchased by current user
    const purchasedWord = purchasedWords.find(pw => pw.wordIndex === index);
    
    if (word.isPurchased || purchasedWord) {
      const timeLeft = purchasedWord ? Math.ceil((purchasedWord.expiresAt.getTime() - new Date().getTime()) / 1000) : 0;
      
      return (
        <span key={index} className="relative">
          <span className={`font-medium ${purchasedWord ? 'text-blue-600' : 'text-green-600'}`}>
            {purchasedWord ? purchasedWord.wordText : word.text}
          </span>
          {purchasedWord && timeLeft > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full">
              {timeLeft}s
            </span>
          )}
        </span>
      );
    }
    
    if (purchasing === index) {
      return (
        <span key={index} className="bg-yellow-300 text-yellow-800 px-2 py-1 rounded animate-pulse">
          Purchasing...
        </span>
      );
    }
    
    return (
      <button
        key={index}
        onClick={() => handleWordClick(index)}
        className="bg-gray-300 text-gray-600 px-2 py-1 rounded hover:bg-gray-400 transition-colors cursor-pointer"
        title="Click to purchase word access ($5 for 20 seconds)"
      >
        {'_'.repeat(word.text.length)}
      </button>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image */}
      <div className="h-48 bg-gray-200 flex items-center justify-center">
        {challenge.imageUrl ? (
          <img 
            src={challenge.imageUrl} 
            alt="Challenge" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-500 text-center">
            <Eye className="w-12 h-12 mx-auto mb-2" />
            <p>Image generating...</p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Sentence with words */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 text-lg leading-relaxed">
            {challenge.words.map((word, index) => (
              <span key={index}>
                {renderWord(word, index)}
                {index < challenge.words.length - 1 && ' '}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4" />
              <span>$5/word</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>20s access</span>
            </div>
          </div>
          
          {challenge.solvedBy && (
            <div className="flex items-center space-x-1 text-yellow-600">
              <Trophy className="w-4 h-4" />
              <span>Solved</span>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`p-2 rounded text-sm ${
            message.includes('🎉') ? 'bg-green-100 text-green-700' :
            message.includes('❌') ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {!challenge.solvedBy && (
            <button
              onClick={() => setShowGuessInput(!showGuessInput)}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Guess Sentence
            </button>
          )}

          {showGuessInput && (
            <div className="space-y-2">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Enter your guess..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleGuessSubmit()}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleGuessSubmit}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Submit
                </button>
                <button
                  onClick={() => setShowGuessInput(false)}
                  className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Creator info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Created by User {challenge.createdBy.slice(0, 8)}...
          </p>
        </div>
      </div>
    </div>
  );
}

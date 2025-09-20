'use client';

import { useState, useEffect } from 'react';
import { Challenge } from '@/lib/types';
import { Clock, DollarSign, Eye, Trophy, Timer, AlertTriangle, RefreshCw } from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId: string;
  onWalletUpdate: () => void;
}

interface PurchasedWord {
  wordIndex: number;
  wordLength: number;
  expiresAt: Date;
}

export function ChallengeCard({ challenge, currentUserId, onWalletUpdate }: ChallengeCardProps) {
  const [purchasedWords, setPurchasedWords] = useState<PurchasedWord[]>([]);
  const [guess, setGuess] = useState('');
  const [showGuessInput, setShowGuessInput] = useState(false);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [imageError, setImageError] = useState(false);
  const [retryingImage, setRetryingImage] = useState(false);
  const [currentDisplayImage, setCurrentDisplayImage] = useState<string | null>(null);
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [showingWordImage, setShowingWordImage] = useState<number | null>(null);

  // Timer effect for purchased words
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setPurchasedWords(prev => prev.filter(pw => pw.expiresAt > now));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check if image generation might have failed (no image after some time)
  useEffect(() => {
    if (!challenge.imageUrl && !imageError) {
      // If challenge is older than 30 seconds and still no image, assume it failed
      const challengeAge = new Date().getTime() - new Date(challenge.createdAt).getTime();
      if (challengeAge > 30000) { // 30 seconds
        setImageError(true);
      }
    }
  }, [challenge.imageUrl, challenge.createdAt, imageError]);

  // Handle showing word-specific images temporarily
  useEffect(() => {
    if (showingWordImage !== null) {
      const timer = setTimeout(() => {
        setShowingWordImage(null);
        setCurrentDisplayImage(null);
      }, 5000); // Show for 5 seconds

      return () => clearTimeout(timer);
    }
  }, [showingWordImage]);

  const handleRetryImageGeneration = async () => {
    setRetryingImage(true);
    setImageError(false);
    setMessage('');

    try {
      const response = await fetch(`/api/challenges/${challenge.id}/generate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.imageUrl) {
        setMessage('Image generated successfully! Please refresh the page to see it.');
        setImageError(false);
      } else {
        throw new Error(data.details || data.error || 'Failed to generate image');
      }

    } catch (error) {
      setImageError(true);
      setMessage(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRetryingImage(false);
    }
  };

  const handleWordClick = async (wordIndex: number) => {
    if (challenge.words[wordIndex].isPurchased || 
        challenge.words[wordIndex].isGenerating || 
        purchasing === wordIndex) return;
    
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
        wordLength: data.wordLength,
        expiresAt: new Date(data.accessExpiresAt),
      }]);

      setMessage(`Word purchased! Generating image... Cost: $${data.cost}`);
      onWalletUpdate();

      // Poll for image generation completion
      pollForWordImageCompletion(wordIndex);

    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to purchase word');
    } finally {
      setPurchasing(null);
    }
  };

  const pollForWordImageCompletion = async (wordIndex: number) => {
    const checkCompletion = async () => {
      try {
        const response = await fetch(`/api/challenges/${challenge.id}`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const updatedChallenge = await response.json();
          const word = updatedChallenge.words[wordIndex];
          
          if (word.imageReady && updatedChallenge.wordImages?.[wordIndex]) {
            // Image is ready! Show it for 5 seconds
            setCurrentDisplayImage(updatedChallenge.wordImages[wordIndex]);
            setShowingWordImage(wordIndex);
            setMessage(`Word image generated! Showing for 5 seconds...`);
            return true; // Stop polling
          } else if (word.generationFailed) {
            setMessage(`Word image generation failed. You can still see the word.`);
            return true; // Stop polling
          }
        }
      } catch (error) {
        console.error('Error checking word image status:', error);
      }
      return false; // Continue polling
    };

    // Poll every 2 seconds for up to 60 seconds
    let attempts = 0;
    const maxAttempts = 30;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      const completed = await checkCompletion();
      
      if (completed || attempts >= maxAttempts) {
        clearInterval(pollInterval);
        if (attempts >= maxAttempts) {
          setMessage(`Word image generation is taking longer than expected.`);
        }
      }
    }, 2000);
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
        setShowGuessInput(false);
      } else {
        setMessage(data.message);
      }

    } catch (error) {
      setMessage('Failed to submit guess');
    }

    setGuess('');
  };

  const getWordBoxClass = (word: any, index: number) => {
    if (purchasing === index) {
      return "bg-yellow-300 text-yellow-800 px-2 py-1 rounded animate-pulse";
    }
    
    if (word.isGenerating) {
      return "bg-yellow-400 text-yellow-900 px-2 py-1 rounded animate-pulse";
    }
    
    if (word.imageReady) {
      return "bg-green-400 text-green-900 px-2 py-1 rounded cursor-pointer hover:bg-green-500 transition-colors";
    }
    
    if (word.generationFailed) {
      return "bg-orange-400 text-orange-900 px-2 py-1 rounded";
    }
    
    if (word.isPurchased) {
      return "bg-blue-400 text-blue-900 px-2 py-1 rounded";
    }
    
    return "bg-gray-300 text-gray-600 px-2 py-1 rounded hover:bg-gray-400 transition-colors cursor-pointer";
  };

  const handleWordHover = (wordIndex: number) => {
    const word = challenge.words[wordIndex];
    if (word.imageReady && challenge.wordImages?.[wordIndex]) {
      setHoveredWordIndex(wordIndex);
      setCurrentDisplayImage(challenge.wordImages[wordIndex]);
    }
  };

  const handleWordLeave = () => {
    if (hoveredWordIndex !== null && showingWordImage === null) {
      setHoveredWordIndex(null);
      setCurrentDisplayImage(null);
    }
  };

  const renderWord = (word: any, index: number) => {
    // Check if word is currently purchased by current user
    const purchasedWord = purchasedWords.find(pw => pw.wordIndex === index);
    
    if (word.isPurchased || purchasedWord || word.isGenerating || word.imageReady || word.generationFailed) {
      const timeLeft = purchasedWord ? Math.ceil((purchasedWord.expiresAt.getTime() - new Date().getTime()) / 1000) : 0;
      
      // Show asterisks instead of actual word text
      const displayText = purchasedWord 
        ? '*'.repeat(purchasedWord.wordLength)
        : '*'.repeat(word.text.length);
      
      return (
        <span 
          key={index} 
          className="relative"
          onMouseEnter={() => handleWordHover(index)}
          onMouseLeave={handleWordLeave}
        >
          <span className={getWordBoxClass(word, index)}>
            {displayText}
          </span>
          {purchasedWord && timeLeft > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full">
              {timeLeft}s
            </span>
          )}
          {word.isGenerating && (
            <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded-full">
              ⏳
            </span>
          )}
          {word.imageReady && (
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full">
              ✓
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

  const getDisplayImage = () => {
    if (currentDisplayImage) {
      return currentDisplayImage;
    }
    return challenge.imageUrl;
  };

  const renderImageSection = () => {
    const displayImage = getDisplayImage();
    
    if (displayImage) {
      return (
        <div className="relative">
          <img 
            src={displayImage} 
            alt="Challenge" 
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          {showingWordImage !== null && (
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
              Word image (5s remaining)
            </div>
          )}
          {hoveredWordIndex !== null && showingWordImage === null && (
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
              Hover preview - Word {hoveredWordIndex + 1}
            </div>
          )}
        </div>
      );
    }

    if (imageError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
          <AlertTriangle className="w-8 h-8 mb-2" />
          <p className="text-sm text-center mb-3">Image generation failed</p>
          <button
            onClick={handleRetryImageGeneration}
            disabled={retryingImage}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${retryingImage ? 'animate-spin' : ''}`} />
            <span>{retryingImage ? 'Retrying...' : 'Retry'}</span>
          </button>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm">Generating image...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Challenge Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Challenge #{challenge.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{new Date(challenge.createdAt).toLocaleDateString()}</span>
            </div>
            {challenge.solvedBy && (
              <div className="flex items-center space-x-1 text-sm text-green-600">
                <Trophy className="w-4 h-4" />
                <span>Solved</span>
              </div>
            )}
          </div>
        </div>

        {/* Challenge Image */}
        <div className="w-full h-64 bg-gray-50 rounded-lg overflow-hidden mb-4">
          {renderImageSection()}
        </div>

        {/* Word Puzzle */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Guess the sentence:</h3>
          <div className="flex flex-wrap gap-2 text-lg leading-relaxed">
            {challenge.words.map((word, index) => (
              <span key={index}>
                {renderWord(word, index)}
                {index < challenge.words.length - 1 && <span className="mx-1"> </span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Section */}
      <div className="p-6 bg-gray-50">
        {!challenge.solvedBy && (
          <div className="space-y-4">
            {!showGuessInput ? (
              <button
                onClick={() => setShowGuessInput(true)}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Make a Guess
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Enter your guess for the complete sentence..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleGuessSubmit()}
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleGuessSubmit}
                    disabled={!guess.trim()}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Submit Guess
                  </button>
                  <button
                    onClick={() => {
                      setShowGuessInput(false);
                      setGuess('');
                    }}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Game Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How to Play:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click gray boxes to purchase word hints ($5 each, 20 seconds access)</li>
            <li>• Yellow box = generating image without that word</li>
            <li>• Green box = ready! Hover to preview the modified image</li>
            <li>• Solve the complete sentence to win $50!</li>
          </ul>
        </div>

        {/* Status Messages */}
        {message && (
          <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
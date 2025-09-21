'use client';

import { useState, useEffect } from 'react';
import { Challenge } from '@/lib/types';
import { Clock, DollarSign, Eye, Trophy, Timer, AlertTriangle, RefreshCw } from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId: string;
  onWalletUpdate: () => void;
  onChallengeUpdate?: () => void;
}

interface PurchasedWord {
  wordIndex: number;
  wordLength: number;
}

export function ChallengeCard({ challenge, currentUserId, onWalletUpdate, onChallengeUpdate }: ChallengeCardProps) {
  const [purchasedWords, setPurchasedWords] = useState<PurchasedWord[]>([]);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [imageError, setImageError] = useState(false);
  const [retryingImage, setRetryingImage] = useState(false);
  const [currentDisplayImage, setCurrentDisplayImage] = useState<string | null>(null);
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [showingWordImage, setShowingWordImage] = useState<number | null>(null);
  const [editingWordIndex, setEditingWordIndex] = useState<number | null>(null);
  const [wordGuesses, setWordGuesses] = useState<Record<number, string>>({});

  // No timer needed anymore - purchases are permanent until guessed

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

  const handleWordClick = (wordIndex: number) => {
    const word = challenge.words[wordIndex];
    
    // Check if user already guessed this word correctly
    if (word.guessedBy?.[currentUserId]) {
      setMessage('You already guessed this word correctly!');
      return;
    }
    
    // Start editing this word (inline typing)
    setEditingWordIndex(wordIndex);
    setWordGuesses(prev => ({
      ...prev,
      [wordIndex]: prev[wordIndex] || ''
    }));
    setMessage('');
  };

  const handleUnlockWord = async (wordIndex: number) => {
    const word = challenge.words[wordIndex];
    
    // Check if already purchased/unlocked
    if (word.isPurchased || purchasedWords.find(pw => pw.wordIndex === wordIndex) || word.isGenerating) {
      return;
    }
    
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

      // Add to purchased words
      setPurchasedWords(prev => [...prev, {
        wordIndex,
        wordLength: data.wordLength,
      }]);

      setMessage(`Word unlocked! Generating hint image... Cost: $${data.cost}`);
      onWalletUpdate();

      // Poll for image generation completion
      pollForWordImageCompletion(wordIndex);

    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to unlock word');
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
            // Image is ready! Update the challenge data and show it for 5 seconds
            onChallengeUpdate?.();
            setCurrentDisplayImage(updatedChallenge.wordImages[wordIndex]);
            setShowingWordImage(wordIndex);
            setMessage(`Word image generated! Showing for 5 seconds...`);
            return true; // Stop polling
          } else if (word.generationFailed) {
            // Update the challenge data to show failed state
            onChallengeUpdate?.();
            setMessage(`Word image generation failed. You can still guess the word.`);
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

  const handleWordGuessSubmit = async (wordIndex: number) => {
    const guess = wordGuesses[wordIndex]?.trim();
    if (!guess) return;

    try {
      const response = await fetch(`/api/challenges/${challenge.id}/guess-word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guess: guess,
          userId: currentUserId,
          wordIndex: wordIndex,
        }),
      });

      const data = await response.json();

      if (data.correct) {
        setMessage(`🎉 ${data.message}`);
        onWalletUpdate();
        onChallengeUpdate?.(); // Refresh challenge data to show correct guess
        setEditingWordIndex(null);
        setWordGuesses(prev => ({ ...prev, [wordIndex]: '' }));
        
        // If challenge is solved, show success message
        if (data.challengeSolved) {
          setMessage(`🎉 ${data.message} Total solution: "${data.solution}"`);
        }
      } else {
        setMessage(data.message);
      }

    } catch (error) {
      setMessage('Failed to submit word guess');
    }
  };

  const handleWordInputChange = (wordIndex: number, value: string) => {
    setWordGuesses(prev => ({
      ...prev,
      [wordIndex]: value
    }));
  };

  const handleWordInputKeyDown = (e: React.KeyboardEvent, wordIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleWordGuessSubmit(wordIndex);
    } else if (e.key === 'Escape') {
      setEditingWordIndex(null);
    }
  };


  const getWordBoxClass = (word: any, index: number) => {
    const purchasedWord = purchasedWords.find(pw => pw.wordIndex === index);
    
    if (purchasing === index) {
      return "bg-yellow-300 text-yellow-800 px-2 py-1 rounded animate-pulse";
    }
    
    // Show colors for purchased/unlocked words
    if (purchasedWord || word.isPurchased || word.isGenerating || word.imageReady || word.generationFailed) {
      const userGuessedCorrectly = word.guessedBy?.[currentUserId];
      
      // If user already guessed correctly, show blue (completed)
      if (userGuessedCorrectly) {
        return "bg-blue-500 text-blue-100 px-2 py-1 rounded cursor-default";
      }
      
      if (purchasedWord) {
        if (word.isGenerating || (!word.imageReady && !word.generationFailed)) {
          // Yellow while generating image
          return "bg-yellow-400 text-yellow-900 px-2 py-1 rounded animate-pulse cursor-text";
        } else if (word.imageReady) {
          // Green when image is ready (clickable to guess)
          return "bg-green-500 text-green-900 px-2 py-1 rounded cursor-text hover:bg-green-600 transition-colors";
        } else if (word.generationFailed) {
          // Green with red accent for failed generation (still clickable to guess)
          return "bg-green-400 text-green-900 px-2 py-1 rounded border-2 border-red-400 cursor-text hover:bg-green-500 transition-colors";
        } else {
          // Default green for purchased (clickable to guess)
          return "bg-green-400 text-green-900 px-2 py-1 rounded cursor-text hover:bg-green-500 transition-colors";
        }
      } else {
        // Green for any other purchased/unlocked state (clickable to guess)
        return "bg-green-400 text-green-900 px-2 py-1 rounded cursor-text hover:bg-green-500 transition-colors";
      }
    }
    
    return "bg-gray-300 text-gray-600 px-2 py-1 rounded hover:bg-gray-400 transition-colors cursor-text";
  };

  const handleWordHover = (wordIndex: number) => {
    const word = challenge.words[wordIndex];
    const purchasedWord = purchasedWords.find(pw => pw.wordIndex === wordIndex);
    
    // Show hover image for any green box that has an available word image
    // This includes: purchased by current user, legacy purchased, or solved challenges
    if (challenge.wordImages?.[wordIndex] && (purchasedWord || word.isPurchased || word.imageReady)) {
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
    const purchasedWord = purchasedWords.find(pw => pw.wordIndex === index);
    const userGuessedCorrectly = word.guessedBy?.[currentUserId];
    const isEditing = editingWordIndex === index;
    const currentGuess = wordGuesses[index] || '';
    
    // Show actual word if user guessed it correctly
    if (userGuessedCorrectly) {
      return (
        <span 
          key={index} 
          className="relative inline-block"
        >
          <span className="bg-blue-500 text-blue-100 px-2 py-1 rounded cursor-default" style={{ minHeight: '2.25rem', display: 'inline-flex', alignItems: 'center' }}>
            {word.text}
          </span>
        </span>
      );
    }

    // Show input field if currently editing
    if (isEditing) {
      return (
        <span key={index} className="relative inline-block">
          <input
            type="text"
            value={currentGuess}
            onChange={(e) => handleWordInputChange(index, e.target.value)}
            onKeyDown={(e) => handleWordInputKeyDown(e, index)}
            onBlur={() => setEditingWordIndex(null)}
            className="bg-white border-2 border-blue-500 text-gray-900 px-2 py-1 rounded focus:outline-none"
            style={{ minHeight: '2.25rem', width: `${Math.max(word.text.length * 0.6, 3)}em` }}
            placeholder={`${word.text.length} letters`}
            autoFocus
          />
        </span>
      );
    }

    // Regular word display with unlock button
    const isUnlocked = word.isPurchased || purchasedWord || word.isGenerating || word.imageReady || word.generationFailed;
    const displayText = isUnlocked 
      ? (purchasedWord ? '*'.repeat(purchasedWord.wordLength) : '*'.repeat(word.text.length))
      : '_'.repeat(word.text.length);

    return (
      <span 
        key={index} 
        className="relative inline-block group"
        onMouseEnter={() => handleWordHover(index)}
        onMouseLeave={handleWordLeave}
      >
        <span 
          onClick={() => handleWordClick(index)}
          className={getWordBoxClass(word, index)} 
          style={{ minHeight: '2.25rem', display: 'inline-flex', alignItems: 'center', paddingRight: '1.5rem' }}
        >
          {displayText}
        </span>
        
        {/* Unlock button */}
        {!isUnlocked && purchasing !== index && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUnlockWord(index);
            }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600 transition-colors opacity-0 group-hover:opacity-100"
            title="Unlock word hint ($5)"
          >
            🔓
          </button>
        )}
        
        {/* Loading indicator for purchasing */}
        {purchasing === index && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-spin">
            <div className="w-2 h-2 bg-white rounded-full m-1"></div>
          </div>
        )}
      </span>
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
        <div className="relative w-full" style={{ minHeight: '300px', maxHeight: '400px' }}>
          <img 
            src={displayImage} 
            alt="Challenge" 
            className="w-full h-auto max-h-full object-contain bg-gray-50 rounded-lg"
            onError={() => setImageError(true)}
            style={{ maxHeight: '400px' }}
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
        <div className="w-full flex flex-col items-center justify-center bg-gray-100 text-gray-500" style={{ minHeight: '300px' }}>
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
      <div className="w-full flex items-center justify-center bg-gray-100 text-gray-500" style={{ minHeight: '300px' }}>
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
        <div className="w-full bg-gray-50 rounded-lg overflow-hidden mb-4" style={{ minHeight: '300px', maxHeight: '400px' }}>
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

        {/* Prize Display */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-900">Challenge Prize</h4>
            </div>
            <div className="text-2xl font-bold text-green-700">${challenge.prizeAmount}</div>
          </div>
          <p className="text-sm text-green-600 mt-1">
            Winner takes all! Solve all the words to claim the prize.
          </p>
        </div>

        {/* Game Instructions */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">How to Play:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click any word to type your guess (Enter to submit, Esc to cancel)</li>
            <li>• Hover words to see unlock button 🔓 - click to buy hint image ($5)</li>
            <li>• Yellow asterisks = generating hint image</li>
            <li>• Green asterisks = hint ready! Hover to preview image</li>
            <li>• Blue words = correctly guessed</li>
            <li>• Guess all words to win the full prize!</li>
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
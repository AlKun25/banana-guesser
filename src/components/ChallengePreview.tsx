'use client';

import { Challenge } from '@/lib/types';
import { Clock, Trophy, Eye, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ChallengePreviewProps {
  challenge: Challenge;
  currentUserId: string;
}

export function ChallengePreview({ challenge, currentUserId }: ChallengePreviewProps) {
  // Helper function to check if user guessed the word correctly
  const isWordGuessedByUser = (word: any) => {
    return word.guessedBy?.[currentUserId] === true;
  };

  const getWordPreviewClass = (word: any) => {
    const userGuessedCorrectly = isWordGuessedByUser(word);
    
    // If user already guessed correctly, show green (completed)
    if (userGuessedCorrectly) {
      return "bg-green-500 text-green-100 px-2 py-1 rounded";
    }
    
    // Show colors for purchased/unlocked words
    if (word.isPurchased || word.isGenerating || word.imageReady || word.generationFailed) {
      if (word.isGenerating || (!word.imageReady && !word.generationFailed)) {
        // Yellow while generating image
        return "bg-yellow-400 text-yellow-900 px-2 py-1 rounded";
      } else if (word.imageReady || word.generationFailed) {
        // Blue when image is ready or failed (still purchasable)
        return "bg-blue-500 text-blue-100 px-2 py-1 rounded";
      } else {
        // Default blue for purchased
        return "bg-blue-400 text-blue-900 px-2 py-1 rounded";
      }
    }
    
    return "bg-gray-300 text-gray-600 px-2 py-1 rounded";
  };

  const renderWordPreview = (word: any, index: number) => {
    const userGuessedCorrectly = isWordGuessedByUser(word);
    
    // Show actual word if user guessed it correctly
    if (userGuessedCorrectly) {
      return (
        <span key={index} className={getWordPreviewClass(word)}>
          {word.text}
        </span>
      );
    }

    // Show length indicators for other words
    const isUnlocked = word.isPurchased || word.isGenerating || word.imageReady || word.generationFailed;
    const displayText = isUnlocked 
      ? '*'.repeat(word.text.length)
      : '*'.repeat(word.text.length);

    return (
      <span key={index} className={getWordPreviewClass(word)}>
        {displayText}
      </span>
    );
  };

  const renderImagePreview = () => {
    if (challenge.imageUrl) {
      return (
        <img 
          src={challenge.imageUrl} 
          alt="Challenge preview" 
          className="w-full h-full object-contain bg-gray-50"
        />
      );
    }

    // Check if image generation might have failed
    const challengeAge = new Date().getTime() - new Date(challenge.createdAt).getTime();
    const imageError = challengeAge > 30000; // 30 seconds

    if (imageError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
          <AlertTriangle className="w-6 h-6 mb-1" />
          <p className="text-xs text-center">Image failed</p>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-1"></div>
          <p className="text-xs">Generating...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow flex flex-col h-full">
      {/* Preview Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">by {challenge.createdByDisplayName || 'Anonymous User'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{new Date(challenge.createdAt).toLocaleDateString()}</span>
            </div>
            {challenge.solvedBy && (
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <Trophy className="w-3 h-3" />
                <span>Solved</span>
              </div>
            )}
          </div>
        </div>

        {/* Small Preview Image */}
        <div className="w-full h-32 bg-gray-50 rounded-lg overflow-hidden mb-3">
          {renderImagePreview()}
        </div>

        {/* Word Preview */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Sentence Preview:</h3>
          <div className="flex flex-wrap text-sm gap-2 row-gap-10 column-gap-1">
            {challenge.words.map((word, index) => (
              <span key={index}>
                {renderWordPreview(word, index)}
                {index < challenge.words.length - 1 && <span className="mx-1"> </span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Section - Now fills remaining space */}
      <div className="p-4 bg-gray-50 flex-grow flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Prize: ${challenge.prizeAmount}</span>
          </div>
          <Link
            href={`/challenge/${challenge.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Go to Challenge
          </Link>
        </div>
      </div>
    </div>
  );
}

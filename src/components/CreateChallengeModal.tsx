'use client';

import { useState } from 'react';
import { X, Wand2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Challenge } from '@/lib/types';

interface CreateChallengeModalProps {
  onClose: () => void;
  onChallengeCreated: (challenge: Challenge) => void;
  userId: string;
}

export function CreateChallengeModal({ onClose, onChallengeCreated, userId }: CreateChallengeModalProps) {
  const [sentence, setSentence] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageSuccess, setImageSuccess] = useState(false);

  const wordCount = sentence.trim().split(/\s+/).filter(word => word.length > 0).length;

  const handleImageGeneration = async (challengeId: string) => {
    setImageGenerating(true);
    setImageError('');
    setImageSuccess(false);

    try {
      const response = await fetch(`/api/challenges/${challengeId}/generate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to generate image');
      }

      if (data.imageUrl) {
        setImageSuccess(true);
        console.log('Image generated successfully:', data.imageUrl);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
      setImageError(errorMessage);
      console.error('Image generation failed:', error);
    } finally {
      setImageGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sentence.trim()) {
      setError('Please enter a sentence');
      return;
    }

    if (wordCount > 25) {
      setError('Sentence must be 25 words or less');
      return;
    }

    if (wordCount < 3) {
      setError('Sentence must be at least 3 words');
      return;
    }

    setLoading(true);
    setError('');
    setImageError('');
    setImageSuccess(false);

    try {
      // Step 1: Create the challenge
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sentence: sentence.trim(),
          createdBy: userId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create challenge');
      }

      const newChallenge = await response.json();
      
      // Step 2: Generate image with proper error handling
      await handleImageGeneration(newChallenge.id);
      
      // Always call onChallengeCreated even if image generation fails
      // The challenge is still playable without an image
      onChallengeCreated(newChallenge);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  const getImageStatusMessage = () => {
    if (imageGenerating) {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Generating AI image...</span>
        </div>
      );
    }
    
    if (imageSuccess) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Image generated successfully!</span>
        </div>
      );
    }
    
    if (imageError) {
      return (
        <div className="flex items-start space-x-2 text-red-600">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Image generation failed:</p>
            <p>{imageError}</p>
            <p className="text-xs mt-1 text-red-500">
              Challenge created successfully, but will show without image.
            </p>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Create Challenge</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading || imageGenerating}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="sentence" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your sentence (max 25 words)
            </label>
            <textarea
              id="sentence"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              placeholder="A cat sits on a red chair in the sunny garden..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              maxLength={200}
              disabled={loading || imageGenerating}
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>{wordCount}/25 words</span>
              <span className={wordCount > 25 ? 'text-red-500' : ''}>
                {sentence.length}/200 characters
              </span>
            </div>
          </div>

          {/* Challenge creation error */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Image generation status */}
          {(imageGenerating || imageSuccess || imageError) && (
            <div className="mb-4 p-3 border rounded-md bg-gray-50">
              {getImageStatusMessage()}
            </div>
          )}

          {/* Info */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start space-x-2">
              <Wand2 className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">How it works:</p>
                <ul className="space-y-1">
                  <li>• AI will generate an image representing your sentence</li>
                  <li>• Some words will be hidden for players to purchase</li>
                  <li>• Players pay $5 for 20-second exclusive word access</li>
                  <li>• First to guess the complete sentence wins!</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || imageGenerating}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              {(loading || imageGenerating) ? 'Please wait...' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading || imageGenerating || wordCount > 25 || wordCount < 3}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : imageGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating Image...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Create Challenge</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
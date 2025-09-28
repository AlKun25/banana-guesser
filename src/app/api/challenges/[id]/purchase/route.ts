import { NextRequest, NextResponse } from 'next/server';
import { readChallenges, writeChallenges, readPurchases, writePurchases } from '@/lib/data';
import { canAffordCredits, burnUserCredits } from '@/lib/stackauth-credits';
import { UserPurchase } from '@/lib/types';
import { fal } from "@fal-ai/client";

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
});

// Dynamic pricing: (prize amount / number of words) with minimum 1 GC
function calculateWordPrice(challenge: any): number {
  const basePrice = challenge.prizeAmount > 0 
    ? Math.max(1, Math.floor(challenge.prizeAmount / challenge.words.length))
    : 1; // Minimum 1 GC for challenges with no prize
  return basePrice;
}

// Background function to generate image for purchased word
async function generateWordImage(challengeId: string, wordIndex: number, modifiedPrompt: string) {
  try {
    console.log(`Generating image for word ${wordIndex} in challenge ${challengeId}: "${modifiedPrompt}"`);

    // Generate image using fal.ai with Gemini Flash Image 2.5
    const result = await fal.subscribe(
      "fal-ai/flux-1/schnell"
      // "fal-ai/gemini-25-flash-image"
      , {
      input: {
        prompt: `A realistic, high-quality image representing: ${modifiedPrompt}. Make it clear and visually appealing.`,
      },
    });

    // Validate the result structure
    if (!result || !result.data || !result.data.images || !result.data.images[0]?.url) {
      throw new Error('Invalid response from image generation service');
    }

    const imageUrl = result.data.images[0].url;
    console.log(`Successfully generated word image: ${imageUrl}`);

    // Update the challenge with the generated image for this word
    const challenges = await readChallenges();
    const challengeIndex = challenges.findIndex(c => c.id === challengeId);
    
    if (challengeIndex !== -1) {
      // Store the generated image URL for this specific word
      if (!challenges[challengeIndex].wordImages) {
        challenges[challengeIndex].wordImages = {};
      }
      challenges[challengeIndex].wordImages[wordIndex] = imageUrl;
      
      // Mark word as generation complete
      challenges[challengeIndex].words[wordIndex].isGenerating = false;
      challenges[challengeIndex].words[wordIndex].imageReady = true;
      
      await writeChallenges(challenges);
      console.log(`Word ${wordIndex} image generation completed for challenge ${challengeId}`);
    }

  } catch (error) {
    console.error(`Word image generation failed for challenge ${challengeId}, word ${wordIndex}:`, error);
    
    // Update challenge to show generation failed
    try {
      const challenges = await readChallenges();
      const challengeIndex = challenges.findIndex(c => c.id === challengeId);
      
      if (challengeIndex !== -1) {
        challenges[challengeIndex].words[wordIndex].isGenerating = false;
        challenges[challengeIndex].words[wordIndex].generationFailed = true;
        await writeChallenges(challenges);
      }
    } catch (updateError) {
      console.error('Failed to update challenge after image generation failure:', updateError);
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { wordIndex, userId } = await request.json();
    
    if (!userId || wordIndex === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const challenges = await readChallenges();
    const challengeIndex = challenges.findIndex(c => c.id === id);
    
    if (challengeIndex === -1) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const challenge = challenges[challengeIndex];
    const wordPrice = calculateWordPrice(challenge);
    
    // Check if user can afford the word
    if (!(await canAffordCredits(userId, wordPrice))) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        required: wordPrice,
        wordPrice
      }, { status: 400 });
    }
    
    if (wordIndex >= challenge.words.length) {
      return NextResponse.json({ error: 'Invalid word index' }, { status: 400 });
    }

    const word = challenge.words[wordIndex];
    
    if (word.isPurchased) {
      return NextResponse.json({ error: 'Word already purchased' }, { status: 400 });
    }

    // Check if this word has already been purchased
    const purchases = await readPurchases();
    const existingPurchase = purchases.find(p => 
      p.challengeId === id && 
      p.wordIndex === wordIndex
    );

    if (existingPurchase) {
      return NextResponse.json({ 
        error: 'Word has already been purchased by someone else',
        purchasedBy: existingPurchase.userId
      }, { status: 400 });
    }

    // Process the purchase
    const success = await burnUserCredits(userId, wordPrice);
    if (!success) {
      return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 400 });
    }

    // Create purchase record
    const purchase: UserPurchase = {
      userId,
      challengeId: id,
      wordIndex,
      purchaseTime: new Date(),
      accessExpiresAt: new Date() // Not used anymore, but keeping for compatibility
    };

    purchases.push(purchase);
    await writePurchases(purchases);

    // Update word status to show it's been purchased and is being processed
    challenge.words[wordIndex].isPurchased = true;
    challenge.words[wordIndex].purchasedBy = userId;
    challenge.words[wordIndex].purchaseTime = new Date();
    challenge.words[wordIndex].isGenerating = true;
    await writeChallenges(challenges);

    // Generate image with word removed from prompt
    const originalWords = challenge.sentence.split(' ');
    const modifiedPrompt = originalWords
      .filter((_, index) => index !== wordIndex)
      .join(' ');

    // Start image generation in background
    generateWordImage(id, wordIndex, modifiedPrompt);

    return NextResponse.json({
      success: true,
      wordLength: word.text.length,
      cost: wordPrice, // Cost in GC
      status: 'generating'
    });

  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json({ error: 'Failed to purchase word' }, { status: 500 });
  }
}

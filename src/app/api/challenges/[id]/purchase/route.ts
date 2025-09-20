import { NextRequest, NextResponse } from 'next/server';
import { readChallenges, writeChallenges, readPurchases, writePurchases } from '@/lib/data';
import { canAfford, updateUserWallet } from '@/lib/wallet';
import { UserPurchase } from '@/lib/types';
import { fal } from "@fal-ai/client";

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
});

const WORD_PRICE = 5; // $5 per word
const ACCESS_DURATION = 20 * 1000; // 20 seconds in milliseconds

// Background function to generate image for purchased word
async function generateWordImage(challengeId: string, wordIndex: number, modifiedPrompt: string) {
  try {
    console.log(`Generating image for word ${wordIndex} in challenge ${challengeId}: "${modifiedPrompt}"`);

    // Generate image using fal.ai with Gemini Flash Image 2.5
    const result = await fal.subscribe("fal-ai/gemini-25-flash-image", {
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
  { params }: { params: { id: string } }
) {
  try {
    const { wordIndex, userId } = await request.json();
    
    if (!userId || wordIndex === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user can afford the word
    if (!(await canAfford(userId, WORD_PRICE))) {
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
    }

    const challenges = await readChallenges();
    const challengeIndex = challenges.findIndex(c => c.id === params.id);
    
    if (challengeIndex === -1) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const challenge = challenges[challengeIndex];
    
    if (wordIndex >= challenge.words.length) {
      return NextResponse.json({ error: 'Invalid word index' }, { status: 400 });
    }

    const word = challenge.words[wordIndex];
    
    if (word.isPurchased) {
      return NextResponse.json({ error: 'Word already purchased' }, { status: 400 });
    }

    // Check if there's already an active purchase for this word
    const purchases = await readPurchases();
    const now = new Date();
    const activePurchase = purchases.find(p => 
      p.challengeId === params.id && 
      p.wordIndex === wordIndex &&
      p.accessExpiresAt > now
    );

    if (activePurchase) {
      return NextResponse.json({ 
        error: 'Word is currently being accessed by another user',
        expiresAt: activePurchase.accessExpiresAt
      }, { status: 400 });
    }

    // Process the purchase
    await updateUserWallet(userId, -WORD_PRICE);

    // Create purchase record with generating status
    const purchase: UserPurchase = {
      userId,
      challengeId: params.id,
      wordIndex,
      purchaseTime: now,
      accessExpiresAt: new Date(now.getTime() + ACCESS_DURATION)
    };

    purchases.push(purchase);
    await writePurchases(purchases);

    // Update word status to show it's being processed
    challenge.words[wordIndex].purchasedBy = userId;
    challenge.words[wordIndex].purchaseTime = now;
    challenge.words[wordIndex].isGenerating = true;
    await writeChallenges(challenges);

    // Generate image with word removed from prompt
    const originalWords = challenge.sentence.split(' ');
    const modifiedPrompt = originalWords
      .filter((_, index) => index !== wordIndex)
      .join(' ');

    // Start image generation in background
    generateWordImage(params.id, wordIndex, modifiedPrompt);

    return NextResponse.json({
      success: true,
      wordLength: word.text.length,
      accessExpiresAt: purchase.accessExpiresAt,
      cost: WORD_PRICE,
      status: 'generating'
    });

  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json({ error: 'Failed to purchase word' }, { status: 500 });
  }
}

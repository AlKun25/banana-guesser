import { NextRequest, NextResponse } from 'next/server';
import { readChallenges, writeChallenges } from '@/lib/data';
import * as fal from "@fal-ai/client";

// Configure fal client - you'll need to set FAL_KEY in environment variables
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challenges = await readChallenges();
    const challengeIndex = challenges.findIndex(c => c.id === params.id);
    
    if (challengeIndex === -1) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const challenge = challenges[challengeIndex];
    
    if (challenge.imageUrl) {
      return NextResponse.json({ imageUrl: challenge.imageUrl });
    }

    // Generate image using fal.ai
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: `A realistic, high-quality image representing: ${challenge.sentence}. Make it clear and visually appealing.`,
        image_size: "landscape_4_3",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
    });

    const imageUrl = result.data.images[0]?.url;
    
    if (!imageUrl) {
      throw new Error('Failed to generate image');
    }

    // Update challenge with image URL
    challenges[challengeIndex].imageUrl = imageUrl;
    await writeChallenges(challenges);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

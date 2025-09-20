import { NextRequest, NextResponse } from 'next/server';
import { readChallenges, writeChallenges } from '@/lib/data';
import { fal } from "@fal-ai/client";

// Configure fal client - you'll need to set FAL_KEY in environment variables
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate environment variables
    if (!process.env.FAL_KEY) {
      console.error('FAL_KEY environment variable is not set');
      return NextResponse.json({ 
        error: 'Image generation service not configured',
        details: 'FAL_KEY environment variable is missing. Please add it to your .env.local file.',
        type: 'configuration_error'
      }, { status: 500 });
    }

    const challenges = await readChallenges();
    const challengeIndex = challenges.findIndex(c => c.id === params.id);
    
    if (challengeIndex === -1) {
      return NextResponse.json({ 
        error: 'Challenge not found',
        details: `No challenge found with ID: ${params.id}`,
        type: 'not_found'
      }, { status: 404 });
    }

    const challenge = challenges[challengeIndex];
    
    // Return existing image if already generated
    if (challenge.imageUrl) {
      return NextResponse.json({ 
        imageUrl: challenge.imageUrl,
        cached: true 
      });
    }

    console.log(`Generating image for challenge ${params.id}: "${challenge.sentence}"`);

    // Generate image using fal.ai with Gemini Flash Image 2.5
    const result = await fal.subscribe(
      "fal-ai/flux-1/schnell",
      // "fal-ai/gemini-25-flash-image",
       {
      input: {
        prompt: `A realistic, high-quality image representing: ${challenge.sentence}. Make it clear and visually appealing.`,
      },
    });

    // Validate the result structure
    if (!result || !result.data) {
      throw new Error('Invalid response from image generation service');
    }

    if (!result.data.images || !Array.isArray(result.data.images) || result.data.images.length === 0) {
      throw new Error('No images returned from generation service');
    }

    const imageUrl = result.data.images[0]?.url;
    
    if (!imageUrl) {
      throw new Error('Image URL not found in generation response');
    }

    // Validate that the URL is accessible
    if (!imageUrl.startsWith('http')) {
      throw new Error('Invalid image URL format received');
    }

    console.log(`Successfully generated image: ${imageUrl}`);

    // Update challenge with image URL
    challenges[challengeIndex].imageUrl = imageUrl;
    await writeChallenges(challenges);

    return NextResponse.json({ 
      imageUrl,
      generated: true,
      sentence: challenge.sentence 
    });

  } catch (error) {
    console.error('Image generation error:', error);
    
    // Handle different types of errors
    let errorMessage = 'Failed to generate image';
    let errorDetails = 'Unknown error occurred';
    let errorType = 'generation_error';

    if (error instanceof Error) {
      errorDetails = error.message;
      
      // Categorize common errors
      if (error.message.includes('credentials') || error.message.includes('API key')) {
        errorMessage = 'Authentication failed with image generation service';
        errorType = 'auth_error';
        errorDetails = 'Please check your FAL_KEY in environment variables';
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'Image generation quota exceeded';
        errorType = 'quota_error';
        errorDetails = 'Please try again later or check your fal.ai account limits';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Image generation timed out';
        errorType = 'timeout_error';
        errorDetails = 'The image generation took too long. Please try again.';
      } else if (error.message.includes('safety')) {
        errorMessage = 'Content blocked by safety filter';
        errorType = 'safety_error';
        errorDetails = 'Please try a different sentence that complies with content policies';
      }
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails,
      type: errorType,
      challengeId: params.id
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { readChallenges, writeChallenges, readPurchases, writePurchases } from '@/lib/data';
import { canAfford, updateUserWallet } from '@/lib/wallet';
import { UserPurchase } from '@/lib/types';

const WORD_PRICE = 5; // $5 per word
const ACCESS_DURATION = 20 * 1000; // 20 seconds in milliseconds

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

    // Create purchase record
    const purchase: UserPurchase = {
      userId,
      challengeId: params.id,
      wordIndex,
      purchaseTime: now,
      accessExpiresAt: new Date(now.getTime() + ACCESS_DURATION)
    };

    purchases.push(purchase);
    await writePurchases(purchases);

    // Update word status
    challenge.words[wordIndex].purchasedBy = userId;
    challenge.words[wordIndex].purchaseTime = now;
    await writeChallenges(challenges);

    return NextResponse.json({
      success: true,
      wordText: word.text,
      accessExpiresAt: purchase.accessExpiresAt,
      cost: WORD_PRICE
    });

  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json({ error: 'Failed to purchase word' }, { status: 500 });
  }
}

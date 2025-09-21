import { Redis } from '@upstash/redis';
import { Challenge, UserPurchase, UserWallet, WordAccess } from './types';

// Redis client setup
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Redis keys
const REDIS_KEYS = {
  CHALLENGES: 'challenges',
  PURCHASES: 'purchases', 
  USERS: 'users'
} as const;

export async function readChallenges(): Promise<Challenge[]> {
  try {
    const data = await redis.get(REDIS_KEYS.CHALLENGES);
    if (!data) return [];
    
    return (data as any[]).map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      words: c.words.map((w: any) => ({
        ...w,
        purchaseTime: w.purchaseTime ? new Date(w.purchaseTime) : null
      }))
    }));
  } catch {
    return [];
  }
}

export async function writeChallenges(challenges: Challenge[]): Promise<void> {
  await redis.set(REDIS_KEYS.CHALLENGES, challenges);
}

export async function readPurchases(): Promise<UserPurchase[]> {
  try {
    const data = await redis.get(REDIS_KEYS.PURCHASES);
    if (!data) return [];
    
    return (data as any[]).map((p: any) => ({
      ...p,
      purchaseTime: new Date(p.purchaseTime),
      accessExpiresAt: new Date(p.accessExpiresAt)
    }));
  } catch {
    return [];
  }
}

export async function writePurchases(purchases: UserPurchase[]): Promise<void> {
  await redis.set(REDIS_KEYS.PURCHASES, purchases);
}

export async function readUsers(): Promise<UserWallet[]> {
  try {
    const data = await redis.get(REDIS_KEYS.USERS);
    if (!data) return [];
    
    return (data as any[]).map((u: any) => ({
      ...u,
      createdAt: new Date(u.createdAt)
    }));
  } catch {
    return [];
  }
}

export async function writeUsers(users: UserWallet[]): Promise<void> {
  await redis.set(REDIS_KEYS.USERS, users);
}

export async function getActiveWordAccess(challengeId: string, wordIndex: number): Promise<WordAccess | null> {
  const purchases = await readPurchases();
  const now = new Date();
  
  const activePurchase = purchases.find(p => 
    p.challengeId === challengeId && 
    p.wordIndex === wordIndex &&
    p.accessExpiresAt > now
  );

  if (!activePurchase) return null;

  return {
    challengeId,
    wordIndex,
    userId: activePurchase.userId,
    expiresAt: activePurchase.accessExpiresAt
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

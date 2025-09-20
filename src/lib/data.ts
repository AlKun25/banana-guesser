import { promises as fs } from 'fs';
import path from 'path';
import { Challenge, UserPurchase, UserWallet, WordAccess } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function readChallenges(): Promise<Challenge[]> {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, 'challenges.json'), 'utf-8');
    return JSON.parse(data).map((c: any) => ({
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
  await fs.writeFile(
    path.join(DATA_DIR, 'challenges.json'),
    JSON.stringify(challenges, null, 2)
  );
}

export async function readPurchases(): Promise<UserPurchase[]> {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, 'purchases.json'), 'utf-8');
    return JSON.parse(data).map((p: any) => ({
      ...p,
      purchaseTime: new Date(p.purchaseTime),
      accessExpiresAt: new Date(p.accessExpiresAt)
    }));
  } catch {
    return [];
  }
}

export async function writePurchases(purchases: UserPurchase[]): Promise<void> {
  await fs.writeFile(
    path.join(DATA_DIR, 'purchases.json'),
    JSON.stringify(purchases, null, 2)
  );
}

export async function readUsers(): Promise<UserWallet[]> {
  try {
    const data = await fs.readFile(path.join(DATA_DIR, 'users.json'), 'utf-8');
    return JSON.parse(data).map((u: any) => ({
      ...u,
      createdAt: new Date(u.createdAt)
    }));
  } catch {
    return [];
  }
}

export async function writeUsers(users: UserWallet[]): Promise<void> {
  await fs.writeFile(
    path.join(DATA_DIR, 'users.json'),
    JSON.stringify(users, null, 2)
  );
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

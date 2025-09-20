export interface Challenge {
  id: string;
  sentence: string;
  imageUrl: string;
  words: Array<{
    text: string;
    position: number;
    isPurchased: boolean;
    purchasedBy: string | null;
    purchaseTime: Date | null;
  }>;
  createdBy: string;
  solvedBy: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface UserPurchase {
  userId: string;
  challengeId: string;
  wordIndex: number;
  purchaseTime: Date;
  accessExpiresAt: Date;
}

export interface UserWallet {
  id: string;
  wallet: number;
  createdAt: Date;
}

export interface WordAccess {
  challengeId: string;
  wordIndex: number;
  userId: string;
  expiresAt: Date;
}

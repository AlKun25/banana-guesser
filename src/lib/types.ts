export interface Challenge {
  id: string;
  sentence: string;
  imageUrl: string;
  wordImages?: Record<number, string>; // Store generated images for each purchased word
  words: Array<{
    text: string;
    position: number;
    isPurchased: boolean;
    purchasedBy: string | null;
    purchaseTime: Date | null;
    isGenerating?: boolean;
    imageReady?: boolean;
    generationFailed?: boolean;
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

// StackAuth Credits System
// Using clientReadOnlyMetadata to store credits that are readable on client but only modifiable on server

import { stackServerApp } from '@/stack/server';

export interface UserCredits {
    credits: number;
}

export interface RefillStatus {
    isEligible: boolean;
    currentCredits: number;
    nextRefillAt: Date | null;
    timeUntilRefill: number; // milliseconds
}

const REFILL_THRESHOLD = 20; // Refill only starts when below this amount, and stops exactly at this amount
const REFILL_AMOUNT = 5; // Maximum credits added per refill (but never exceeds threshold)
const REFILL_INTERVAL_HOURS = 6; // Hours between refills

/**
 * Get user credits from StackAuth clientReadOnlyMetadata
 * Returns 0 if no credits are set
 */
export async function getUserCredits(userId: string): Promise<number> {
    try {
        const user = await stackServerApp.getUser(userId);
        if (!user) {
            return 20; // Default 20 GC for new users
        }

        const credits = await user.getItem('credits');
        let currentCredits = credits.quantity;
        
        // If user has 0 credits, initialize with 20 GC (for existing users upgrading)
        if (currentCredits === 0) {
            await credits.increaseQuantity(20);
            return 20;
        }
        
        return currentCredits;
    } catch (error) {
        console.error('Failed to get user credits:', error);
        // Try to initialize with 20 GC for new users even if there's an error
        try {
            const user = await stackServerApp.getUser(userId);
            if (user) {
                const credits = await user.getItem('credits');
                await credits.increaseQuantity(20);
                return 20;
            }
        } catch (initError) {
            console.error('Failed to initialize user credits:', initError);
        }
        return 20; // Default to 20 GC
    }
}

/**
 * Update user credits in StackAuth clientReadOnlyMetadata
 * This can only be called from server-side code
 */
export async function updateUserCredits(userId: string, amount: number): Promise<void> {
    try {
        const user = await stackServerApp.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const credits = await user.getItem('credits')

        if (amount > 0) {
            await credits.increaseQuantity(amount)
        } else {
            await credits.decreaseQuantity(-amount)
        }
    } catch (error) {
        console.error('Failed to update user credits:', error);
        throw error;
    }
}

/**
 * Check if user can afford a specific amount
 */
export async function canAffordCredits(userId: string, amount: number): Promise<boolean> {
    const credits = await getUserCredits(userId);
    return credits >= amount;
}

/**
 * Burn (subtract) credits from user account
 * Returns true if successful, false if insufficient credits
 */
export async function burnUserCredits(userId: string, amount: number): Promise<boolean> {
    try {
        const credits = await getUserCredits(userId);
        if (credits < amount) {
            return false; // Insufficient credits
        }

        await updateUserCredits(userId, -amount);
        return true;
    } catch (error) {
        console.error('Failed to burn user credits:', error);
        return false;
    }
}

/**
 * Add credits to user account (for purchases/rewards)
 */
export async function addUserCredits(userId: string, amount: number): Promise<void> {
    await updateUserCredits(userId, amount);
}

/**
 * Get refill status for a user
 */
export async function getRefillStatus(userId: string): Promise<RefillStatus> {
    try {
        const user = await stackServerApp.getUser(userId);
        if (!user) {
            return {
                isEligible: false,
                currentCredits: 20,
                nextRefillAt: null,
                timeUntilRefill: 0
            };
        }

        const credits = await user.getItem('credits');
        const currentCredits = credits.quantity;

        // Only eligible for refill if below threshold
        if (currentCredits >= REFILL_THRESHOLD) {
            return {
                isEligible: false,
                currentCredits,
                nextRefillAt: null,
                timeUntilRefill: 0
            };
        }

        // Get last refill time
        const lastRefillStr = user.clientReadOnlyMetadata?.lastRefill;
        const now = new Date();
        let nextRefillAt: Date;

        if (!lastRefillStr) {
            // First time below threshold - set up refill
            nextRefillAt = new Date(now.getTime() + (REFILL_INTERVAL_HOURS * 60 * 60 * 1000));
            await user.setClientReadOnlyMetadata({ lastRefill: now.toISOString() });
        } else {
            const lastRefill = new Date(typeof lastRefillStr === 'string' ? lastRefillStr : lastRefillStr.toString());
            nextRefillAt = new Date(lastRefill.getTime() + (REFILL_INTERVAL_HOURS * 60 * 60 * 1000));
        }

        const timeUntilRefill = Math.max(0, nextRefillAt.getTime() - now.getTime());

        return {
            isEligible: true,
            currentCredits,
            nextRefillAt,
            timeUntilRefill
        };
    } catch (error) {
        console.error('Failed to get refill status:', error);
        return {
            isEligible: false,
            currentCredits: 0,
            nextRefillAt: null,
            timeUntilRefill: 0
        };
    }
}

/**
 * Process refill if eligible
 */
export async function processRefill(userId: string): Promise<{ success: boolean; creditsAdded: number; newBalance: number }> {
    try {
        const user = await stackServerApp.getUser(userId);
        if (!user) {
            return { success: false, creditsAdded: 0, newBalance: 0 };
        }

        const credits = await user.getItem('credits');
        const currentCredits = credits.quantity;

        // Only process refill if below threshold
        if (currentCredits >= REFILL_THRESHOLD) {
            return { success: false, creditsAdded: 0, newBalance: currentCredits };
        }

        const lastRefillStr = user.clientReadOnlyMetadata?.lastRefill;
        const now = new Date();

        if (lastRefillStr) {
            const lastRefill = new Date(typeof lastRefillStr === 'string' ? lastRefillStr : lastRefillStr.toString());
            const timeSinceLastRefill = now.getTime() - lastRefill.getTime();
            const intervalMs = REFILL_INTERVAL_HOURS * 60 * 60 * 1000;

            // Check if enough time has passed
            if (timeSinceLastRefill < intervalMs) {
                return { success: false, creditsAdded: 0, newBalance: currentCredits };
            }
        }

        // Process refill - only add what's needed to reach exactly REFILL_THRESHOLD (20 GC)
        const creditsToAdd = Math.min(REFILL_AMOUNT, REFILL_THRESHOLD - currentCredits);
        
        // Safety check: never add credits if already at or above threshold
        if (creditsToAdd <= 0 || currentCredits >= REFILL_THRESHOLD) {
            return { success: false, creditsAdded: 0, newBalance: currentCredits };
        }
        
        await credits.increaseQuantity(creditsToAdd);
        await user.setClientReadOnlyMetadata({ lastRefill: now.toISOString() });

        return {
            success: true,
            creditsAdded: creditsToAdd,
            newBalance: currentCredits + creditsToAdd
        };
    } catch (error) {
        console.error('Failed to process refill:', error);
        return { success: false, creditsAdded: 0, newBalance: 0 };
    }
}

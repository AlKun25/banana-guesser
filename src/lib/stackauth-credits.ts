// StackAuth Credits System
// Using clientReadOnlyMetadata to store credits that are readable on client but only modifiable on server

import { stackServerApp } from '@/stack/server';

export interface UserCredits {
    credits: number;
}

/**
 * Get user credits from StackAuth clientReadOnlyMetadata
 * Returns 0 if no credits are set
 */
export async function getUserCredits(userId: string): Promise<number> {
    try {
        const user = await stackServerApp.getUser(userId);
        if (!user) {
            return 0;
        }

        const credits = await user.getItem('credits')
        return credits.quantity
    } catch (error) {
        console.error('Failed to get user credits:', error);
        return 0;
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

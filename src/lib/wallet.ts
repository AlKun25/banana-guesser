import { readUsers, writeUsers } from './data';
import { UserWallet } from './types';

export async function getUserWallet(userId: string): Promise<number> {
  const users = await readUsers();
  const user = users.find(u => u.id === userId);
  return user?.wallet ?? 100; // Default $100 for new users
}

export async function updateUserWallet(userId: string, amount: number): Promise<void> {
  const users = await readUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    // Create new user wallet
    const newUser: UserWallet = {
      id: userId,
      wallet: 100 + amount, // Start with $100 + the amount
      createdAt: new Date()
    };
    users.push(newUser);
  } else {
    // Update existing user wallet
    users[userIndex].wallet += amount;
  }
  
  await writeUsers(users);
}

export async function canAfford(userId: string, amount: number): Promise<boolean> {
  const wallet = await getUserWallet(userId);
  return wallet >= amount;
}

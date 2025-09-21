#!/usr/bin/env node

/**
 * Migration script to transfer data from JSON files to Redis
 * Run this script after setting up your Redis environment variables
 */

const { Redis } = require('@upstash/redis');
const fs = require('fs').promises;
const path = require('path');

// Redis client setup
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Redis keys
const REDIS_KEYS = {
  CHALLENGES: 'challenges',
  PURCHASES: 'purchases', 
  USERS: 'users'
};

const DATA_DIR = path.join(process.cwd(), 'data');

async function migrateData() {
  try {
    console.log('🚀 Starting migration from JSON files to Redis...');

    // Migrate challenges
    try {
      const challengesData = await fs.readFile(path.join(DATA_DIR, 'challenges.json'), 'utf-8');
      const challenges = JSON.parse(challengesData);
      await redis.set(REDIS_KEYS.CHALLENGES, challenges);
      console.log(`✅ Migrated ${challenges.length} challenges to Redis`);
    } catch (error) {
      console.log('⚠️  No challenges.json found or error reading it:', error.message);
    }

    // Migrate purchases
    try {
      const purchasesData = await fs.readFile(path.join(DATA_DIR, 'purchases.json'), 'utf-8');
      const purchases = JSON.parse(purchasesData);
      await redis.set(REDIS_KEYS.PURCHASES, purchases);
      console.log(`✅ Migrated ${purchases.length} purchases to Redis`);
    } catch (error) {
      console.log('⚠️  No purchases.json found or error reading it:', error.message);
    }

    // Migrate users
    try {
      const usersData = await fs.readFile(path.join(DATA_DIR, 'users.json'), 'utf-8');
      const users = JSON.parse(usersData);
      await redis.set(REDIS_KEYS.USERS, users);
      console.log(`✅ Migrated ${users.length} users to Redis`);
    } catch (error) {
      console.log('⚠️  No users.json found or error reading it:', error.message);
    }

    console.log('🎉 Migration completed successfully!');
    console.log('📝 Next steps:');
    console.log('1. Verify your Redis data using the Redis CLI or dashboard');
    console.log('2. Test your application to ensure everything works correctly');
    console.log('3. Consider backing up your JSON files before removing them');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Verify environment variables
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.error('❌ Missing required environment variables:');
  console.error('   UPSTASH_REDIS_REST_URL');
  console.error('   UPSTASH_REDIS_REST_TOKEN');
  console.error('');
  console.error('Please set these in your .env.local file or environment');
  process.exit(1);
}

migrateData();

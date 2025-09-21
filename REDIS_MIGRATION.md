# Redis Migration Guide

This project has been migrated from JSON file storage to Redis using Upstash Redis.

## Setup

1. **Create an Upstash Redis Database**
   - Go to [Upstash Console](https://console.upstash.com/)
   - Create a new Redis database
   - Choose "Global" type for minimal latency
   - Copy the REST API credentials

2. **Set Environment Variables**
   Create a `.env.local` file in the project root:
   ```bash
   UPSTASH_REDIS_REST_URL=your-upstash-redis-url-here
   UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token-here
   ```

3. **Migrate Existing Data**
   Run the migration script to transfer data from JSON files to Redis:
   ```bash
   pnpm run migrate-to-redis
   ```

## Data Structure in Redis

The application now stores data in Redis with these keys:
- `challenges` - Array of Challenge objects
- `purchases` - Array of UserPurchase objects  
- `users` - Array of UserWallet objects

## Changes Made

### Files Modified
- `src/lib/data.ts` - Replaced file system operations with Redis operations
- `package.json` - Added @upstash/redis dependency and migration script
- `scripts/migrate-to-redis.js` - Migration script for existing data

### API Compatibility
All existing API functions remain the same:
- `readChallenges()` / `writeChallenges()`
- `readPurchases()` / `writePurchases()`
- `readUsers()` / `writeUsers()`
- `getActiveWordAccess()`
- `generateId()`

## Benefits of Redis Migration

1. **Performance** - In-memory data structure store for faster access
2. **Scalability** - Better handling of concurrent operations
3. **Reliability** - Built-in persistence and replication
4. **Global Distribution** - Upstash provides global edge locations
5. **Atomic Operations** - Better support for concurrent updates

## Rollback Plan

If you need to rollback to JSON files:
1. Export data from Redis
2. Revert `src/lib/data.ts` to use file system operations
3. Restore JSON files in the `data/` directory

## Monitoring

Monitor your Redis usage in the Upstash Console:
- Database metrics
- Request logs  
- Performance analytics

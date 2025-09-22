import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

/**
 * Rate limiter using Redis sliding window approach
 * @param identifier - Unique identifier (e.g., userId, IP address)
 * @param action - Action type (e.g., 'challenge-creation')
 * @param config - Rate limit configuration
 * @returns Promise<RateLimitResult>
 */
export async function rateLimit(
  identifier: string,
  action: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const key = `rate_limit:${action}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();
    
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests in window
    pipeline.zcard(key);
    
    // Add current request
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    
    // Set expiration for cleanup
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));
    
    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error('Redis pipeline failed');
    }

    // Get count after removing expired entries but before adding new one
    const currentCount = results[1] as number;
    
    if (currentCount >= config.maxRequests) {
      // Remove the request we just added since we're over the limit
      await redis.zrem(key, `${now}-${Math.random()}`);
      
      return {
        success: false,
        remaining: 0,
        resetTime: now + config.windowMs,
        error: `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowMs / 1000} seconds.`
      };
    }

    return {
      success: true,
      remaining: config.maxRequests - currentCount - 1,
      resetTime: now + config.windowMs
    };

  } catch (error) {
    console.error('Rate limiter error:', error);
    // Fail open - allow the request if Redis is down
    return {
      success: true,
      remaining: 0,
      resetTime: Date.now() + config.windowMs,
      error: 'Rate limiter unavailable'
    };
  }
}

/**
 * Challenge creation rate limiter
 * - 3 challenges per minute
 * - 10 challenges per day
 */
export async function rateLimitChallengeCreation(userId: string): Promise<{
  allowed: boolean;
  error?: string;
  minuteRemaining?: number;
  dayRemaining?: number;
}> {
  try {
    // Check minute limit (3 per minute)
    const minuteLimit = await rateLimit(userId, 'challenge-creation-minute', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 3
    });

    if (!minuteLimit.success) {
      return {
        allowed: false,
        error: 'Too many challenges created recently. Please wait a minute before creating another.',
        minuteRemaining: minuteLimit.remaining
      };
    }

    // Check daily limit (10 per day)
    const dayLimit = await rateLimit(userId, 'challenge-creation-day', {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 10
    });

    if (!dayLimit.success) {
      return {
        allowed: false,
        error: 'Daily challenge creation limit reached. You can create 10 challenges per day.',
        dayRemaining: dayLimit.remaining
      };
    }

    return {
      allowed: true,
      minuteRemaining: minuteLimit.remaining,
      dayRemaining: dayLimit.remaining
    };

  } catch (error) {
    console.error('Challenge creation rate limit error:', error);
    // Fail open - allow creation if rate limiter fails
    return {
      allowed: true,
      error: 'Rate limiter unavailable'
    };
  }
}

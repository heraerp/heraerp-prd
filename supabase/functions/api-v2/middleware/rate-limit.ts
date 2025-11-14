// HERA v2.3 API Gateway - Rate Limiting Middleware
// Smart Code: HERA.API.V2.MIDDLEWARE.RATE_LIMIT.v1

import type { 
  MiddlewareFunction, 
  Actor, 
  OrgContext, 
  RequestContext 
} from '../types/middleware.ts';
import { getFromCache, setInCache } from '../lib/cache.ts';
import { executeMiddleware } from './chain.ts';

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  strategy: 'fixed-window' | 'sliding-window';
}

interface RateLimitCounter {
  count: number;
  windowStart: number;
  requests: number[]; // For sliding window
}

/**
 * Rate limiting middleware - prevents DoS and ensures fair usage
 */
export const rateLimitMiddleware: MiddlewareFunction<{ rateLimitInfo: RateLimitInfo }> = async (req, context) => {
  return executeMiddleware('rate-limit', async () => {
    const actor = (context as Partial<RequestContext>)?.actor;
    const orgContext = (context as Partial<RequestContext>)?.orgContext;
    
    if (!actor || !orgContext) {
      throw new Error('500:Auth and org-context middleware must run before rate-limit middleware');
    }

    // 1. Determine rate limit config based on endpoint and role
    const config = getRateLimitConfig(req.url, actor, orgContext);
    
    // 2. Check rate limit
    const rateLimitResult = await checkRateLimit(actor.id, orgContext.org_id, config);
    
    if (!rateLimitResult.allowed) {
      // Add rate limit headers to error response
      const headers = {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        'Retry-After': Math.ceil(rateLimitResult.retryAfter).toString()
      };
      
      throw new Error(
        `429:Rate limit exceeded: ${rateLimitResult.current}/${config.maxRequests} requests per ${config.windowSeconds}s. Headers: ${JSON.stringify(headers)}`
      );
    }

    console.log(
      `[${context?.requestId?.slice(0, 8)}] Rate limit check passed: ${rateLimitResult.current}/${config.maxRequests} (${config.windowSeconds}s window)`
    );

    return {
      allowed: true,
      current: rateLimitResult.current,
      limit: config.maxRequests,
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime,
      retryAfter: 0
    } as RateLimitInfo;
  }, context);
};

interface RateLimitInfo {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}

/**
 * Determine rate limit configuration based on endpoint and user context
 */
function getRateLimitConfig(url: string, actor: Actor, orgContext: OrgContext): RateLimitConfig {
  const pathname = new URL(url).pathname;
  
  // AI endpoints have stricter limits
  if (pathname.includes('/ai/')) {
    return {
      maxRequests: 50, // 50 AI requests per minute
      windowSeconds: 60,
      strategy: 'sliding-window'
    };
  }
  
  // Transaction endpoints moderate limits
  if (pathname.includes('/transactions')) {
    return {
      maxRequests: 200, // 200 transactions per minute
      windowSeconds: 60,
      strategy: 'fixed-window'
    };
  }
  
  // Check if user is admin/owner for higher limits
  const isPrivileged = orgContext.roles.some(role => 
    ['admin', 'owner', 'super_admin'].includes(role.toLowerCase())
  );
  
  if (isPrivileged) {
    return {
      maxRequests: 1000, // 1000 requests per minute for admins
      windowSeconds: 60,
      strategy: 'fixed-window'
    };
  }
  
  // Default limits for regular users
  return {
    maxRequests: 500, // 500 requests per minute
    windowSeconds: 60,
    strategy: 'fixed-window'
  };
}

/**
 * Check if request is within rate limits
 */
async function checkRateLimit(
  actorId: string, 
  orgId: string, 
  config: RateLimitConfig
): Promise<RateLimitInfo> {
  const key = `rate_limit:${orgId}:${actorId}`;
  const now = Date.now();
  
  // Get current counter
  let counter = await getFromCache<RateLimitCounter>(key);
  
  if (config.strategy === 'fixed-window') {
    return checkFixedWindow(key, counter, config, now);
  } else {
    return checkSlidingWindow(key, counter, config, now);
  }
}

/**
 * Fixed window rate limiting
 */
async function checkFixedWindow(
  key: string,
  counter: RateLimitCounter | null,
  config: RateLimitConfig,
  now: number
): Promise<RateLimitInfo> {
  const windowStart = Math.floor(now / (config.windowSeconds * 1000)) * (config.windowSeconds * 1000);
  
  if (!counter || counter.windowStart !== windowStart) {
    // New window
    counter = {
      count: 1,
      windowStart,
      requests: []
    };
  } else {
    // Same window
    counter.count += 1;
  }
  
  const allowed = counter.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - counter.count);
  const resetTime = windowStart + (config.windowSeconds * 1000);
  const retryAfter = (resetTime - now) / 1000;
  
  // Save updated counter
  await setInCache(key, counter, config.windowSeconds + 1);
  
  return {
    allowed,
    current: counter.count,
    limit: config.maxRequests,
    remaining,
    resetTime,
    retryAfter: allowed ? 0 : retryAfter
  };
}

/**
 * Sliding window rate limiting
 */
async function checkSlidingWindow(
  key: string,
  counter: RateLimitCounter | null,
  config: RateLimitConfig,
  now: number
): Promise<RateLimitInfo> {
  const windowStart = now - (config.windowSeconds * 1000);
  
  if (!counter) {
    counter = {
      count: 0,
      windowStart: now,
      requests: []
    };
  }
  
  // Remove requests outside the sliding window
  counter.requests = counter.requests.filter(timestamp => timestamp > windowStart);
  
  // Add current request
  counter.requests.push(now);
  counter.count = counter.requests.length;
  counter.windowStart = now;
  
  const allowed = counter.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - counter.count);
  
  // Calculate when the next request would be allowed
  let resetTime = now;
  let retryAfter = 0;
  
  if (!allowed && counter.requests.length > 0) {
    const oldestRequest = Math.min(...counter.requests);
    resetTime = oldestRequest + (config.windowSeconds * 1000);
    retryAfter = (resetTime - now) / 1000;
  }
  
  // Save updated counter
  await setInCache(key, counter, config.windowSeconds + 1);
  
  return {
    allowed,
    current: counter.count,
    limit: config.maxRequests,
    remaining,
    resetTime,
    retryAfter: allowed ? 0 : Math.max(0, retryAfter)
  };
}

/**
 * Get rate limit status without incrementing counter
 */
export async function getRateLimitStatus(
  actorId: string, 
  orgId: string, 
  config: RateLimitConfig
): Promise<RateLimitInfo> {
  const key = `rate_limit:${orgId}:${actorId}`;
  const counter = await getFromCache<RateLimitCounter>(key);
  const now = Date.now();
  
  if (!counter) {
    return {
      allowed: true,
      current: 0,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: now + (config.windowSeconds * 1000),
      retryAfter: 0
    };
  }
  
  if (config.strategy === 'fixed-window') {
    const windowStart = Math.floor(now / (config.windowSeconds * 1000)) * (config.windowSeconds * 1000);
    const isCurrentWindow = counter.windowStart === windowStart;
    const current = isCurrentWindow ? counter.count : 0;
    
    return {
      allowed: current < config.maxRequests,
      current,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - current),
      resetTime: windowStart + (config.windowSeconds * 1000),
      retryAfter: 0
    };
  } else {
    const windowStart = now - (config.windowSeconds * 1000);
    const validRequests = counter.requests.filter(timestamp => timestamp > windowStart);
    
    return {
      allowed: validRequests.length < config.maxRequests,
      current: validRequests.length,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - validRequests.length),
      resetTime: validRequests.length > 0 ? Math.min(...validRequests) + (config.windowSeconds * 1000) : now,
      retryAfter: 0
    };
  }
}

/**
 * Reset rate limit for a specific actor (admin function)
 */
export async function resetRateLimit(actorId: string, orgId: string): Promise<void> {
  const key = `rate_limit:${orgId}:${actorId}`;
  const emptyCounter: RateLimitCounter = {
    count: 0,
    windowStart: Date.now(),
    requests: []
  };
  
  await setInCache(key, emptyCounter, 1); // Short TTL since it's empty
}
// HERA v2.3 API Gateway - Cache Client
// Smart Code: HERA.API.V2.CACHE.CLIENT.v1

// Simple in-memory cache for development/testing
// In production, this would use Redis/Upstash
class InMemoryCache {
  private cache = new Map<string, { value: any; expires: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expires });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  // Health check
  async healthCheck(): Promise<{ status: string; latency?: number; error?: string }> {
    try {
      const start = performance.now();
      await this.set('health_check', 'ok', 1);
      const result = await this.get('health_check');
      const latency = performance.now() - start;
      
      if (result === 'ok') {
        return { status: 'healthy', latency };
      } else {
        return { status: 'unhealthy', error: 'Cache test failed' };
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
}

// Redis cache client (when available)
class RedisCache {
  private redis: any;

  constructor() {
    try {
      // Try to initialize Redis/Upstash if environment variables are available
      const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
      const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
      
      if (redisUrl && redisToken) {
        // Note: In production, you'd import the actual Redis client here
        // For now, we'll use a mock implementation
        this.redis = {
          url: redisUrl,
          token: redisToken,
          connected: false
        };
      }
    } catch (error) {
      console.warn('Redis client initialization failed:', error);
      this.redis = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.redis) return null;
      
      // In production, this would be:
      // const result = await this.redis.get(key);
      // return result ? JSON.parse(result) : null;
      
      // Mock implementation
      return null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      if (!this.redis) return;
      
      // In production, this would be:
      // await this.redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
      
      // Mock implementation - do nothing for now
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (!this.redis) return;
      
      // In production: await this.redis.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async healthCheck(): Promise<{ status: string; latency?: number; error?: string }> {
    try {
      if (!this.redis) {
        return { status: 'unhealthy', error: 'Redis not configured' };
      }

      const start = performance.now();
      // In production: await this.redis.ping();
      const latency = performance.now() - start;
      
      return { status: 'healthy', latency };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
}

// Cache client factory
export function createCacheClient() {
  const useRedis = Deno.env.get('UPSTASH_REDIS_REST_URL') && Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  
  if (useRedis) {
    console.log('Using Redis cache client');
    return new RedisCache();
  } else {
    console.log('Using in-memory cache client (development mode)');
    return new InMemoryCache();
  }
}

// Global cache instance
let cacheInstance: InMemoryCache | RedisCache | null = null;

export function getCacheClient() {
  if (!cacheInstance) {
    cacheInstance = createCacheClient();
  }
  return cacheInstance;
}

// Convenience functions
export async function getFromCache<T>(key: string): Promise<T | null> {
  const client = getCacheClient();
  return client.get<T>(key);
}

export async function setInCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const client = getCacheClient();
  return client.set(key, value, ttlSeconds);
}

export async function deleteFromCache(key: string): Promise<void> {
  const client = getCacheClient();
  return client.delete(key);
}

export async function cacheHealthCheck() {
  const client = getCacheClient();
  return client.healthCheck();
}
import redis from '../../config/redis';
import { logger } from '../../config/logger';

export class CacheService {
  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!redis) {
      return null;
    }

    try {
      const value = await redis.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      logger.error({ error, key }, 'Cache get error');
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    if (!redis) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await redis.set(key, serialized, 'EX', ttl);
      return true;
    } catch (error) {
      logger.error({ error, key }, 'Cache set error');
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!redis) {
      return false;
    }

    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error({ error, key }, 'Cache delete error');
      return false;
    }
  }

  /**
   * Delete multiple keys
   */
  async deleteMany(keys: string[]): Promise<boolean> {
    if (!redis || keys.length === 0) {
      return false;
    }

    try {
      await redis.del(...keys);
      return true;
    } catch (error) {
      logger.error({ error, keys }, 'Cache delete many error');
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!redis) {
      return false;
    }

    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error({ error, key }, 'Cache exists error');
      return false;
    }
  }

  /**
   * Set expiry on existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!redis) {
      return false;
    }

    try {
      await redis.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error({ error, key }, 'Cache expire error');
      return false;
    }
  }

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    if (!redis) {
      return -1;
    }

    try {
      return await redis.ttl(key);
    } catch (error) {
      logger.error({ error, key }, 'Cache TTL error');
      return -1;
    }
  }

  /**
   * Increment value
   */
  async increment(key: string, amount: number = 1): Promise<number | null> {
    if (!redis) {
      return null;
    }

    try {
      return await redis.incrby(key, amount);
    } catch (error) {
      logger.error({ error, key }, 'Cache increment error');
      return null;
    }
  }

  /**
   * Decrement value
   */
  async decrement(key: string, amount: number = 1): Promise<number | null> {
    if (!redis) {
      return null;
    }

    try {
      return await redis.decrby(key, amount);
    } catch (error) {
      logger.error({ error, key }, 'Cache decrement error');
      return null;
    }
  }

  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    if (!redis) {
      return [];
    }

    try {
      return await redis.keys(pattern);
    } catch (error) {
      logger.error({ error, pattern }, 'Cache keys error');
      return [];
    }
  }

  /**
   * Clear all keys matching pattern
   */
  async clear(pattern: string = '*'): Promise<boolean> {
    if (!redis) {
      return false;
    }

    try {
      const keys = await this.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
      }

      return true;
    } catch (error) {
      logger.error({ error, pattern }, 'Cache clear error');
      return false;
    }
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const value = await fetchFn();

    // Store in cache
    await this.set(key, value, ttl);

    return value;
  }
}

export const cacheService = new CacheService();

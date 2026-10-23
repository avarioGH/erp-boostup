import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class MemoryCacheService {
  private readonly logger = new Logger(MemoryCacheService.name);
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Get cached data or fetch and cache it
   * @param key Unique cache key
   * @param ttlSeconds Time-to-live in seconds
   * @param fetcher Async function to fetch fresh data if expired or missing
   */
  async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const existing = this.cache.get(key);

    if (existing && existing.expiresAt > now) {
      return existing.data as T;
    }

    const freshData = await fetcher();
    this.cache.set(key, {
      data: freshData,
      expiresAt: now + ttlSeconds * 1000,
    });

    return freshData;
  }

  /**
   * Invalidate specific key or prefix
   */
  invalidate(keyOrPrefix: string) {
    for (const key of this.cache.keys()) {
      if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

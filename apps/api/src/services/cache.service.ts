import redis from '../config/redis';

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      console.error('Cache set error:', err);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (err) {
      console.error('Cache del error:', err);
    }
  }

  static async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const data = await fetcher();
    await this.set(key, data, ttlSeconds);
    return data;
  }

  static async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      console.error('Cache delPattern error:', err);
    }
  }

  // Cart operations (stored in Redis)
  static async getCart(userId: string): Promise<any[]> {
    const cart = await this.get<any[]>(`cart:${userId}`);
    return cart || [];
  }

  static async setCart(userId: string, items: any[]): Promise<void> {
    await this.set(`cart:${userId}`, items, 7 * 24 * 3600); // 7 days
  }

  static async clearCart(userId: string): Promise<void> {
    await this.del(`cart:${userId}`);
  }
}

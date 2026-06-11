import Redis from 'ioredis';
import { config } from './index';

let redis: Redis;

try {
  redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });
} catch (err) {
  console.error('Failed to initialize Redis:', err);
  // Create a mock redis for development without Redis
  redis = new Redis({ lazyConnect: true });
}

export { redis };
export default redis;

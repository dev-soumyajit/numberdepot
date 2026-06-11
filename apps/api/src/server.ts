import app from './app';
import { config } from './config';
import { prisma } from './config/database';
import redis from './config/redis';

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ PostgreSQL connected');

    // Test Redis connection
    try {
      await redis.connect();
      await redis.ping();
    } catch (err) {
      console.warn('⚠️  Redis not available — running without cache');
    }

    // Start server
    app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║   🔢  NumberDepot API Server                  ║
║                                               ║
║   Port:     ${String(config.port).padEnd(33)}║
║   Env:      ${config.nodeEnv.padEnd(33)}║
║   API:      http://localhost:${config.port}/api/v1       ║
║   Health:   http://localhost:${config.port}/api/health   ║
║                                               ║
╚═══════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down...');
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});

startServer();

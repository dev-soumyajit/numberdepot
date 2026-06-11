import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Email (Resend)
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@numberdepot.com',

  // Platform
  platformName: process.env.PLATFORM_NAME || 'NumberDepot',
  platformUrl: process.env.PLATFORM_URL || 'http://localhost:3000',
  platformCommissionRate: parseFloat(process.env.PLATFORM_COMMISSION_RATE || '10'),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@numberdepot.com',

  // Frontend URL (CORS)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  // Legacy — kept for backward compat
  buyerAppUrl: process.env.FRONTEND_URL || process.env.BUYER_APP_URL || 'http://localhost:3000',
  adminAppUrl: process.env.FRONTEND_URL || process.env.ADMIN_APP_URL || 'http://localhost:3000',
  sellerAppUrl: process.env.FRONTEND_URL || process.env.SELLER_APP_URL || 'http://localhost:3000',

  // Uploads
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};

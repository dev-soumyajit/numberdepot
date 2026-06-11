import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import numberRoutes from './modules/numbers/numbers.routes';
import searchRoutes from './modules/search/search.routes';
import listingRoutes from './modules/listings/listings.routes';
import offerRoutes from './modules/offers/offers.routes';
import orderRoutes from './modules/orders/orders.routes';
import brokerRoutes from './modules/broker/broker.routes';
import billingRoutes from './modules/billing/billing.routes';
import portingRoutes from './modules/porting/porting.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import contentRoutes from './modules/content/content.routes';
import commissionRoutes from './modules/commissions/commissions.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// ─── Middleware ───
app.use(helmet());
const allowedOrigins = [
  config.frontendUrl,
  config.buyerAppUrl,
  config.adminAppUrl,
  config.sellerAppUrl,
].filter((v, i, a) => v && a.indexOf(v) === i);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: config.platformName });
});

// ─── API Routes ───
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/numbers', numberRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/offers', offerRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/broker', brokerRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/porting', portingRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/commissions', commissionRoutes);
app.use('/api/v1/admin', adminRoutes);

// ─── 404 Handler ───
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ───
app.use(errorHandler);

export default app;

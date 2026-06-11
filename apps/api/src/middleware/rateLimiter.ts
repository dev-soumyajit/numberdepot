import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { RequestHandler } from 'express';

export const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
}) as unknown as RequestHandler;

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, error: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
}) as unknown as RequestHandler;

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: { success: false, error: 'Too many search requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
}) as unknown as RequestHandler;

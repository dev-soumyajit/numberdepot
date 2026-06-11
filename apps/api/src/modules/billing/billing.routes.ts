import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { apiResponse } from '../../utils/helpers';
import { NotFoundError, AppError } from '../../utils/errors';
import { PLAN_PRICES } from '../../utils/constants';

const router = Router();

// GET /billing/subscriptions
router.get('/subscriptions', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const subs = await prisma.subscription.findMany({
      where: { userId: req.user!.id },
      include: { phoneNumber: { select: { formatted: true, numberType: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(apiResponse(subs));
  } catch (error) { next(error); }
});

// PUT /billing/subscriptions/:id/plan — Change plan
router.put('/subscriptions/:id/plan', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { planType } = req.body;
    const sub = await prisma.subscription.findUnique({ where: { id: req.params.id } });
    if (!sub) throw new NotFoundError('Subscription');
    if (sub.userId !== req.user!.id) throw new AppError('Not your subscription', 403);

    const newPrice = PLAN_PRICES[planType as keyof typeof PLAN_PRICES];
    if (newPrice === undefined) throw new AppError('Invalid plan type', 400);

    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: { planType, monthlyAmount: newPrice },
    });
    res.json(apiResponse(updated, `Plan changed to ${planType}`));
  } catch (error) { next(error); }
});

// PUT /billing/subscriptions/:id/cancel
router.put('/subscriptions/:id/cancel', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const sub = await prisma.subscription.findUnique({ where: { id: req.params.id } });
    if (!sub) throw new NotFoundError('Subscription');
    if (sub.userId !== req.user!.id) throw new AppError('Not your subscription', 403);

    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });
    res.json(apiResponse(updated, 'Subscription cancelled'));
  } catch (error) { next(error); }
});

// GET /billing/invoices
router.get('/invoices', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.id, status: 'succeeded' },
      include: { order: { select: { orderNumber: true, totalAmount: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(apiResponse(payments));
  } catch (error) { next(error); }
});

export default router;

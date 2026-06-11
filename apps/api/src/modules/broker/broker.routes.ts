import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { apiResponse } from '../../utils/helpers';
import { NotFoundError, AppError } from '../../utils/errors';
import { generateAffiliateCode } from '../../utils/helpers';

const router = Router();

// POST /broker/apply
router.post('/apply', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const existing = await prisma.brokerProfile.findUnique({ where: { userId: req.user!.id } });
    if (existing) throw new AppError('Broker application already exists', 400);

    const { businessName, businessType, ein } = req.body;
    const profile = await prisma.brokerProfile.create({
      data: {
        userId: req.user!.id, businessName, businessType, ein,
        affiliateCode: generateAffiliateCode(),
        status: 'pending',
      },
    });

    // Update user role to seller
    await prisma.user.update({ where: { id: req.user!.id }, data: { role: 'seller' } });

    res.status(201).json(apiResponse(profile, 'Broker application submitted'));
  } catch (error) { next(error); }
});

// GET /broker/profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const profile = await prisma.brokerProfile.findUnique({
      where: { userId: req.user!.id },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });
    if (!profile) throw new NotFoundError('Broker profile');
    res.json(apiResponse(profile));
  } catch (error) { next(error); }
});

// PUT /broker/profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { businessName, businessType, bankAccountName, bankRoutingNumber, bankAccountType } = req.body;
    const profile = await prisma.brokerProfile.update({
      where: { userId: req.user!.id },
      data: { businessName, businessType, bankAccountName, bankRoutingNumber, bankAccountType },
    });
    res.json(apiResponse(profile, 'Profile updated'));
  } catch (error) { next(error); }
});

// GET /broker/dashboard
router.get('/dashboard', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const profile = await prisma.brokerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) throw new NotFoundError('Broker profile');

    const [activeListings, totalOffers, pendingOffers, recentSales] = await Promise.all([
      prisma.listing.count({ where: { sellerId: req.user!.id, status: 'active' } }),
      prisma.offer.count({ where: { sellerId: req.user!.id } }),
      prisma.offer.count({ where: { sellerId: req.user!.id, status: 'pending' } }),
      prisma.commission.findMany({
        where: { brokerId: profile.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { orderItem: { include: { phoneNumber: { select: { formatted: true } } } } },
      }),
    ]);

    res.json(apiResponse({
      earnings: {
        total: profile.totalRevenue,
        pending: profile.pendingBalance,
        available: profile.availableBalance,
        paidOut: profile.totalPayouts,
      },
      stats: { activeListings, totalOffers, pendingOffers, totalSales: profile.totalSales },
      recentSales,
      commissionRate: profile.commissionRate,
      affiliateCode: profile.affiliateCode,
    }));
  } catch (error) { next(error); }
});

// GET /broker/earnings
router.get('/earnings', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const profile = await prisma.brokerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) throw new NotFoundError('Broker profile');

    const commissions = await prisma.commission.findMany({
      where: { brokerId: profile.id },
      include: { orderItem: { include: { phoneNumber: { select: { formatted: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(apiResponse(commissions));
  } catch (error) { next(error); }
});

// GET /broker/sales
router.get('/sales', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const sales = await prisma.orderItem.findMany({
      where: { sellerId: req.user!.id },
      include: {
        order: { select: { orderNumber: true, status: true, completedAt: true } },
        phoneNumber: { select: { formatted: true, numberType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(apiResponse(sales));
  } catch (error) { next(error); }
});

// POST /broker/payout — Request payout
router.post('/payout', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const profile = await prisma.brokerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) throw new NotFoundError('Broker profile');
    if (Number(profile.availableBalance) <= 0) throw new AppError('No available balance for payout', 400);

    const payout = await prisma.payout.create({
      data: {
        brokerId: profile.id,
        amount: profile.availableBalance,
        method: 'ach',
        status: 'pending',
      },
    });

    // Reset available balance
    await prisma.brokerProfile.update({
      where: { id: profile.id },
      data: {
        availableBalance: 0,
        totalPayouts: { increment: Number(profile.availableBalance) },
      },
    });

    res.json(apiResponse(payout, 'Payout requested'));
  } catch (error) { next(error); }
});

// GET /broker/payouts
router.get('/payouts', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const profile = await prisma.brokerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) throw new NotFoundError('Broker profile');

    const payouts = await prisma.payout.findMany({
      where: { brokerId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(apiResponse(payouts));
  } catch (error) { next(error); }
});

export default router;

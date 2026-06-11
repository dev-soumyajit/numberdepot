import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { apiResponse, paginationHelper } from '../../utils/helpers';
import { NotFoundError } from '../../utils/errors';

const router = Router();

// GET /commissions — Seller's commission records
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const profile = await prisma.brokerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) throw new NotFoundError('Broker profile');

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const status = req.query.status as string;

    const where: any = { brokerId: profile.id };
    if (status) where.status = status;

    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          orderItem: {
            include: {
              phoneNumber: { select: { formatted: true, numberType: true, areaCode: true } },
              order: { select: { orderNumber: true, completedAt: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.commission.count({ where }),
    ]);

    res.json(apiResponse(commissions, 'Commissions retrieved', paginationHelper(page, limit, total)));
  } catch (error) { next(error); }
});

// GET /commissions/summary — Seller's earnings summary
router.get('/summary', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const profile = await prisma.brokerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) throw new NotFoundError('Broker profile');

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [allTime, thisMonth, lastMonth, pending, held, available] = await Promise.all([
      prisma.commission.aggregate({
        where: { brokerId: profile.id },
        _sum: { sellerEarnings: true, platformFee: true, saleAmount: true },
        _count: true,
      }),
      prisma.commission.aggregate({
        where: { brokerId: profile.id, createdAt: { gte: thisMonthStart } },
        _sum: { sellerEarnings: true, saleAmount: true },
        _count: true,
      }),
      prisma.commission.aggregate({
        where: { brokerId: profile.id, createdAt: { gte: lastMonthStart, lt: thisMonthStart } },
        _sum: { sellerEarnings: true, saleAmount: true },
        _count: true,
      }),
      prisma.commission.aggregate({
        where: { brokerId: profile.id, status: 'pending' },
        _sum: { sellerEarnings: true },
      }),
      prisma.commission.aggregate({
        where: { brokerId: profile.id, status: 'held' },
        _sum: { sellerEarnings: true },
      }),
      prisma.commission.aggregate({
        where: { brokerId: profile.id, status: 'available' },
        _sum: { sellerEarnings: true },
      }),
    ]);

    res.json(apiResponse({
      allTime: {
        totalSales: allTime._count,
        totalVolume: allTime._sum.saleAmount || 0,
        totalEarnings: allTime._sum.sellerEarnings || 0,
        totalPlatformFees: allTime._sum.platformFee || 0,
      },
      thisMonth: {
        sales: thisMonth._count,
        volume: thisMonth._sum.saleAmount || 0,
        earnings: thisMonth._sum.sellerEarnings || 0,
      },
      lastMonth: {
        sales: lastMonth._count,
        volume: lastMonth._sum.saleAmount || 0,
        earnings: lastMonth._sum.sellerEarnings || 0,
      },
      balances: {
        pending: pending._sum.sellerEarnings || 0,
        held: held._sum.sellerEarnings || 0,
        available: available._sum.sellerEarnings || 0,
        total: profile.pendingBalance,
      },
    }));
  } catch (error) { next(error); }
});

// GET /commissions/admin — All commissions (admin)
router.get('/admin', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const [commissions, total, summary] = await Promise.all([
      prisma.commission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          brokerProfile: {
            include: { user: { select: { email: true, firstName: true, lastName: true } } },
          },
          orderItem: {
            include: {
              phoneNumber: { select: { formatted: true } },
              order: { select: { orderNumber: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.commission.count({ where }),
      prisma.commission.aggregate({
        where,
        _sum: { platformFee: true, sellerEarnings: true, saleAmount: true },
        _count: true,
      }),
    ]);

    res.json(apiResponse({
      commissions,
      summary: {
        totalTransactions: summary._count,
        totalSalesVolume: summary._sum.saleAmount || 0,
        totalPlatformRevenue: summary._sum.platformFee || 0,
        totalSellerPayouts: summary._sum.sellerEarnings || 0,
      },
    }, 'Commissions retrieved', paginationHelper(page, limit, total)));
  } catch (error) { next(error); }
});

// GET /commissions/admin/summary — Revenue summary (admin)
router.get('/admin/summary', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [allTime, today, week, month, byStatus] = await Promise.all([
      prisma.commission.aggregate({
        _sum: { platformFee: true, sellerEarnings: true, saleAmount: true },
        _count: true,
      }),
      prisma.commission.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { platformFee: true, saleAmount: true },
        _count: true,
      }),
      prisma.commission.aggregate({
        where: { createdAt: { gte: weekStart } },
        _sum: { platformFee: true, saleAmount: true },
        _count: true,
      }),
      prisma.commission.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { platformFee: true, saleAmount: true },
        _count: true,
      }),
      prisma.commission.groupBy({
        by: ['status'],
        _sum: { sellerEarnings: true, platformFee: true },
        _count: true,
      }),
    ]);

    res.json(apiResponse({
      allTime: {
        transactions: allTime._count,
        salesVolume: allTime._sum.saleAmount || 0,
        platformRevenue: allTime._sum.platformFee || 0,
        sellerPayouts: allTime._sum.sellerEarnings || 0,
      },
      today: { transactions: today._count, revenue: today._sum.platformFee || 0, volume: today._sum.saleAmount || 0 },
      thisWeek: { transactions: week._count, revenue: week._sum.platformFee || 0, volume: week._sum.saleAmount || 0 },
      thisMonth: { transactions: month._count, revenue: month._sum.platformFee || 0, volume: month._sum.saleAmount || 0 },
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
        sellerEarnings: s._sum.sellerEarnings || 0,
        platformFee: s._sum.platformFee || 0,
      })),
    }));
  } catch (error) { next(error); }
});

export default router;

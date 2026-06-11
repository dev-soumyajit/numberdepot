import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { apiResponse } from '../../utils/helpers';
import { EmailService } from '../../services/email.service';

const router = Router();

// GET /admin/dashboard
router.get('/dashboard', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers, totalNumbers, totalOrders, totalRevenue,
      newUsersToday, newUsersWeek, newUsersMonth,
      ordersToday, ordersWeek,
      availableNumbers, soldNumbers, pendingBrokers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.phoneNumber.count(),
      prisma.order.count({ where: { status: 'completed' } }),
      prisma.order.aggregate({ where: { status: 'completed' }, _sum: { totalAmount: true } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.order.count({ where: { status: 'completed', completedAt: { gte: todayStart } } }),
      prisma.order.count({ where: { status: 'completed', completedAt: { gte: weekStart } } }),
      prisma.phoneNumber.count({ where: { status: 'available' } }),
      prisma.phoneNumber.count({ where: { status: 'sold' } }),
      prisma.brokerProfile.count({ where: { status: 'pending' } }),
    ]);

    res.json(apiResponse({
      overview: {
        totalUsers, totalNumbers, totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
      },
      newUsers: { today: newUsersToday, week: newUsersWeek, month: newUsersMonth },
      orders: { today: ordersToday, week: ordersWeek },
      inventory: { available: availableNumbers, sold: soldNumbers },
      pendingBrokerApplications: pendingBrokers,
    }));
  } catch (error) { next(error); }
});

// GET /admin/broker-applications
router.get('/broker-applications', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const status = (req.query.status as string) || 'pending';
    const applications = await prisma.brokerProfile.findMany({
      where: { status },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(apiResponse(applications));
  } catch (error) { next(error); }
});

// PUT /admin/broker-applications/:id
router.put('/broker-applications/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const { status, reason } = req.body; // status: approved or rejected
    const profile = await prisma.brokerProfile.update({
      where: { id: req.params.id },
      data: {
        status,
        approvedAt: status === 'approved' ? new Date() : undefined,
      },
      include: { user: { select: { email: true } } },
    });

    if (status === 'approved') {
      await EmailService.sendBrokerApproved(profile.user.email);
    } else if (status === 'rejected') {
      await EmailService.sendBrokerRejected(profile.user.email, reason || 'Application did not meet requirements');
    }

    res.json(apiResponse(profile, `Application ${status}`));
  } catch (error) { next(error); }
});

// GET /admin/settings
router.get('/settings', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const settings = await prisma.platformSetting.findMany();
    const map: Record<string, string> = {};
    settings.forEach(s => map[s.key] = s.value);
    res.json(apiResponse(map));
  } catch (error) { next(error); }
});

// PUT /admin/settings
router.put('/settings', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const updates = req.body; // { key: value, key: value }
    for (const [key, value] of Object.entries(updates)) {
      await prisma.platformSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
    res.json(apiResponse(null, 'Settings updated'));
  } catch (error) { next(error); }
});

// GET /admin/commissions
router.get('/commissions', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const commissions = await prisma.commission.findMany({
      include: {
        brokerProfile: { include: { user: { select: { email: true, firstName: true } } } },
        orderItem: { include: { phoneNumber: { select: { formatted: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const summary = await prisma.commission.aggregate({
      _sum: { platformFee: true, sellerEarnings: true, saleAmount: true },
      _count: true,
    });

    res.json(apiResponse({ commissions, summary: {
      totalPlatformFees: summary._sum.platformFee || 0,
      totalSellerEarnings: summary._sum.sellerEarnings || 0,
      totalSalesVolume: summary._sum.saleAmount || 0,
      totalTransactions: summary._count,
    }}));
  } catch (error) { next(error); }
});

export default router;

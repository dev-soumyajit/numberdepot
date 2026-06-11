import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { apiResponse } from '../../utils/helpers';
import { NotFoundError } from '../../utils/errors';
import bcrypt from 'bcryptjs';

const router = Router();

// GET /users/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        role: true, status: true, avatarUrl: true, companyName: true,
        addressLine1: true, addressLine2: true, city: true, state: true,
        zipCode: true, country: true, createdAt: true, lastLoginAt: true,
        _count: { select: { phoneNumbers: true, orders: true, subscriptions: true } },
      },
    });
    if (!user) throw new NotFoundError('User');
    res.json(apiResponse(user));
  } catch (error) { next(error); }
});

// PUT /users/me
router.put('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { firstName, lastName, phone, companyName, addressLine1, addressLine2, city, state, zipCode, country } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { firstName, lastName, phone, companyName, addressLine1, addressLine2, city, state, zipCode, country },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, companyName: true },
    });
    res.json(apiResponse(user, 'Profile updated'));
  } catch (error) { next(error); }
});

// PUT /users/me/password
router.put('/me/password', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new NotFoundError('User');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new Error('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json(apiResponse(null, 'Password changed'));
  } catch (error) { next(error); }
});

// GET /users — Admin list
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.min(100, parseInt(req.query.limit as string || '20'));
    const skip = (page - 1) * limit;
    const role = req.query.role as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit,
        select: {
          id: true, email: true, firstName: true, lastName: true, role: true,
          status: true, createdAt: true, lastLoginAt: true,
          _count: { select: { phoneNumbers: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json(apiResponse(users, 'Users retrieved', { page, limit, total, totalPages: Math.ceil(total / limit) }));
  } catch (error) { next(error); }
});

// GET /users/:id — Admin get user
router.get('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        brokerProfile: true,
        _count: { select: { phoneNumbers: true, orders: true, subscriptions: true } },
      },
    });
    if (!user) throw new NotFoundError('User');
    const { passwordHash, ...safeUser } = user;
    res.json(apiResponse(safeUser));
  } catch (error) { next(error); }
});

// PUT /users/:id/status — Admin update status
router.put('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const { status } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status },
      select: { id: true, email: true, status: true },
    });
    res.json(apiResponse(user, `User ${status}`));
  } catch (error) { next(error); }
});

export default router;

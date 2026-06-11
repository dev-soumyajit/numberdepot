import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { apiResponse, paginationHelper } from '../../utils/helpers';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

const router = Router();

// POST /porting/port-in
router.post('/port-in', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { currentCarrier, accountNumber, pin, authorizedName, serviceAddress, phoneNumberId } = req.body;
    const request = await prisma.portRequest.create({
      data: {
        userId: req.user!.id, phoneNumberId, portType: 'port_in',
        currentCarrier, accountNumber, pin, authorizedName, serviceAddress,
        estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    res.status(201).json(apiResponse(request, 'Port-in request submitted'));
  } catch (error) { next(error); }
});

// POST /porting/port-out
router.post('/port-out', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { phoneNumberId } = req.body;
    const phone = await prisma.phoneNumber.findUnique({ where: { id: phoneNumberId } });
    if (!phone) throw new NotFoundError('Phone number');
    if (phone.ownerId !== req.user!.id) throw new ForbiddenError('You do not own this number');

    const customPin = Math.random().toString(36).slice(-6).toUpperCase();
    const request = await prisma.portRequest.create({
      data: {
        userId: req.user!.id, phoneNumberId, portType: 'port_out', customPortPin: customPin,
        estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    });
    res.status(201).json(apiResponse({ ...request, customPortPin: customPin }, 'Port-out request submitted'));
  } catch (error) { next(error); }
});

// GET /porting/my-requests
router.get('/my-requests', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const requests = await prisma.portRequest.findMany({
      where: { userId: req.user!.id },
      include: { phoneNumber: { select: { formatted: true, numberType: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(apiResponse(requests));
  } catch (error) { next(error); }
});

// GET /porting/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const request = await prisma.portRequest.findUnique({
      where: { id: req.params.id },
      include: { phoneNumber: true, user: { select: { email: true, firstName: true } } },
    });
    if (!request) throw new NotFoundError('Port request');
    if (request.userId !== req.user!.id && !['admin', 'super_admin'].includes(req.user!.role)) throw new ForbiddenError();
    res.json(apiResponse(request));
  } catch (error) { next(error); }
});

// PUT /porting/:id/cancel
router.put('/:id/cancel', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const request = await prisma.portRequest.findUnique({ where: { id: req.params.id } });
    if (!request) throw new NotFoundError('Port request');
    if (request.userId !== req.user!.id) throw new ForbiddenError();
    await prisma.portRequest.update({ where: { id: req.params.id }, data: { status: 'cancelled' } });
    res.json(apiResponse(null, 'Port request cancelled'));
  } catch (error) { next(error); }
});

// GET /porting/admin/all
router.get('/admin/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = 20;
    const [requests, total] = await Promise.all([
      prisma.portRequest.findMany({
        skip: (page - 1) * limit, take: limit,
        include: {
          phoneNumber: { select: { formatted: true } },
          user: { select: { email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.portRequest.count(),
    ]);
    res.json(apiResponse(requests, 'Port requests', paginationHelper(page, limit, total)));
  } catch (error) { next(error); }
});

// PUT /porting/:id/status — Admin
router.put('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const updated = await prisma.portRequest.update({
      where: { id: req.params.id },
      data: {
        status,
        rejectionReason,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
    });

    if (status === 'completed' && updated.phoneNumberId) {
      const newStatus = updated.portType === 'port_out' ? 'ported_out' : 'parked';
      await prisma.phoneNumber.update({
        where: { id: updated.phoneNumberId },
        data: { status: newStatus },
      });
    }

    res.json(apiResponse(updated, `Port request ${status}`));
  } catch (error) { next(error); }
});

export default router;

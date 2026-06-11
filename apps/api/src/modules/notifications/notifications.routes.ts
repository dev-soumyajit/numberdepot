import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { apiResponse } from '../../utils/helpers';

const router = Router();

// GET /notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.min(50, parseInt(req.query.limit as string || '20'));
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    res.json(apiResponse(notifications));
  } catch (error) { next(error); }
});

// GET /notifications/unread-count
router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const count = await prisma.notification.count({ where: { userId: req.user!.id, isRead: false } });
    res.json(apiResponse({ count }));
  } catch (error) { next(error); }
});

// PUT /notifications/:id/read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true, readAt: new Date() },
    });
    res.json(apiResponse(null, 'Marked as read'));
  } catch (error) { next(error); }
});

// PUT /notifications/read-all
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    res.json(apiResponse(null, 'All notifications marked as read'));
  } catch (error) { next(error); }
});

export default router;

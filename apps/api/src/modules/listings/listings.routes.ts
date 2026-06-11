import { Router, Response, NextFunction, Request } from 'express';
import { prisma } from '../../config/database';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { apiResponse, paginationHelper } from '../../utils/helpers';
import { NotFoundError, ForbiddenError, AppError } from '../../utils/errors';

const router = Router();

// POST /listings — Create listing (seller)
router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { phoneNumberId, listingType, salePrice, licensePrice, minimumOffer, allowOffers } = req.body;

    const phone = await prisma.phoneNumber.findUnique({ where: { id: phoneNumberId } });
    if (!phone) throw new NotFoundError('Phone number');
    if (phone.ownerId !== req.user!.id && req.user!.role !== 'admin') {
      throw new ForbiddenError('You do not own this number');
    }

    const broker = await prisma.brokerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!broker || broker.status !== 'approved') {
      throw new AppError('You must be an approved broker to list numbers', 400);
    }

    if (phone.numberType === 'toll_free' && listingType === 'sale') {
      throw new AppError('Toll-free numbers can only be licensed, not sold (FCC regulation)', 400);
    }

    const listing = await prisma.listing.create({
      data: {
        phoneNumberId, sellerId: req.user!.id, listingType,
        salePrice, licensePrice, minimumOffer,
        allowOffers: allowOffers ?? true,
      },
      include: { phoneNumber: { select: { number: true, formatted: true, numberType: true } } },
    });

    res.status(201).json(apiResponse(listing, 'Number listed'));
  } catch (error) { next(error); }
});

// GET /listings/my — Seller's listings
router.get('/my', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { sellerId: req.user!.id },
      include: {
        phoneNumber: { select: { id: true, number: true, formatted: true, numberType: true, areaCode: true, cityName: true, stateName: true } },
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(apiResponse(listings));
  } catch (error) { next(error); }
});

// GET /listings/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        phoneNumber: true,
        seller: { select: { id: true, firstName: true, companyName: true } },
      },
    });
    if (!listing) throw new NotFoundError('Listing');
    res.json(apiResponse(listing));
  } catch (error) { next(error); }
});

// PUT /listings/:id — Update listing
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) throw new NotFoundError('Listing');
    if (listing.sellerId !== req.user!.id && req.user!.role !== 'admin') throw new ForbiddenError();

    const { salePrice, licensePrice, minimumOffer, allowOffers, listingType } = req.body;
    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: { salePrice, licensePrice, minimumOffer, allowOffers, listingType },
    });
    res.json(apiResponse(updated, 'Listing updated'));
  } catch (error) { next(error); }
});

// PUT /listings/:id/status
router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { status } = req.body;
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) throw new NotFoundError('Listing');
    if (listing.sellerId !== req.user!.id && req.user!.role !== 'admin') throw new ForbiddenError();

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(apiResponse(updated, `Listing ${status}`));
  } catch (error) { next(error); }
});

// DELETE /listings/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) throw new NotFoundError('Listing');
    if (listing.sellerId !== req.user!.id && req.user!.role !== 'admin') throw new ForbiddenError();

    await prisma.listing.delete({ where: { id: req.params.id } });
    res.json(apiResponse(null, 'Listing removed'));
  } catch (error) { next(error); }
});

// GET /listings/admin/all
router.get('/admin/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.min(100, parseInt(req.query.limit as string || '20'));
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        skip: (page - 1) * limit, take: limit,
        include: {
          phoneNumber: { select: { number: true, formatted: true, numberType: true } },
          seller: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.listing.count(),
    ]);
    res.json(apiResponse(listings, 'Listings retrieved', paginationHelper(page, limit, total)));
  } catch (error) { next(error); }
});

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { requireAdmin, requireSeller } from '../../middleware/rbac';
import { apiResponse, paginationHelper } from '../../utils/helpers';
import { NotFoundError, ForbiddenError, AppError } from '../../utils/errors';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';

const router = Router();

// GET /numbers — List available numbers (public)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.min(100, parseInt(req.query.limit as string || String(DEFAULT_PAGE_SIZE)));
    const skip = (page - 1) * limit;

    const [numbers, total] = await Promise.all([
      prisma.phoneNumber.findMany({
        where: { status: 'available' },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          listings: {
            where: { status: 'active' },
            select: { id: true, salePrice: true, licensePrice: true, listingType: true, allowOffers: true, sellerId: true },
          },
          owner: { select: { id: true, firstName: true, companyName: true, role: true } },
        },
      }),
      prisma.phoneNumber.count({ where: { status: 'available' } }),
    ]);

    res.json(apiResponse(numbers, 'Numbers retrieved', paginationHelper(page, limit, total)));
  } catch (error) { next(error); }
});

// GET /numbers/area-codes — Available area codes
router.get('/area-codes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const areaCodes = await prisma.phoneNumber.groupBy({
      by: ['areaCode'],
      where: { status: 'available' },
      _count: { areaCode: true },
      orderBy: { areaCode: 'asc' },
    });
    res.json(apiResponse(areaCodes.map(ac => ({ areaCode: ac.areaCode, count: ac._count.areaCode }))));
  } catch (error) { next(error); }
});

// GET /numbers/my — User's owned numbers (buyer sees purchased, seller sees inventory)
router.get('/my', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const numbers = await prisma.phoneNumber.findMany({
      where: { ownerId: req.user!.id },
      include: {
        subscriptions: { where: { status: 'active' } },
        listings: { where: { status: 'active' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(apiResponse(numbers));
  } catch (error) { next(error); }
});

// GET /numbers/:id — Number detail (public)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const number = await prisma.phoneNumber.findUnique({
      where: { id: req.params.id },
      include: {
        listings: {
          where: { status: 'active' },
          include: { seller: { select: { id: true, firstName: true, companyName: true, role: true } } },
        },
        owner: { select: { id: true, firstName: true, companyName: true, role: true } },
      },
    });
    if (!number) throw new NotFoundError('Phone number');

    // Increment view count on active listings
    if (number.listings.length > 0) {
      await prisma.listing.updateMany({
        where: { phoneNumberId: number.id, status: 'active' },
        data: { viewsCount: { increment: 1 } },
      });
    }

    res.json(apiResponse(number));
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════
// ADMIN — Add platform-owned numbers
// ═══════════════════════════════════════════

// POST /numbers/admin — Admin adds number (source: platform, owner: admin)
router.post('/admin', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      number, formatted, countryCode, areaCode, numberType,
      vanityText, basePrice, monthlyPrice, isVanity, isPremium,
      isPortable, pattern, stateName, cityName, searchText,
      // Listing fields — admin can set price directly
      salePrice, licensePrice, listingType, allowOffers, minimumOffer,
    } = req.body;

    // Create the phone number owned by admin (platform inventory)
    const phoneNumber = await prisma.phoneNumber.create({
      data: {
        number, formatted, countryCode: countryCode || '+1',
        areaCode, numberType: numberType || 'local',
        vanityText, basePrice: basePrice || 0,
        monthlyPrice, isVanity: isVanity || false,
        isPremium: isPremium || false, isPortable: isPortable ?? true,
        pattern, stateName, cityName, searchText,
        source: 'platform',
        ownerId: req.user!.id, // Admin owns it
        status: 'available',
      },
    });

    // Auto-create a listing for this number
    const listing = await prisma.listing.create({
      data: {
        phoneNumberId: phoneNumber.id,
        sellerId: req.user!.id, // Admin is the seller
        listingType: listingType || 'sale',
        salePrice: salePrice || basePrice,
        licensePrice: licensePrice || null,
        minimumOffer: minimumOffer || null,
        allowOffers: allowOffers ?? false, // Platform numbers usually don't allow offers
        status: 'active',
      },
    });

    res.status(201).json(apiResponse({
      phoneNumber,
      listing,
    }, 'Platform number added and listed'));
  } catch (error) { next(error); }
});

// PUT /numbers/admin/:id — Admin update number
router.put('/admin/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const phoneNumber = await prisma.phoneNumber.findUnique({ where: { id: req.params.id } });
    if (!phoneNumber) throw new NotFoundError('Phone number');

    const {
      formatted, numberType, vanityText, basePrice, monthlyPrice,
      isVanity, isPremium, pattern, stateName, cityName, searchText, status,
      // Listing update fields
      salePrice, licensePrice, listingType, allowOffers, minimumOffer,
    } = req.body;

    const updated = await prisma.phoneNumber.update({
      where: { id: req.params.id },
      data: {
        formatted, numberType, vanityText, basePrice, monthlyPrice,
        isVanity, isPremium, pattern, stateName, cityName, searchText, status,
      },
    });

    // Update active listing if exists
    if (salePrice !== undefined || licensePrice !== undefined || listingType || allowOffers !== undefined) {
      await prisma.listing.updateMany({
        where: { phoneNumberId: req.params.id, status: 'active' },
        data: {
          ...(salePrice !== undefined && { salePrice }),
          ...(licensePrice !== undefined && { licensePrice }),
          ...(listingType && { listingType }),
          ...(allowOffers !== undefined && { allowOffers }),
          ...(minimumOffer !== undefined && { minimumOffer }),
        },
      });
    }

    res.json(apiResponse(updated, 'Number updated'));
  } catch (error) { next(error); }
});

// DELETE /numbers/admin/:id — Admin delete number
router.delete('/admin/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const phoneNumber = await prisma.phoneNumber.findUnique({ where: { id: req.params.id } });
    if (!phoneNumber) throw new NotFoundError('Phone number');

    // Delete related listings first
    await prisma.listing.deleteMany({ where: { phoneNumberId: req.params.id } });
    await prisma.phoneNumber.delete({ where: { id: req.params.id } });
    res.json(apiResponse(null, 'Number deleted'));
  } catch (error) { next(error); }
});

// GET /numbers/admin/all — Admin see all numbers
router.get('/admin/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.min(100, parseInt(req.query.limit as string || '20'));
    const source = req.query.source as string; // filter by platform/broker
    const status = req.query.status as string;

    const where: any = {};
    if (source) where.source = source;
    if (status) where.status = status;

    const [numbers, total] = await Promise.all([
      prisma.phoneNumber.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: {
          owner: { select: { id: true, email: true, firstName: true, role: true, companyName: true } },
          listings: { where: { status: 'active' }, select: { id: true, salePrice: true, licensePrice: true, listingType: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.phoneNumber.count({ where }),
    ]);

    res.json(apiResponse(numbers, 'All numbers', paginationHelper(page, limit, total)));
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════
// SELLER — Add seller-owned numbers
// ═══════════════════════════════════════════

// POST /numbers/seller — Seller adds their own number + auto-list
router.post('/seller', authenticate, requireSeller, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Verify seller is an approved broker
    const broker = await prisma.brokerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!broker || broker.status !== 'approved') {
      throw new AppError('You must be an approved broker to add numbers', 403);
    }

    const {
      number, formatted, countryCode, areaCode, numberType,
      vanityText, basePrice, isVanity, isPremium,
      pattern, stateName, cityName, searchText,
      // Listing/pricing fields
      salePrice, licensePrice, listingType, allowOffers, minimumOffer,
    } = req.body;

    // Validate required fields
    if (!number || !formatted || !areaCode) {
      throw new AppError('Number, formatted number, and area code are required', 400);
    }

    // Toll-free can only be licensed
    if (numberType === 'toll_free' && listingType === 'sale') {
      throw new AppError('Toll-free numbers can only be licensed, not sold (FCC regulation)', 400);
    }

    // Create number owned by seller
    const phoneNumber = await prisma.phoneNumber.create({
      data: {
        number, formatted, countryCode: countryCode || '+1',
        areaCode, numberType: numberType || 'local',
        vanityText, basePrice: salePrice || basePrice || 0,
        isVanity: isVanity || false, isPremium: isPremium || false,
        pattern, stateName, cityName, searchText,
        source: 'broker', // Seller-added
        ownerId: req.user!.id,
        status: 'available',
      },
    });

    // Auto-create listing
    const listing = await prisma.listing.create({
      data: {
        phoneNumberId: phoneNumber.id,
        sellerId: req.user!.id,
        listingType: listingType || 'sale',
        salePrice: salePrice || basePrice || 0,
        licensePrice: licensePrice || null,
        minimumOffer: minimumOffer || null,
        allowOffers: allowOffers ?? true, // Sellers usually allow offers
        status: 'active',
      },
    });

    res.status(201).json(apiResponse({
      phoneNumber,
      listing,
    }, 'Number added and listed'));
  } catch (error) { next(error); }
});

// PUT /numbers/seller/:id — Seller update their own number
router.put('/seller/:id', authenticate, requireSeller, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const phoneNumber = await prisma.phoneNumber.findUnique({ where: { id: req.params.id } });
    if (!phoneNumber) throw new NotFoundError('Phone number');
    if (phoneNumber.ownerId !== req.user!.id) throw new ForbiddenError('You do not own this number');

    const {
      formatted, vanityText, basePrice, isVanity, isPremium,
      pattern, stateName, cityName, searchText, status,
      salePrice, licensePrice, listingType, allowOffers, minimumOffer,
    } = req.body;

    const updated = await prisma.phoneNumber.update({
      where: { id: req.params.id },
      data: {
        formatted, vanityText, basePrice: salePrice || basePrice,
        isVanity, isPremium, pattern, stateName, cityName, searchText,
        ...(status === 'delisted' && { status: 'delisted' }), // Seller can delist
      },
    });

    // Update listing
    if (salePrice !== undefined || licensePrice !== undefined || listingType || allowOffers !== undefined) {
      await prisma.listing.updateMany({
        where: { phoneNumberId: req.params.id, sellerId: req.user!.id, status: 'active' },
        data: {
          ...(salePrice !== undefined && { salePrice }),
          ...(licensePrice !== undefined && { licensePrice }),
          ...(listingType && { listingType }),
          ...(allowOffers !== undefined && { allowOffers }),
          ...(minimumOffer !== undefined && { minimumOffer }),
        },
      });
    }

    res.json(apiResponse(updated, 'Number updated'));
  } catch (error) { next(error); }
});

// DELETE /numbers/seller/:id — Seller delist/remove their number
router.delete('/seller/:id', authenticate, requireSeller, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const phoneNumber = await prisma.phoneNumber.findUnique({ where: { id: req.params.id } });
    if (!phoneNumber) throw new NotFoundError('Phone number');
    if (phoneNumber.ownerId !== req.user!.id) throw new ForbiddenError('You do not own this number');

    // Check if number has active orders
    const activeOrders = await prisma.orderItem.findFirst({
      where: { phoneNumberId: req.params.id, order: { status: 'pending' } },
    });
    if (activeOrders) throw new AppError('Cannot delete number with pending orders', 400);

    // Delist and deactivate listings
    await prisma.listing.updateMany({
      where: { phoneNumberId: req.params.id, sellerId: req.user!.id },
      data: { status: 'delisted' },
    });

    await prisma.phoneNumber.update({
      where: { id: req.params.id },
      data: { status: 'delisted' },
    });

    res.json(apiResponse(null, 'Number delisted'));
  } catch (error) { next(error); }
});

export default router;

import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { CacheService } from '../../services/cache.service';
import { apiResponse, paginationHelper } from '../../utils/helpers';
import { searchLimiter } from '../../middleware/rateLimiter';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../utils/constants';
import crypto from 'crypto';

const router = Router();

// GET /api/v1/search — Advanced number search
router.get('/', searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      q, area_code, number_type, price_min, price_max,
      pattern, sort, page: pageStr, limit: limitStr,
      listing_type, state,
    } = req.query;

    const page = Math.max(1, parseInt(pageStr as string) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limitStr as string) || DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * limit;

    // Build cache key from query
    const cacheKey = `search:${crypto.createHash('md5').update(JSON.stringify(req.query)).digest('hex')}`;
    const cached = await CacheService.get<any>(cacheKey);
    if (cached) return res.json(cached);

    // Build where clause
    const where: any = {
      status: 'available',
    };

    // Text/digit search
    if (q) {
      const query = (q as string).trim();
      const isDigitSearch = /^\d+$/.test(query);
      if (isDigitSearch) {
        where.number = { contains: query };
      } else {
        where.OR = [
          { vanityText: { contains: query, mode: 'insensitive' } },
          { searchText: { contains: query, mode: 'insensitive' } },
          { cityName: { contains: query, mode: 'insensitive' } },
          { stateName: { contains: query, mode: 'insensitive' } },
        ];
      }
    }

    if (area_code) where.areaCode = area_code as string;
    if (number_type) where.numberType = number_type as string;
    if (state) where.stateName = { contains: state as string, mode: 'insensitive' };
    if (pattern) where.pattern = pattern as string;

    // Price filter
    if (price_min || price_max) {
      where.basePrice = {};
      if (price_min) where.basePrice.gte = parseFloat(price_min as string);
      if (price_max) where.basePrice.lte = parseFloat(price_max as string);
    }

    // If listing_type filter, join with listings
    if (listing_type) {
      where.listings = {
        some: {
          status: 'active',
          listingType: listing_type === 'both' ? undefined : listing_type as string,
        },
      };
    }

    // Sort
    let orderBy: any = { basePrice: 'asc' };
    switch (sort) {
      case 'price_desc': orderBy = { basePrice: 'desc' }; break;
      case 'price_asc': orderBy = { basePrice: 'asc' }; break;
      case 'newest': orderBy = { createdAt: 'desc' }; break;
      case 'popular': orderBy = { listings: { _count: 'desc' } }; break;
      default: orderBy = { basePrice: 'asc' };
    }

    const [numbers, total] = await Promise.all([
      prisma.phoneNumber.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          listings: {
            where: { status: 'active' },
            select: {
              id: true,
              listingType: true,
              salePrice: true,
              licensePrice: true,
              allowOffers: true,
              sellerId: true,
              isFeatured: true,
            },
          },
        },
      }),
      prisma.phoneNumber.count({ where }),
    ]);

    const pagination = paginationHelper(page, limit, total);
    const response = apiResponse(numbers, `${total} numbers found`, pagination);

    // Cache for 5 minutes
    await CacheService.set(cacheKey, response, 300);

    res.json(response);
  } catch (error) { next(error); }
});

// GET /api/v1/search/suggestions — Autocomplete
router.get('/suggestions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q || (q as string).length < 2) {
      return res.json(apiResponse([]));
    }

    const query = (q as string).trim();
    const suggestions = await prisma.phoneNumber.findMany({
      where: {
        status: 'available',
        OR: [
          { number: { contains: query } },
          { vanityText: { contains: query, mode: 'insensitive' } },
          { areaCode: { startsWith: query } },
        ],
      },
      select: { id: true, number: true, formatted: true, vanityText: true, basePrice: true, numberType: true },
      take: 10,
      orderBy: { basePrice: 'asc' },
    });

    res.json(apiResponse(suggestions));
  } catch (error) { next(error); }
});

export default router;

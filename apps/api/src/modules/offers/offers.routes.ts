import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { apiResponse } from '../../utils/helpers';
import { NotFoundError, ForbiddenError, AppError } from '../../utils/errors';
import { EmailService } from '../../services/email.service';
import { OFFER_EXPIRY_HOURS } from '../../utils/constants';

const router = Router();

// POST /offers — Make an offer (buyer)
router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { listingId, phoneNumberId, offerType, amount, buyerMessage } = req.body;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { phoneNumber: true, seller: { select: { id: true, email: true } } },
    });
    if (!listing) throw new NotFoundError('Listing');
    if (!listing.allowOffers) throw new AppError('This listing does not accept offers', 400);
    if (listing.sellerId === req.user!.id) throw new AppError('Cannot make offer on your own listing', 400);

    if (listing.minimumOffer && amount < Number(listing.minimumOffer)) {
      throw new AppError(`Offer must be at least $${listing.minimumOffer}`, 400);
    }

    const expiresAt = new Date(Date.now() + OFFER_EXPIRY_HOURS * 60 * 60 * 1000);

    const offer = await prisma.offer.create({
      data: {
        listingId, phoneNumberId, buyerId: req.user!.id,
        sellerId: listing.sellerId, offerType: offerType || 'buy',
        amount, buyerMessage, expiresAt,
      },
      include: {
        phoneNumber: { select: { formatted: true } },
        listing: { select: { salePrice: true } },
      },
    });

    await prisma.listing.update({
      where: { id: listingId },
      data: { offersCount: { increment: 1 } },
    });

    await prisma.notification.create({
      data: {
        userId: listing.sellerId, type: 'offer_received',
        title: 'New Offer Received',
        message: `You received a $${amount} offer for ${listing.phoneNumber.formatted}`,
        data: { offerId: offer.id, listingId },
      },
    });

    await EmailService.sendOfferReceived(listing.seller.email, listing.phoneNumber.formatted, amount);

    res.status(201).json(apiResponse(offer, 'Offer submitted'));
  } catch (error) { next(error); }
});

// GET /offers/sent — Buyer's sent offers
router.get('/sent', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const offers = await prisma.offer.findMany({
      where: { buyerId: req.user!.id },
      include: {
        phoneNumber: { select: { formatted: true, numberType: true } },
        listing: { select: { salePrice: true, licensePrice: true } },
        seller: { select: { firstName: true, companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(apiResponse(offers));
  } catch (error) { next(error); }
});

// GET /offers/received — Seller's received offers
router.get('/received', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const offers = await prisma.offer.findMany({
      where: { sellerId: req.user!.id },
      include: {
        phoneNumber: { select: { formatted: true, numberType: true } },
        buyer: { select: { firstName: true, lastName: true, email: true } },
        listing: { select: { salePrice: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(apiResponse(offers));
  } catch (error) { next(error); }
});

// GET /offers/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: req.params.id },
      include: {
        phoneNumber: true,
        buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
        seller: { select: { id: true, firstName: true, companyName: true } },
        listing: true,
        childOffers: true,
      },
    });
    if (!offer) throw new NotFoundError('Offer');
    if (offer.buyerId !== req.user!.id && offer.sellerId !== req.user!.id && !['admin', 'super_admin'].includes(req.user!.role)) {
      throw new ForbiddenError();
    }
    res.json(apiResponse(offer));
  } catch (error) { next(error); }
});

// PUT /offers/:id/accept
router.put('/:id/accept', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: req.params.id },
      include: { phoneNumber: true, buyer: { select: { email: true } } },
    });
    if (!offer) throw new NotFoundError('Offer');
    if (offer.sellerId !== req.user!.id) throw new ForbiddenError();
    if (offer.status !== 'pending') throw new AppError('Offer is no longer pending', 400);

    await prisma.offer.update({
      where: { id: req.params.id },
      data: { status: 'accepted', respondedAt: new Date() },
    });

    await prisma.notification.create({
      data: {
        userId: offer.buyerId, type: 'offer_accepted',
        title: 'Offer Accepted!',
        message: `Your $${offer.amount} offer for ${offer.phoneNumber.formatted} has been accepted`,
        data: { offerId: offer.id },
      },
    });

    await EmailService.sendOfferAccepted(offer.buyer.email, offer.phoneNumber.formatted, Number(offer.amount));

    res.json(apiResponse(null, 'Offer accepted'));
  } catch (error) { next(error); }
});

// PUT /offers/:id/decline
router.put('/:id/decline', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const offer = await prisma.offer.findUnique({
      where: { id: req.params.id },
      include: { phoneNumber: true, buyer: { select: { email: true } } },
    });
    if (!offer) throw new NotFoundError('Offer');
    if (offer.sellerId !== req.user!.id) throw new ForbiddenError();

    await prisma.offer.update({
      where: { id: req.params.id },
      data: { status: 'declined', sellerResponse: req.body.reason, respondedAt: new Date() },
    });

    await EmailService.sendOfferDeclined(offer.buyer.email, offer.phoneNumber.formatted);

    res.json(apiResponse(null, 'Offer declined'));
  } catch (error) { next(error); }
});

// PUT /offers/:id/counter
router.put('/:id/counter', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { counterAmount, sellerResponse } = req.body;
    const offer = await prisma.offer.findUnique({
      where: { id: req.params.id },
      include: { phoneNumber: true, buyer: { select: { email: true } } },
    });
    if (!offer) throw new NotFoundError('Offer');
    if (offer.sellerId !== req.user!.id) throw new ForbiddenError();

    await prisma.offer.update({
      where: { id: req.params.id },
      data: { status: 'countered', counterAmount, sellerResponse, respondedAt: new Date() },
    });

    const counter = await prisma.offer.create({
      data: {
        listingId: offer.listingId, phoneNumberId: offer.phoneNumberId,
        buyerId: offer.buyerId, sellerId: offer.sellerId,
        offerType: offer.offerType, amount: counterAmount,
        status: 'pending', parentOfferId: offer.id,
        expiresAt: new Date(Date.now() + OFFER_EXPIRY_HOURS * 60 * 60 * 1000),
      },
    });

    await EmailService.sendOfferCountered(offer.buyer.email, offer.phoneNumber.formatted, counterAmount);

    res.json(apiResponse(counter, 'Counter-offer sent'));
  } catch (error) { next(error); }
});

// PUT /offers/:id/cancel
router.put('/:id/cancel', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const offer = await prisma.offer.findUnique({ where: { id: req.params.id } });
    if (!offer) throw new NotFoundError('Offer');
    if (offer.buyerId !== req.user!.id) throw new ForbiddenError();

    await prisma.offer.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
    });
    res.json(apiResponse(null, 'Offer cancelled'));
  } catch (error) { next(error); }
});

export default router;

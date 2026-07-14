import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getOffersCollection } from '@/lib/collections';
import { centsToDollars } from '@/lib/utils/pricing';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    const payload = requireAuth(req);
    const { id } = await params;

    const offersColl = await getOffersCollection();
    let offerId: ObjectId;
    try {
      offerId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: 'Invalid offer ID' }, { status: 400 });
    }

    const offer = await offersColl.findOne({ _id: offerId });
    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Only buyer, seller, or admin can view
    const isBuyer = offer.buyerId.toString() === payload.userId;
    const isSeller = offer.sellerId?.toString() === payload.userId;
    if (!isBuyer && !isSeller && payload.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: offer._id!.toString(),
        number: offer.formattedNumber || offer.number,
        listingPrice: centsToDollars(offer.listingPrice),
        offerAmount: centsToDollars(offer.offerAmount),
        counterAmount: offer.counterAmount ? centsToDollars(offer.counterAmount) : null,
        buyerMessage: offer.buyerMessage || '',
        sellerResponse: offer.sellerResponse || '',
        status: offer.status,
        createdAt: offer.createdAt?.toISOString?.() || '',
      },
    });
  });
}

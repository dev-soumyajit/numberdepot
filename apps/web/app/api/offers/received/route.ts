import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getOffersCollection } from '@/lib/collections';
import { getDb } from '@/lib/db';
import { centsToDollars } from '@/lib/utils/pricing';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    const payload = requireAuth(req);

    const params = req.nextUrl.searchParams;
    const status = params.get('status');

    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });

    const offersColl = await getOffersCollection();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    // Admins see all offers; sellers see their own
    if (user?.role === 'admin') {
      // Admin sees all offers
    } else {
      filter.sellerId = new ObjectId(payload.userId);
    }

    if (status) filter.status = status;

    // Expire old offers
    const now = new Date();
    await offersColl.updateMany(
      { status: 'pending', expiresAt: { $lt: now } },
      { $set: { status: 'expired', updatedAt: now } }
    );

    const offers = await offersColl.find(filter).sort({ createdAt: -1 }).limit(50).toArray();

    // Get buyer details
    const buyerIds = [...new Set(offers.map((o) => o.buyerId.toString()))];
    const buyers = buyerIds.length > 0
      ? await db.collection('users').find({ _id: { $in: buyerIds.map((id) => new ObjectId(id)) } }).toArray()
      : [];
    const buyerMap = new Map(buyers.map((b) => [b._id.toString(), b]));

    const data = offers.map((o) => {
      const buyer = buyerMap.get(o.buyerId.toString());
      return {
        id: o._id!.toString(),
        numberId: o.numberId.toString(),
        number: o.formattedNumber || o.number,
        listingPrice: centsToDollars(o.listingPrice),
        amount: centsToDollars(o.offerAmount),
        counterAmount: o.counterAmount ? centsToDollars(o.counterAmount) : null,
        buyerName: buyer ? `${buyer.firstName} ${buyer.lastName}`.trim() : 'Unknown',
        buyerEmail: buyer?.email || '',
        buyerMessage: o.buyerMessage || '',
        sellerResponse: o.sellerResponse || '',
        status: o.status,
        createdAt: o.createdAt?.toISOString?.() || '',
        updatedAt: o.updatedAt?.toISOString?.() || '',
      };
    });

    return NextResponse.json({ success: true, data });
  });
}

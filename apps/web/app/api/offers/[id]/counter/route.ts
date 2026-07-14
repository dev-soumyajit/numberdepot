import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getDb } from '@/lib/db';
import { getOffersCollection } from '@/lib/collections';
import { dollarsToCents } from '@/lib/utils/pricing';
import { createNotification } from '@/lib/utils/notifications';
import { sendOfferNotification } from '@/lib/resend';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    const payload = requireAuth(req);
    const { id } = await params;
    const body = await req.json();

    const { counterAmount, sellerResponse } = body;
    if (!counterAmount) return NextResponse.json({ error: 'Counter amount required' }, { status: 400 });

    const counterCents = dollarsToCents(parseFloat(counterAmount));
    if (counterCents <= 0) return NextResponse.json({ error: 'Counter amount must be positive' }, { status: 400 });

    const offersColl = await getOffersCollection();
    const offer = await offersColl.findOne({ _id: new ObjectId(id) });
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    if (offer.status !== 'pending') return NextResponse.json({ error: 'Only pending offers can be countered' }, { status: 400 });

    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });
    const isAdmin = user?.role === 'admin';
    const isSeller = offer.sellerId?.toString() === payload.userId;
    if (!isAdmin && !isSeller) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const now = new Date();
    await offersColl.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'countered', counterAmount: counterCents, sellerResponse: sellerResponse || '', updatedAt: now } }
    );

    const buyer = await db.collection('users').findOne({ _id: offer.buyerId });
    await createNotification({
      userId: offer.buyerId.toString(),
      title: 'Counter Offer Received',
      message: `A counter offer of $${(counterCents / 100).toFixed(2)} has been made on ${offer.formattedNumber || offer.number}.`,
      type: 'offer',
      actionUrl: '/account/offers',
      entityType: 'offer',
      entityId: id,
    });

    if (buyer?.email) {
      sendOfferNotification(buyer.email, 'counter', {
        number: offer.formattedNumber || offer.number,
        offerAmount: offer.offerAmount,
        counterAmount: counterCents,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: { message: 'Counter offer sent' } });
  });
}

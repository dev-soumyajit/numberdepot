import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getOffersCollection } from '@/lib/collections';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    const payload = requireAuth(req);
    const { id } = await params;

    const offersColl = await getOffersCollection();
    const offer = await offersColl.findOne({ _id: new ObjectId(id) });
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });

    if (offer.buyerId.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Only the buyer can cancel this offer' }, { status: 403 });
    }

    if (offer.status !== 'pending' && offer.status !== 'countered') {
      return NextResponse.json({ error: 'Only pending or countered offers can be cancelled' }, { status: 400 });
    }

    await offersColl.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'cancelled', updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true, data: { message: 'Offer cancelled' } });
  });
}

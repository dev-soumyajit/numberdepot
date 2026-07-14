import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth-middleware';
import { getNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    const auth = requireAuth(req);
    const { numberId } = await req.json();

    if (!numberId || !ObjectId.isValid(numberId)) {
      return NextResponse.json({ error: 'Invalid number ID' }, { status: 400 });
    }

    const col = await getNumbersCollection();
    const now = new Date();

    const result = await col.findOneAndUpdate(
      {
        _id: new ObjectId(numberId),
        reservedBy: new ObjectId(auth.userId),
        status: 'reserved',
      },
      {
        $set: { status: 'available' as const, updatedAt: now },
        $unset: { reservedBy: '', reservedAt: '', reservationExpiresAt: '' },
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Reservation not found or already released' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { message: 'Reservation released' } });
  });
}

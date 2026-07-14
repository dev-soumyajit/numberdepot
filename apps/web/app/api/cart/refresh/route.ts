import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth-middleware';
import { getNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';

const RESERVATION_MINUTES = 15;

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    const auth = requireAuth(req);
    const { numberIds } = await req.json();

    if (!Array.isArray(numberIds) || numberIds.length === 0) {
      return NextResponse.json({ error: 'numberIds required' }, { status: 400 });
    }

    const col = await getNumbersCollection();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RESERVATION_MINUTES * 60 * 1000);
    const userId = new ObjectId(auth.userId);

    const validIds = numberIds
      .filter((id: string) => ObjectId.isValid(id))
      .map((id: string) => new ObjectId(id));

    const result = await col.updateMany(
      {
        _id: { $in: validIds },
        reservedBy: userId,
        status: 'reserved',
      },
      {
        $set: {
          reservationExpiresAt: expiresAt,
          updatedAt: now,
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        refreshed: result.modifiedCount,
        expiresAt: expiresAt.toISOString(),
      },
    });
  });
}

import { NextResponse } from 'next/server';
import { getNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';

export async function GET() {
  return apiHandler(async () => {
    const col = await getNumbersCollection();
    const now = new Date();

    const result = await col.updateMany(
      { status: 'reserved', reservationExpiresAt: { $lt: now } },
      {
        $set: { status: 'available' as const, updatedAt: now },
        $unset: { reservedBy: '', reservedAt: '', reservationExpiresAt: '' },
      }
    );

    return NextResponse.json({
      success: true,
      data: { cleaned: result.modifiedCount },
    });
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getDb } from '@/lib/db';
import { centsToDollars } from '@/lib/utils/pricing';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    const payload = requireAuth(req);

    const db = await getDb();

    const settings = db.collection('settings');
    const rateDoc = await settings.findOne({ key: 'defaultCommissionRate' });
    const commissionRate = (rateDoc?.value ?? 10) / 100;

    const [totalAgg, pendingAgg, paidAgg] = await Promise.all([
      db.collection('orders').aggregate([
        { $match: { userId: payload.userId, status: { $in: ['completed', 'processing'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]).toArray(),
      db.collection('orders').aggregate([
        { $match: { userId: payload.userId, status: 'processing' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]).toArray(),
      db.collection('orders').aggregate([
        { $match: { userId: payload.userId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]).toArray(),
    ]);

    const totalEarned = Math.round((totalAgg[0]?.total || 0) * commissionRate);
    const pending = Math.round((pendingAgg[0]?.total || 0) * commissionRate);
    const paid = Math.round((paidAgg[0]?.total || 0) * commissionRate);

    return NextResponse.json({
      success: true,
      data: {
        totalEarned: centsToDollars(totalEarned),
        pendingCommissions: centsToDollars(pending),
        paidCommissions: centsToDollars(paid),
        commissionRate: commissionRate * 100,
      },
    });
  });
}

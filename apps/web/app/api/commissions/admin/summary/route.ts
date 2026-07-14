import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getDb } from '@/lib/db';
import { centsToDollars } from '@/lib/utils/pricing';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    requireAdmin(req);

    const db = await getDb();
    const orders = db.collection('orders');

    const [revenueAgg, pendingAgg, paidAgg] = await Promise.all([
      orders.aggregate([
        { $match: { status: { $in: ['completed', 'processing'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]).toArray(),
      orders.aggregate([
        { $match: { status: 'processing' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]).toArray(),
      orders.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]).toArray(),
    ]);

    const settings = db.collection('settings');
    const rateDoc = await settings.findOne({ key: 'defaultCommissionRate' });
    const commissionRate = (rateDoc?.value ?? 10) / 100;

    const totalRevenue = revenueAgg[0]?.total || 0;
    const pendingRevenue = pendingAgg[0]?.total || 0;
    const paidRevenue = paidAgg[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: centsToDollars(totalRevenue),
        totalCommissions: centsToDollars(Math.round(totalRevenue * commissionRate)),
        pendingCommissions: centsToDollars(Math.round(pendingRevenue * commissionRate)),
        paidCommissions: centsToDollars(Math.round(paidRevenue * commissionRate)),
      },
    });
  });
}

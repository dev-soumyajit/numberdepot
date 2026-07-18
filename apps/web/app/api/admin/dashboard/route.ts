import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getDb } from '@/lib/db';
import { centsToDollars } from '@/lib/utils/pricing';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    requireAdmin(req);

    const db = await getDb();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalNumbers,
      totalOrders,
      revenueAgg,
      newUsersThisMonth,
      pendingOrders,
      recentOrders,
      recentOffers,
    ] = await Promise.all([
      db.collection('users').countDocuments(),
      db.collection('numbers').countDocuments({ status: 'available' }),
      db.collection('orders').countDocuments(),
      db.collection('orders').aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]).toArray(),
      db.collection('users').countDocuments({ createdAt: { $gte: startOfMonth } }),
      db.collection('orders').countDocuments({ status: 'pending' }),
      db.collection('orders').find().sort({ createdAt: -1 }).limit(5).toArray(),
      db.collection('offers').find().sort({ createdAt: -1 }).limit(5).toArray(),
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;

    const pendingBrokers = await db.collection('users').countDocuments({ role: 'broker', status: 'pending' });

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalNumbers,
        totalOrders,
        totalRevenue: centsToDollars(totalRevenue),
        newUsersThisMonth,
        pendingBrokers,
        recentOrders: recentOrders.map((o) => ({
          id: o._id.toString(),
          orderNumber: o.orderNumber || o._id.toString().substring(0, 8),
          status: o.status,
          totalAmount: centsToDollars(o.totalAmount || 0),
          itemCount: o.items?.length || 0,
          createdAt: o.createdAt?.toISOString?.() || new Date().toISOString(),
        })),
        recentOffers: recentOffers.map((o) => ({
          id: o._id.toString(),
          number: o.formattedNumber || o.number,
          offerAmount: centsToDollars(o.offerAmount || 0),
          listingPrice: centsToDollars(o.listingPrice || 0),
          status: o.status,
          createdAt: o.createdAt?.toISOString?.() || new Date().toISOString(),
        })),
      },
    });
  });
}

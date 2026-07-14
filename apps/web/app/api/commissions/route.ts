import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getDb } from '@/lib/db';
import { centsToDollars } from '@/lib/utils/pricing';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    const payload = requireAuth(req);

    const params = req.nextUrl.searchParams;
    const status = params.get('status');
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '10')));
    const skip = (page - 1) * limit;

    const db = await getDb();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { userId: payload.userId };

    if (status === 'paid') {
      filter.status = 'completed';
    } else if (status === 'pending') {
      filter.status = { $in: ['pending', 'processing'] };
    } else {
      filter.status = { $in: ['pending', 'processing', 'completed'] };
    }

    const settings = db.collection('settings');
    const rateDoc = await settings.findOne({ key: 'defaultCommissionRate' });
    const commissionRate = (rateDoc?.value ?? 10) / 100;

    const [results, total] = await Promise.all([
      db.collection('orders').find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection('orders').countDocuments(filter),
    ]);

    const commissions = results.map((order) => {
      const commissionAmount = Math.round((order.totalAmount || 0) * commissionRate);
      const mapStatus = (s: string) => {
        if (s === 'completed') return 'paid';
        return 'pending';
      };

      return {
        id: order._id.toString(),
        orderId: order.orderNumber || order._id.toString(),
        number: order.items?.[0]?.number || 'N/A',
        buyerName: 'Customer',
        amount: centsToDollars(order.totalAmount || 0),
        commissionRate,
        commissionAmount: centsToDollars(commissionAmount),
        status: mapStatus(order.status),
        createdAt: order.createdAt?.toISOString?.() || order.createdAt || '',
        paidAt: order.completedAt?.toISOString?.() || null,
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      success: true,
      data: commissions,
      pagination: { page, limit, total, totalPages },
    });
  });
}

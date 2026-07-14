import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getOrdersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';
import { centsToDollars } from '@/lib/utils/pricing';
import type { OrderDoc } from '@/lib/types/db';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    requireAdmin(req);

    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '20')));
    const skip = (page - 1) * limit;
    const status = params.get('status');

    const col = await getOrdersCollection();
    const filter: Partial<Pick<OrderDoc, 'status'>> = {};
    if (status) filter.status = status as OrderDoc['status'];

    const [orders, total] = await Promise.all([
      col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);

    const data = orders.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      userId: o.userId.toString(),
      status: o.status,
      totalAmount: centsToDollars(o.totalAmount),
      subtotal: centsToDollars(o.subtotal),
      setupFees: centsToDollars(o.setupFees),
      monthlyTotal: centsToDollars(o.monthlyTotal),
      itemCount: o.items.length,
      createdAt: o.createdAt.toISOString(),
      completedAt: o.completedAt?.toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getOrdersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';
import { centsToDollars } from '@/lib/utils/pricing';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    requireAdmin(req);

    const params = req.nextUrl.searchParams;
    const status = params.get('status');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    const col = await getOrdersCollection();
    const orders = await col.find(filter).sort({ createdAt: -1 }).limit(50000).toArray();

    const header = 'Order Number,User ID,Status,Subtotal,Setup Fees,Monthly Total,Total Amount,Items,Payment Method,Created,Completed';
    const rows = orders.map((o) => [
      o.orderNumber || o._id.toString(),
      o.userId.toString(),
      o.status,
      centsToDollars(o.subtotal).toFixed(2),
      centsToDollars(o.setupFees).toFixed(2),
      centsToDollars(o.monthlyTotal).toFixed(2),
      centsToDollars(o.totalAmount).toFixed(2),
      o.items?.length || 0,
      o.paymentMethod || '',
      o.createdAt?.toISOString?.() || '',
      o.completedAt?.toISOString?.() || '',
    ].join(','));

    const csv = [header, ...rows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  });
}

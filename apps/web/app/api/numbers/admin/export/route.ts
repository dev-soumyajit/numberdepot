import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';
import { centsToDollars } from '@/lib/utils/pricing';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    requireAdmin(req);

    const params = req.nextUrl.searchParams;
    const source = params.get('source');
    const status = params.get('status');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (source) filter.source = source;
    if (status) filter.status = status;

    const col = await getNumbersCollection();
    const numbers = await col.find(filter).sort({ createdAt: -1 }).limit(50000).toArray();

    const header = 'Number,Formatted,Area Code,Type,Source,Status,Price,Monthly,Setup Fee,Vanity Text,Premium,Allow Offers,Min Offer,City,State,Created';
    const rows = numbers.map((n) => [
      n.number,
      `"${n.formattedNumber}"`,
      n.areaCode,
      n.numberType,
      n.source,
      n.status,
      centsToDollars(n.price).toFixed(2),
      centsToDollars(n.monthlyPrice).toFixed(2),
      centsToDollars(n.setupFee).toFixed(2),
      `"${n.vanityText || ''}"`,
      n.isPremium ? 'Yes' : 'No',
      (n.allowOffers ?? true) ? 'Yes' : 'No',
      n.minimumOffer != null ? centsToDollars(n.minimumOffer).toFixed(2) : '',
      `"${n.city || ''}"`,
      `"${n.state || ''}"`,
      n.createdAt?.toISOString?.() || '',
    ].join(','));

    const csv = [header, ...rows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="numbers-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  });
}

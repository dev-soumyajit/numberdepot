import { NextRequest, NextResponse } from 'next/server';
import { getNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';
import { formatNumberDoc } from '@/lib/utils/pricing';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    const params = req.nextUrl.searchParams;
    const limit = Math.min(50, Math.max(1, parseInt(params.get('limit') || '8')));
    const sort = params.get('sort');

    const col = await getNumbersCollection();

    const filter: Record<string, unknown> = { status: 'available' };
    if (sort === 'featured') {
      filter.isPremium = true;
    }

    const results = await col
      .find(filter)
      .sort(sort === 'featured' ? { isPremium: -1, price: 1 } : { createdAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json({ success: true, data: results.map(formatNumberDoc) });
  });
}

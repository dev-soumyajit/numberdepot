import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';
import { formatNumberDoc } from '@/lib/utils/pricing';
import type { NumberDoc } from '@/lib/types/db';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    requireAdmin(req);

    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '20')));
    const skip = (page - 1) * limit;
    const source = params.get('source');
    const status = params.get('status');

    const col = await getNumbersCollection();
    const filter: Partial<Pick<NumberDoc, 'source' | 'status'>> = {};

    if (source) filter.source = source as NumberDoc['source'];
    if (status) filter.status = status as NumberDoc['status'];

    const [results, total] = await Promise.all([
      col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: results.map(formatNumberDoc),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  });
}

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
    const q = params.get('q')?.trim();
    const areaCode = params.get('area_code');
    const numberType = params.get('number_type');
    const sort = params.get('sort') || 'newest';

    const col = await getNumbersCollection();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (source) filter.source = source as NumberDoc['source'];
    if (status) filter.status = status as NumberDoc['status'];
    if (areaCode) filter.areaCode = areaCode;
    if (numberType) filter.numberType = numberType;

    // Text/number search (reuses logic from public /api/search)
    if (q) {
      const digits = q.replace(/\D/g, '');
      const letters = q.replace(/[^a-zA-Z]/g, '');
      const conditions: Record<string, unknown>[] = [];

      if (digits.length >= 2 && digits.length <= 11) {
        if (digits.length === 3 && !letters) {
          // Pure 3-digit query — area code search
          filter.areaCode = digits;
        } else if (digits.length === 10) {
          conditions.push({ number: { $regex: `1?${digits}$` } });
        } else if (digits.length === 11 && digits.startsWith('1')) {
          conditions.push({ number: digits });
        } else {
          conditions.push({ number: { $regex: digits } });
        }
      }

      if (letters.length >= 2) {
        const escaped = letters.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        conditions.push({ vanityText: { $regex: escaped, $options: 'i' } });
      }

      if (q.length >= 2 && /[()-\s]/.test(q)) {
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        conditions.push({ formattedNumber: { $regex: escaped, $options: 'i' } });
      }

      if (conditions.length === 1) {
        Object.assign(filter, conditions[0]);
      } else if (conditions.length > 1) {
        filter.$or = conditions;
      }
    }

    // Sort
    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sort) {
      case 'price_asc': sortObj = { price: 1 }; break;
      case 'price_desc': sortObj = { price: -1 }; break;
      case 'newest': sortObj = { createdAt: -1 }; break;
      case 'area_code': sortObj = { areaCode: 1, number: 1 }; break;
    }

    const [results, total] = await Promise.all([
      col.find(filter).sort(sortObj).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: results.map(formatNumberDoc),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  });
}

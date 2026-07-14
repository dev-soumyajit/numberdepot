import { NextRequest, NextResponse } from 'next/server';
import { getNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';
import { formatNumberDoc, dollarsToCents } from '@/lib/utils/pricing';
import { searchNumbers as nbSearch, toOurFormat } from '@/lib/numberbarn';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    const params = req.nextUrl.searchParams;
    const q = params.get('q')?.trim();
    const areaCode = params.get('area_code');
    const numberType = params.get('number_type');
    const priceMin = params.get('price_min');
    const priceMax = params.get('price_max');
    const sort = params.get('sort') || 'price_asc';
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '20')));
    const skip = (page - 1) * limit;

    const col = await getNumbersCollection();

    // Clean up expired reservations inline (lightweight — uses TTL index)
    const now = new Date();
    await col.updateMany(
      { status: 'reserved', reservationExpiresAt: { $lt: now } },
      { $set: { status: 'available' }, $unset: { reservedBy: '', reservedAt: '', reservationExpiresAt: '' } }
    );

    // Build optimized filter — uses compound indexes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { status: 'available' };

    if (areaCode) filter.areaCode = areaCode;
    if (numberType) filter.numberType = numberType;

    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = dollarsToCents(parseFloat(priceMin));
      if (priceMax) filter.price.$lte = dollarsToCents(parseFloat(priceMax));
    }

    // Text/number search
    if (q) {
      const digits = q.replace(/\D/g, '');

      if (digits.length >= 3 && digits.length <= 11) {
        // Numeric search — area code or partial number
        // Use regex anchored to start for index efficiency
        if (digits.length === 3 && !areaCode) {
          // Likely an area code search — use exact match on indexed field
          filter.areaCode = digits;
        } else {
          // Partial number search — regex on the indexed 'number' field
          filter.number = { $regex: digits };
        }
      } else if (q.length >= 2) {
        // Text search (vanity text, etc.) — use MongoDB text index
        // $text uses the text index for fast full-text search
        filter.$text = { $search: q };
      }
    }

    // Sort — use fields that match compound indexes
    let sortObj: Record<string, 1 | -1> = { price: 1 };
    switch (sort) {
      case 'price_asc': sortObj = { price: 1 }; break;
      case 'price_desc': sortObj = { price: -1 }; break;
      case 'featured': sortObj = { isPremium: -1, price: 1 }; break;
      case 'newest': sortObj = { createdAt: -1 }; break;
    }

    // If text search, add textScore sort
    const hasTextSearch = '$text' in filter;
    const projection = hasTextSearch
      ? { score: { $meta: 'textScore' } as unknown as number }
      : undefined;

    if (hasTextSearch && sort === 'price_asc') {
      // For text search, sort by relevance first
      sortObj = { score: { $meta: 'textScore' } as unknown as -1, price: 1 };
    }

    const [results, total] = await Promise.all([
      projection
        ? col.find(filter).project({ ...projection }).sort(sortObj).skip(skip).limit(limit).toArray()
        : col.find(filter).sort(sortObj).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any[] = results.map((doc) => formatNumberDoc(doc as any));
    let adjustedTotal = total;

    // NumberBarn fallback: only when inventory results < limit AND user searched something
    if (results.length < limit && (areaCode || q)) {
      try {
        const nbResults = await nbSearch({
          npa: areaCode || (q ? q.replace(/\D/g, '').slice(0, 3) : undefined),
          search: q && /[a-zA-Z]/.test(q) ? q : undefined,
          limit: limit - results.length,
          priceMin: priceMin ? dollarsToCents(parseFloat(priceMin)) : undefined,
          priceMax: priceMax ? dollarsToCents(parseFloat(priceMax)) : undefined,
        });

        const nbFormatted = await Promise.all(nbResults.map(toOurFormat));

        // Exclude duplicates with our inventory
        const existingNumbers = new Set(results.map((r) => (r as any).number));
        const unique = nbFormatted.filter((n) => !existingNumbers.has(n.rawNumber));

        data = [...data, ...unique];
        adjustedTotal += unique.length;
      } catch (err) {
        console.error('[Search] NumberBarn fallback failed:', err);
        // Graceful degradation — just show inventory results
      }
    }

    const totalPages = Math.max(1, Math.ceil(adjustedTotal / limit));

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total: adjustedTotal, totalPages },
    });
  });
}

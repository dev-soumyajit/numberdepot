import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/auth-middleware';
import { getNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';
import { dollarsToCents } from '@/lib/utils/pricing';

// PUT — Bulk update selected numbers
export async function PUT(req: NextRequest) {
  return apiHandler(async () => {
    requireAdmin(req);
    const body = await req.json();

    const { ids, updates } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'updates object is required' }, { status: 400 });
    }

    const objectIds = ids
      .filter((id: string) => ObjectId.isValid(id))
      .map((id: string) => new ObjectId(id));

    if (objectIds.length === 0) {
      return NextResponse.json({ error: 'No valid IDs provided' }, { status: 400 });
    }

    const $set: Record<string, unknown> = { updatedAt: new Date() };

    if (updates.basePrice !== undefined && updates.basePrice !== '') {
      $set.price = dollarsToCents(parseFloat(updates.basePrice));
    }
    if (updates.monthlyPrice !== undefined && updates.monthlyPrice !== '') {
      $set.monthlyPrice = dollarsToCents(parseFloat(updates.monthlyPrice));
    }
    if (updates.setupFee !== undefined && updates.setupFee !== '') {
      $set.setupFee = dollarsToCents(parseFloat(updates.setupFee));
    }
    if (updates.status) {
      $set.status = updates.status;
    }
    if (updates.numberType) {
      $set.numberType = updates.numberType;
    }
    if (updates.isPremium !== undefined && updates.isPremium !== '') {
      $set.isPremium = updates.isPremium === true || updates.isPremium === 'true';
    }
    if (updates.allowOffers !== undefined && updates.allowOffers !== '') {
      $set.allowOffers = updates.allowOffers === true || updates.allowOffers === 'true';
    }

    // Only updatedAt means nothing to update
    if (Object.keys($set).length <= 1) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const col = await getNumbersCollection();
    const updateResult = await col.updateMany(
      { _id: { $in: objectIds } },
      { $set }
    );

    return NextResponse.json({
      success: true,
      data: {
        matched: updateResult.matchedCount,
        modified: updateResult.modifiedCount,
      },
    });
  });
}

// POST — Bulk delete selected numbers (POST because DELETE with body is unreliable)
export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    requireAdmin(req);
    const body = await req.json();

    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    const objectIds = ids
      .filter((id: string) => ObjectId.isValid(id))
      .map((id: string) => new ObjectId(id));

    if (objectIds.length === 0) {
      return NextResponse.json({ error: 'No valid IDs provided' }, { status: 400 });
    }

    const col = await getNumbersCollection();

    // Soft delete sold numbers, hard delete others
    const soldResult = await col.updateMany(
      { _id: { $in: objectIds }, status: 'sold' },
      { $set: { status: 'inactive', updatedAt: new Date() } }
    );

    const deleteResult = await col.deleteMany(
      { _id: { $in: objectIds }, status: { $ne: 'sold' } }
    );

    return NextResponse.json({
      success: true,
      data: {
        softDeleted: soldResult.modifiedCount,
        deleted: deleteResult.deletedCount,
      },
    });
  });
}

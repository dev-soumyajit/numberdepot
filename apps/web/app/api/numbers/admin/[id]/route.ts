import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/auth-middleware';
import { getNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';
import { dollarsToCents } from '@/lib/utils/pricing';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    requireAdmin(req);
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const col = await getNumbersCollection();
    const now = new Date();

    const update: Record<string, unknown> = { updatedAt: now };

    if (body.basePrice !== undefined) update.price = dollarsToCents(body.basePrice);
    if (body.monthlyPrice !== undefined) update.monthlyPrice = dollarsToCents(body.monthlyPrice);
    if (body.setupFee !== undefined) update.setupFee = dollarsToCents(body.setupFee);
    if (body.status !== undefined) update.status = body.status;
    if (body.description !== undefined) update.description = body.description;
    if (body.isPremium !== undefined) update.isPremium = body.isPremium;
    if (body.vanityText !== undefined) {
      update.vanityText = body.vanityText || undefined;
      update.isVanity = !!body.vanityText;
    }
    if (body.numberType !== undefined) update.numberType = body.numberType;

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Number not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { message: 'Number updated' } });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    requireAdmin(req);
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const col = await getNumbersCollection();
    const doc = await col.findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return NextResponse.json({ error: 'Number not found' }, { status: 404 });
    }

    if (doc.status === 'sold') {
      // Soft delete — mark as inactive
      await col.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'inactive', updatedAt: new Date() } }
      );
    } else {
      await col.deleteOne({ _id: new ObjectId(id) });
    }

    return NextResponse.json({ success: true, data: { message: 'Number deleted' } });
  });
}

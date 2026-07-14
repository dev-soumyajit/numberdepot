import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getFaqsCollection } from '@/lib/collections';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    requireAdmin(req);
    const { id } = await params;
    const body = await req.json();

    const col = await getFaqsCollection();
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (body.question !== undefined) update.question = body.question;
    if (body.answer !== undefined) update.answer = body.answer;
    if (body.category !== undefined) update.category = body.category;
    if (body.order !== undefined) update.order = body.order;
    if (body.published !== undefined) update.published = body.published;

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!result) return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: { message: 'FAQ updated' } });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    requireAdmin(req);
    const { id } = await params;

    const col = await getFaqsCollection();
    await col.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, data: { message: 'FAQ deleted' } });
  });
}

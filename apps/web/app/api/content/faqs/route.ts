import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getFaqsCollection } from '@/lib/collections';

export async function GET() {
  return apiHandler(async () => {
    const col = await getFaqsCollection();
    const faqs = await col.find({ published: true }).sort({ order: 1 }).toArray();

    const data = faqs.map((f) => ({
      id: f._id!.toString(),
      question: f.question,
      answer: f.answer,
      category: f.category,
      order: f.order,
    }));

    return NextResponse.json({ success: true, data });
  });
}

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    requireAdmin(req);
    const body = await req.json();

    if (!body.question || !body.answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    const col = await getFaqsCollection();
    const maxOrder = await col.find().sort({ order: -1 }).limit(1).toArray();
    const nextOrder = (maxOrder[0]?.order ?? 0) + 1;

    const now = new Date();
    const result = await col.insertOne({
      question: body.question,
      answer: body.answer,
      category: body.category || 'General',
      order: body.order ?? nextOrder,
      published: body.published !== false,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, data: { id: result.insertedId.toString(), message: 'FAQ created' } });
  });
}

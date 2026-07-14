import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getBlogPostsCollection } from '@/lib/collections';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    requireAdmin(req);
    const { id } = await params;
    const body = await req.json();

    const col = await getBlogPostsCollection();
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (body.title !== undefined) update.title = body.title;
    if (body.excerpt !== undefined) update.excerpt = body.excerpt;
    if (body.content !== undefined) update.content = body.content;
    if (body.category !== undefined) update.category = body.category;
    if (body.published !== undefined) {
      update.published = body.published;
      if (body.published) update.publishedAt = new Date();
    }

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!result) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: { message: 'Post updated' } });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    requireAdmin(req);
    const { id } = await params;

    const col = await getBlogPostsCollection();
    await col.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, data: { message: 'Post deleted' } });
  });
}

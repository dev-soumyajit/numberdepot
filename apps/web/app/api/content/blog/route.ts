import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getBlogPostsCollection } from '@/lib/collections';

export async function GET() {
  return apiHandler(async () => {
    const col = await getBlogPostsCollection();
    const posts = await col.find({ published: true }).sort({ publishedAt: -1, createdAt: -1 }).toArray();

    const data = posts.map((p) => ({
      id: p._id!.toString(),
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      category: p.category,
      date: (p.publishedAt || p.createdAt)?.toISOString?.() || '',
    }));

    return NextResponse.json({ success: true, data });
  });
}

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    requireAdmin(req);
    const body = await req.json();

    if (!body.title || !body.content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const col = await getBlogPostsCollection();
    const now = new Date();

    const result = await col.insertOne({
      title: body.title,
      excerpt: body.excerpt || '',
      content: body.content,
      category: body.category || 'General',
      published: body.published !== false,
      publishedAt: body.published !== false ? now : undefined,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, data: { id: result.insertedId.toString(), message: 'Post created' } });
  });
}

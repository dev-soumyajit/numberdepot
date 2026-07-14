import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getContentPagesCollection } from '@/lib/collections';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    const col = await getContentPagesCollection();
    const pages = await col.find().sort({ slug: 1 }).toArray();

    const data = pages.map((p) => ({
      id: p._id!.toString(),
      slug: p.slug,
      title: p.title,
      content: p.content,
      updatedAt: p.updatedAt?.toISOString?.() || '',
    }));

    return NextResponse.json({ success: true, data });
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getContentPagesCollection } from '@/lib/collections';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return apiHandler(async () => {
    const { slug } = await params;
    const col = await getContentPagesCollection();
    const page = await col.findOne({ slug });

    if (!page) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: page._id!.toString(),
        slug: page.slug,
        title: page.title,
        content: page.content,
        updatedAt: page.updatedAt?.toISOString?.() || '',
      },
    });
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return apiHandler(async () => {
    requireAdmin(req);
    const { slug } = await params;
    const body = await req.json();

    if (!body.title || !body.content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const col = await getContentPagesCollection();
    await col.updateOne(
      { slug },
      {
        $set: { title: body.title, content: body.content, updatedAt: new Date() },
        $setOnInsert: { slug },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, data: { message: 'Page updated' } });
  });
}

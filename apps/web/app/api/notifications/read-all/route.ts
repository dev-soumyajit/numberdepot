import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getNotificationsCollection } from '@/lib/collections';

export async function PUT(req: NextRequest) {
  return apiHandler(async () => {
    const payload = requireAuth(req);

    const col = await getNotificationsCollection();
    await col.updateMany(
      { userId: new ObjectId(payload.userId), read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    return NextResponse.json({ success: true, data: { message: 'All notifications marked as read' } });
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getNotificationsCollection } from '@/lib/collections';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    const payload = requireAuth(req);

    const col = await getNotificationsCollection();

    const notifications = await col
      .find({ userId: new ObjectId(payload.userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const data = notifications.map((n) => ({
      id: n._id!.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      actionUrl: n.actionUrl || null,
      createdAt: n.createdAt?.toISOString?.() || '',
    }));

    return NextResponse.json({ success: true, data });
  });
}

export async function PUT(req: NextRequest) {
  return apiHandler(async () => {
    const payload = requireAuth(req);
    const body = await req.json();

    const col = await getNotificationsCollection();

    if (body.action === 'read-all') {
      await col.updateMany(
        { userId: new ObjectId(payload.userId), read: false },
        { $set: { read: true, readAt: new Date() } }
      );
      return NextResponse.json({ success: true, data: { message: 'All notifications marked as read' } });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  });
}

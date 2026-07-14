import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getDb } from '@/lib/db';
import { createNotification } from '@/lib/utils/notifications';

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    const payload = requireAuth(req);
    const body = await req.json();

    const db = await getDb();
    const col = db.collection('broker_applications');

    // Check if already applied
    const existing = await col.findOne({
      userId: new ObjectId(payload.userId),
      status: { $in: ['pending', 'approved'] },
    });

    if (existing) {
      const msg = existing.status === 'approved'
        ? 'You are already an approved broker'
        : 'You already have a pending application';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });

    const now = new Date();
    const doc = {
      userId: new ObjectId(payload.userId),
      userName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
      userEmail: user?.email || payload.email,
      companyName: body.businessName || '',
      businessType: body.businessType || '',
      businessLicense: body.ein || '',
      experience: body.experience || '',
      notes: body.notes || '',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    await col.insertOne(doc);

    // Notify admins
    const admins = await db.collection('users').find({ role: 'admin' }).toArray();
    for (const admin of admins) {
      await createNotification({
        userId: admin._id.toString(),
        title: 'New Broker Application',
        message: `${doc.userName || doc.userEmail} has applied to become a broker.`,
        type: 'system',
        actionUrl: '/admin/brokers',
      });
    }

    return NextResponse.json({ success: true, data: { message: 'Application submitted successfully' } });
  });
}

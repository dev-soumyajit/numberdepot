import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getDb } from '@/lib/db';
import { createNotification } from '@/lib/utils/notifications';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    requireAdmin(req);
    const { id } = await params;
    const body = await req.json();

    const { status, reason } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Valid status required: approved or rejected' }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection('broker_applications');

    let appId: ObjectId;
    try {
      appId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    const application = await col.findOne({ _id: appId });
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'pending') {
      return NextResponse.json({ error: 'Application has already been processed' }, { status: 400 });
    }

    const now = new Date();

    // Update application
    await col.updateOne(
      { _id: appId },
      { $set: { status, reason: reason || '', updatedAt: now } }
    );

    // If approved, update user role to 'broker'
    if (status === 'approved' && application.userId) {
      await db.collection('users').updateOne(
        { _id: application.userId },
        { $set: { role: 'broker', updatedAt: now } }
      );
    }

    // Notify the applicant
    const title = status === 'approved'
      ? 'Broker Application Approved!'
      : 'Broker Application Update';
    const message = status === 'approved'
      ? 'Congratulations! Your broker application has been approved. You can now list numbers for sale.'
      : `Your broker application has been declined.${reason ? ` Reason: ${reason}` : ''}`;

    await createNotification({
      userId: application.userId.toString(),
      title,
      message,
      type: 'system',
      actionUrl: status === 'approved' ? '/seller' : '/seller/apply',
    });

    return NextResponse.json({ success: true, data: { message: `Application ${status}` } });
  });
}

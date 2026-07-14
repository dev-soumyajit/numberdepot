import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    requireAdmin(req);

    const params = req.nextUrl.searchParams;
    const status = params.get('status');

    const db = await getDb();
    const col = db.collection('broker_applications');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    const applications = await col.find(filter).sort({ createdAt: -1 }).limit(100).toArray();

    const data = applications.map((app) => ({
      id: app._id.toString(),
      userId: app.userId?.toString() || '',
      userName: app.userName || '',
      userEmail: app.userEmail || '',
      companyName: app.companyName || '',
      businessLicense: app.businessLicense || '',
      experience: app.experience || '',
      notes: app.notes || '',
      status: app.status,
      reason: app.reason || '',
      createdAt: app.createdAt?.toISOString?.() || app.createdAt || '',
      updatedAt: app.updatedAt?.toISOString?.() || app.updatedAt || '',
    }));

    return NextResponse.json({ success: true, data });
  });
}

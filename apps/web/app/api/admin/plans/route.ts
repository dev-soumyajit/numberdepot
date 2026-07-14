import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getSettingsCollection } from '@/lib/collections';

const DEFAULT_PLANS = [
  { id: 'park', title: 'Park', price: 2.99, description: 'Reserve your number and receive voicemail notifications.' },
  { id: 'forward', title: 'Forward', price: 6.99, description: 'Forward incoming calls to any phone number.' },
  { id: 'unlimited', title: 'Unlimited', price: 19.99, description: 'Full-featured phone service with unlimited calling.' },
  { id: 'business', title: 'Business', price: 9.99, description: 'Professional auto-attendant and call routing.' },
];

export async function GET() {
  return apiHandler(async () => {
    const col = await getSettingsCollection();
    const doc = await col.findOne({ key: 'plans' });
    const plans = (doc?.value as typeof DEFAULT_PLANS) || DEFAULT_PLANS;
    return NextResponse.json({ success: true, data: plans });
  });
}

export async function PUT(req: NextRequest) {
  return apiHandler(async () => {
    requireAdmin(req);
    const body = await req.json();

    if (!Array.isArray(body.plans)) {
      return NextResponse.json({ error: 'Plans array is required' }, { status: 400 });
    }

    const col = await getSettingsCollection();
    await col.updateOne(
      { key: 'plans' },
      { $set: { key: 'plans', value: body.plans, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, data: { message: 'Plans updated' } });
  });
}

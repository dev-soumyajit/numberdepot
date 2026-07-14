import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth-middleware';
import { getUserNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';
import { centsToDollars } from '@/lib/utils/pricing';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    const auth = requireAuth(req);
    const col = await getUserNumbersCollection();

    const docs = await col
      .find({ userId: new ObjectId(auth.userId) })
      .sort({ purchasedAt: -1 })
      .toArray();

    const data = docs.map((d) => ({
      id: d._id.toString(),
      number: d.formattedNumber,
      rawNumber: d.number,
      numberType: d.numberType,
      areaCode: d.areaCode,
      source: d.source,
      plan: d.plan,
      monthlyPrice: centsToDollars(d.monthlyPrice),
      status: d.status,
      forwardingNumber: d.forwardingNumber || null,
      forwardingEnabled: d.forwardingEnabled,
      voicemailEnabled: d.voicemailEnabled,
      portingStatus: d.portingStatus || null,
      portingNotes: d.portingNotes || null,
      purchasedAt: d.purchasedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data });
  });
}

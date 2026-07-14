import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth-middleware';
import { getUserNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';
import { centsToDollars } from '@/lib/utils/pricing';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    const auth = requireAuth(req);
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const col = await getUserNumbersCollection();
    const doc = await col.findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(auth.userId),
    });

    if (!doc) {
      return NextResponse.json({ error: 'Number not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: doc._id.toString(),
        number: doc.formattedNumber,
        rawNumber: doc.number,
        numberType: doc.numberType,
        areaCode: doc.areaCode,
        source: doc.source,
        plan: doc.plan,
        monthlyPrice: centsToDollars(doc.monthlyPrice),
        status: doc.status,
        forwardingNumber: doc.forwardingNumber || null,
        forwardingEnabled: doc.forwardingEnabled,
        voicemailEnabled: doc.voicemailEnabled,
        portingStatus: doc.portingStatus || null,
        portingNotes: doc.portingNotes || null,
        purchasedAt: doc.purchasedAt.toISOString(),
      },
    });
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    const auth = requireAuth(req);
    const { id } = await params;
    const body = await req.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const col = await getUserNumbersCollection();
    const now = new Date();

    const update: Record<string, unknown> = { updatedAt: now };

    if (body.forwardingNumber !== undefined) update.forwardingNumber = body.forwardingNumber;
    if (body.forwardingEnabled !== undefined) update.forwardingEnabled = body.forwardingEnabled;
    if (body.voicemailEnabled !== undefined) update.voicemailEnabled = body.voicemailEnabled;
    if (body.plan !== undefined) update.plan = body.plan;

    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(id), userId: new ObjectId(auth.userId) },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Number not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Number settings updated' },
    });
  });
}

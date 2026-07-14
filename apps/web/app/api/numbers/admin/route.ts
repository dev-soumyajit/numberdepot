import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';
import { dollarsToCents } from '@/lib/utils/pricing';
import { toE164, formatPhone, extractAreaCode, validatePhoneNumber } from '@/lib/utils/phone';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    const auth = requireAdmin(req);
    const body = await req.json();

    const { number, numberType, price, monthlyPrice, setupFee, vanityText, description, isPremium } = body;

    if (!number) {
      return NextResponse.json({ error: 'Number is required' }, { status: 400 });
    }

    const validation = validatePhoneNumber(number);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const e164 = toE164(number);
    const col = await getNumbersCollection();

    // Check for duplicates
    const existing = await col.findOne({ number: e164 });
    if (existing) {
      return NextResponse.json({ error: 'Number already exists' }, { status: 409 });
    }

    const now = new Date();
    const doc = {
      number: e164,
      formattedNumber: formatPhone(e164),
      countryCode: '1',
      areaCode: extractAreaCode(e164),
      numberType: numberType || 'local',
      vanityText: vanityText || undefined,
      price: dollarsToCents(price || 0),
      monthlyPrice: dollarsToCents(monthlyPrice || 0),
      setupFee: dollarsToCents(setupFee ?? 9.99),
      source: 'inventory' as const,
      status: 'available' as const,
      isVanity: !!vanityText,
      isPremium: isPremium ?? false,
      features: ['Call Forwarding', 'Voicemail', 'Caller ID'],
      description: description || '',
      createdBy: new ObjectId(auth.userId),
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);

    return NextResponse.json({
      success: true,
      data: { id: result.insertedId.toString(), ...doc },
    }, { status: 201 });
  });
}

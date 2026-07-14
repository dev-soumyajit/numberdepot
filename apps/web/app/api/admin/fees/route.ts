import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';
import { getSettingsCollection } from '@/lib/collections';

export interface FeeItem {
  id: string;
  label: string;
  amount: number; // dollars
  perItem: boolean; // true = per number, false = per order
}

const DEFAULT_FEES: FeeItem[] = [];

export async function GET() {
  return apiHandler(async () => {
    const col = await getSettingsCollection();
    const doc = await col.findOne({ key: 'fees' });

    // Migration: if old format (object), convert to new array format
    let fees: FeeItem[] = DEFAULT_FEES;
    if (doc?.value) {
      if (Array.isArray(doc.value)) {
        fees = doc.value as FeeItem[];
      } else if (typeof doc.value === 'object') {
        // Old object format migration
        const old = doc.value as Record<string, number>;
        fees = [
          { id: 'setup_fee', label: 'Setup Fee', amount: old.setupFee ?? 0, perItem: true },
          { id: 'first_month', label: 'First Month Service', amount: old.monthlyPrice ?? 0, perItem: true },
        ];
      }
    }

    return NextResponse.json({ success: true, data: fees });
  });
}

export async function PUT(req: NextRequest) {
  return apiHandler(async () => {
    requireAdmin(req);
    const body = await req.json();

    if (!Array.isArray(body.fees)) {
      return NextResponse.json({ error: 'fees array is required' }, { status: 400 });
    }

    // Validate each fee
    const fees: FeeItem[] = body.fees.map((f: FeeItem) => ({
      id: String(f.id || '').trim().toLowerCase().replace(/\s+/g, '_'),
      label: String(f.label || '').trim(),
      amount: Number(f.amount) || 0,
      perItem: !!f.perItem,
    }));

    const col = await getSettingsCollection();
    await col.updateOne(
      { key: 'fees' },
      { $set: { key: 'fees', value: fees, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, data: fees });
  });
}

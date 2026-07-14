import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';
import { formatNumberDoc } from '@/lib/utils/pricing';
import { getNumberInfo, toOurFormat } from '@/lib/numberbarn';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    const { id } = await params;

    // NumberBarn numbers
    if (id.startsWith('nb_')) {
      const tn = id.slice(3);
      const nbNum = await getNumberInfo(tn);
      if (!nbNum) {
        return NextResponse.json({ error: 'Number not found on NumberBarn' }, { status: 404 });
      }
      const formatted = await toOurFormat(nbNum);
      return NextResponse.json({ success: true, data: formatted });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid number ID' }, { status: 400 });
    }

    const col = await getNumbersCollection();
    const doc = await col.findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return NextResponse.json({ error: 'Number not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: formatNumberDoc(doc) });
  });
}

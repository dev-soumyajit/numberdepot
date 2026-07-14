import { NextResponse } from 'next/server';
import { getNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';

// Static lookup for area code metadata
const AREA_CODE_META: Record<string, { city: string; state: string }> = {
  '212': { city: 'New York', state: 'NY' },
  '213': { city: 'Los Angeles', state: 'CA' },
  '310': { city: 'Los Angeles', state: 'CA' },
  '312': { city: 'Chicago', state: 'IL' },
  '305': { city: 'Miami', state: 'FL' },
  '404': { city: 'Atlanta', state: 'GA' },
  '415': { city: 'San Francisco', state: 'CA' },
  '469': { city: 'Dallas', state: 'TX' },
  '512': { city: 'Austin', state: 'TX' },
  '617': { city: 'Boston', state: 'MA' },
  '702': { city: 'Las Vegas', state: 'NV' },
  '713': { city: 'Houston', state: 'TX' },
  '718': { city: 'Brooklyn', state: 'NY' },
  '720': { city: 'Denver', state: 'CO' },
  '786': { city: 'Miami', state: 'FL' },
  '800': { city: 'Toll-Free', state: '' },
  '888': { city: 'Toll-Free', state: '' },
  '877': { city: 'Toll-Free', state: '' },
  '866': { city: 'Toll-Free', state: '' },
  '855': { city: 'Toll-Free', state: '' },
  '844': { city: 'Toll-Free', state: '' },
  '833': { city: 'Toll-Free', state: '' },
  '917': { city: 'New York', state: 'NY' },
  '929': { city: 'New York', state: 'NY' },
  '949': { city: 'Irvine', state: 'CA' },
  '954': { city: 'Fort Lauderdale', state: 'FL' },
  '206': { city: 'Seattle', state: 'WA' },
  '301': { city: 'Maryland', state: 'MD' },
  '303': { city: 'Denver', state: 'CO' },
  '347': { city: 'New York', state: 'NY' },
  '602': { city: 'Phoenix', state: 'AZ' },
  '619': { city: 'San Diego', state: 'CA' },
  '646': { city: 'New York', state: 'NY' },
  '650': { city: 'Palo Alto', state: 'CA' },
  '678': { city: 'Atlanta', state: 'GA' },
  '725': { city: 'Las Vegas', state: 'NV' },
  '732': { city: 'New Jersey', state: 'NJ' },
  '818': { city: 'Burbank', state: 'CA' },
  '832': { city: 'Houston', state: 'TX' },
  '847': { city: 'Chicago Suburbs', state: 'IL' },
  '972': { city: 'Dallas', state: 'TX' },
};

export async function GET() {
  return apiHandler(async () => {
    const col = await getNumbersCollection();

    const pipeline = [
      { $match: { status: 'available' } },
      { $group: { _id: '$areaCode', count: { $sum: 1 } } },
      { $sort: { _id: 1 as const } },
    ];

    const results = await col.aggregate(pipeline).toArray();

    const areaCodes = results.map((r) => {
      const code = r._id as string;
      const meta = AREA_CODE_META[code] || { city: 'Unknown', state: '' };
      return {
        code,
        city: meta.city,
        state: meta.state,
        availableNumbers: r.count,
      };
    });

    return NextResponse.json({ success: true, data: areaCodes });
  });
}

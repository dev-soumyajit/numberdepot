import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/auth-middleware';
import { getNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';
import { dollarsToCents } from '@/lib/utils/pricing';
import { toE164, formatPhone, extractAreaCode, validatePhoneNumber } from '@/lib/utils/phone';

const BATCH_SIZE = 1000;
const TOLL_FREE_NPAS = new Set(['800', '888', '877', '866', '855', '844', '833']);

// Detect vanity text from a nickname like "202-266-SEXY" or "(201) 282-NYNY"
function extractVanityText(nickname: string | undefined): string | undefined {
  if (!nickname) return undefined;
  // If nickname contains uppercase letters (not in parentheses formatting), it's vanity
  const cleaned = nickname.replace(/[()-\s]/g, '');
  if (/[A-Z]/.test(cleaned) && /[A-Z]{2,}/.test(cleaned)) {
    return nickname;
  }
  return undefined;
}

// Determine number type from area code and vanity presence
function detectNumberType(areaCode: string, hasVanity: boolean): 'local' | 'toll_free' | 'vanity' {
  if (TOLL_FREE_NPAS.has(areaCode)) return 'toll_free';
  if (hasVanity) return 'vanity';
  return 'local';
}

// Default pricing by number type (in cents)
function getDefaultPricing(numberType: string, isPremium: boolean) {
  switch (numberType) {
    case 'toll_free':
      return { price: isPremium ? 49900 : 19900, monthlyPrice: 1499, setupFee: 999 };
    case 'vanity':
      return { price: isPremium ? 99900 : 29900, monthlyPrice: 999, setupFee: 999 };
    default: // local
      return { price: isPremium ? 29900 : 9900, monthlyPrice: 999, setupFee: 999 };
  }
}

// Detect "premium" patterns in a phone number (repeating digits, sequential, etc.)
function detectPremium(digits: string): boolean {
  const last7 = digits.slice(-7);
  // Repeating patterns: XXXX, XXYY, XYXY
  if (/(\d)\1{3,}/.test(last7)) return true;           // 4+ same digits
  if (/(\d)\1(\d)\2/.test(last7)) return true;          // XXYY
  if (/(\d)(\d)\1\2/.test(last7)) return true;          // XYXY
  // Sequential: 1234, 4321
  for (let i = 0; i <= last7.length - 4; i++) {
    const seq = last7.slice(i, i + 4).split('').map(Number);
    const asc = seq.every((v, j) => j === 0 || v === seq[j - 1] + 1);
    const desc = seq.every((v, j) => j === 0 || v === seq[j - 1] - 1);
    if (asc || desc) return true;
  }
  // Ends in 0000, 1111, etc.
  if (/(\d)\1{2,}$/.test(last7)) return true;
  return false;
}

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    const auth = await requireAdmin(req);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'CSV file required' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have a header and at least one data row' }, { status: 400 });
    }

    // Parse header — support both our format and client's format
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());

    // Find the number column: "tn", "number", "phone", "phonenumber"
    const findCol = (...names: string[]) => {
      for (const n of names) {
        const idx = header.indexOf(n);
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const numberIdx = findCol('tn', 'number', 'phone', 'phonenumber', 'phone_number');
    if (numberIdx === -1) {
      return NextResponse.json(
        { error: 'CSV must have a "TN" or "number" column' },
        { status: 400 }
      );
    }

    // Map all possible columns
    const nicknameIdx = findCol('nickname', 'vanitytext', 'vanity_text', 'vanity');
    const areaCodeIdx = findCol('areacode', 'area_code', 'npa');
    const cityIdx = findCol('city');
    const stateIdx = findCol('state');
    const typeIdx = findCol('numbertype', 'number_type', 'type');
    const priceIdx = findCol('price');
    const monthlyIdx = findCol('monthlyprice', 'monthly_price', 'monthly');
    const setupIdx = findCol('setupfee', 'setup_fee', 'setup');
    const descIdx = findCol('description', 'desc');
    const premiumIdx = findCol('ispremium', 'is_premium', 'premium');
    const accountIdx = findCol('account number', 'account_number', 'accountnumber');
    const pinIdx = findCol('pin');

    const col = await getNumbersCollection();
    const now = new Date();
    const adminId = new ObjectId(auth.userId);

    let inserted = 0;
    let duplicates = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    // Process in batches
    const dataLines = lines.slice(1);
    for (let i = 0; i < dataLines.length; i += BATCH_SIZE) {
      const batch = dataLines.slice(i, i + BATCH_SIZE);
      const docs = [];

      for (let j = 0; j < batch.length; j++) {
        const lineNum = i + j + 2;
        const cols = batch[j].split(',').map((c) => c.trim());

        const rawNumber = cols[numberIdx];
        if (!rawNumber) {
          errors++;
          if (errorDetails.length < 50) errorDetails.push(`Line ${lineNum}: empty number`);
          continue;
        }

        const validation = validatePhoneNumber(rawNumber);
        if (!validation.valid) {
          errors++;
          if (errorDetails.length < 50) errorDetails.push(`Line ${lineNum}: ${validation.error} (${rawNumber})`);
          continue;
        }

        const e164 = toE164(rawNumber);
        const areaCode = areaCodeIdx !== -1 && cols[areaCodeIdx]
          ? cols[areaCodeIdx]
          : extractAreaCode(e164);

        // Extract vanity text from nickname
        const nickname = nicknameIdx !== -1 ? cols[nicknameIdx] : undefined;
        const vanityText = extractVanityText(nickname);

        // Auto-detect number type
        let numberType: 'local' | 'toll_free' | 'vanity';
        if (typeIdx !== -1 && cols[typeIdx]) {
          const t = cols[typeIdx].toLowerCase().replace(/[-\s]/g, '_');
          numberType = t === 'toll_free' || t === 'tollfree' ? 'toll_free'
            : t === 'vanity' ? 'vanity'
            : 'local';
        } else {
          numberType = detectNumberType(areaCode, !!vanityText);
        }

        // Detect premium from number patterns
        const isPremiumExplicit = premiumIdx !== -1 && ['true', '1', 'yes'].includes(cols[premiumIdx]?.toLowerCase());
        const isPremium = isPremiumExplicit || detectPremium(e164);

        // Pricing: use CSV values if provided, otherwise defaults
        const defaults = getDefaultPricing(numberType, isPremium);
        const price = priceIdx !== -1 && cols[priceIdx] ? dollarsToCents(parseFloat(cols[priceIdx])) : defaults.price;
        const monthlyPrice = monthlyIdx !== -1 && cols[monthlyIdx] ? dollarsToCents(parseFloat(cols[monthlyIdx])) : defaults.monthlyPrice;
        const setupFee = setupIdx !== -1 && cols[setupIdx] ? dollarsToCents(parseFloat(cols[setupIdx])) : defaults.setupFee;

        // City and state from CSV
        const city = cityIdx !== -1 ? cols[cityIdx] || '' : '';
        const state = stateIdx !== -1 ? cols[stateIdx] || '' : '';

        // Account and PIN for transfer (stored securely for porting)
        const accountNumber = accountIdx !== -1 ? cols[accountIdx] || undefined : undefined;
        const pin = pinIdx !== -1 ? cols[pinIdx] || undefined : undefined;

        docs.push({
          number: e164,
          formattedNumber: formatPhone(e164),
          countryCode: '1',
          areaCode,
          numberType,
          vanityText,
          price,
          monthlyPrice,
          setupFee,
          source: 'inventory' as const,
          status: 'available' as const,
          isVanity: !!vanityText,
          isPremium,
          features: ['Call Forwarding', 'Voicemail', 'Caller ID'],
          description: city && state ? `${city}, ${state}` : '',
          city: city || undefined,
          state: state || undefined,
          // Transfer credentials (for porting)
          transferInfo: accountNumber || pin ? { accountNumber, pin } : undefined,
          createdBy: adminId,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (docs.length > 0) {
        try {
          const result = await col.insertMany(docs, { ordered: false });
          inserted += result.insertedCount;
        } catch (err: unknown) {
          // Handle duplicate key errors from ordered:false
          const bulkError = err as {
            code?: number;
            insertedCount?: number;
            result?: { insertedCount?: number };
            writeErrors?: { code: number; index: number }[];
          };
          if (bulkError.code === 11000 || (bulkError.writeErrors && bulkError.writeErrors.length > 0)) {
            const dupeCount = bulkError.writeErrors?.filter((e) => e.code === 11000).length || 0;
            const otherErrors = bulkError.writeErrors?.filter((e) => e.code !== 11000).length || 0;
            duplicates += dupeCount;
            errors += otherErrors;
            // insertedCount comes from the result object in newer drivers
            const batchInserted = bulkError.result?.insertedCount ?? bulkError.insertedCount ?? (docs.length - dupeCount - otherErrors);
            inserted += batchInserted;
          } else {
            throw err;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        inserted,
        duplicates,
        errors,
        total: dataLines.length,
        errorDetails: errorDetails.slice(0, 50),
      },
    });
  });
}

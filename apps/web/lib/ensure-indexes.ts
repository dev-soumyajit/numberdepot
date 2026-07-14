import { getDb } from './db';

let indexesCreated = false;

export async function ensureIndexes(): Promise<void> {
  if (indexesCreated) return;

  const db = await getDb();

  // Use createIndex with background:true — idempotent, silently skips if exists
  const numbersColl = db.collection('numbers');
  const ordersColl = db.collection('orders');
  const userNumbersColl = db.collection('user_numbers');
  const settingsColl = db.collection('settings');
  const offersColl = db.collection('offers');
  const notificationsColl = db.collection('notifications');

  await Promise.allSettled([
    // ── numbers collection ──
    // Unique number
    numbersColl.createIndex({ number: 1 }, { unique: true }),

    // Primary search: status + areaCode (most common filter combo)
    numbersColl.createIndex({ status: 1, areaCode: 1, price: 1 }),

    // Search by type + status + price
    numbersColl.createIndex({ status: 1, numberType: 1, price: 1 }),

    // Featured/premium numbers
    numbersColl.createIndex({ status: 1, isPremium: -1, price: 1 }),

    // Source filter (admin panel)
    numbersColl.createIndex({ source: 1, status: 1 }),

    // Newest sort
    numbersColl.createIndex({ status: 1, createdAt: -1 }),

    // Text search on number, vanityText, formattedNumber
    numbersColl.createIndex(
      { number: 'text', formattedNumber: 'text', vanityText: 'text' },
      { name: 'numbers_text_search' }
    ),

    // Reservation TTL — auto-deletes expired reservations
    numbersColl.createIndex(
      { reservationExpiresAt: 1 },
      { expireAfterSeconds: 0, partialFilterExpression: { status: 'reserved' } }
    ),

    // ── orders collection ──
    ordersColl.createIndex({ orderNumber: 1 }, { unique: true }),
    ordersColl.createIndex({ userId: 1, createdAt: -1 }),
    ordersColl.createIndex({ status: 1 }),

    // ── user_numbers collection ──
    userNumbersColl.createIndex({ userId: 1 }),
    userNumbersColl.createIndex({ number: 1 }),

    // ── settings collection ──
    settingsColl.createIndex({ key: 1 }, { unique: true }),

    // ── offers collection ──
    offersColl.createIndex({ buyerId: 1, createdAt: -1 }),
    offersColl.createIndex({ sellerId: 1, status: 1, createdAt: -1 }),
    offersColl.createIndex({ numberId: 1, status: 1 }),
    offersColl.createIndex({ status: 1, expiresAt: 1 }),

    // ── notifications collection ──
    notificationsColl.createIndex({ userId: 1, createdAt: -1 }),
    notificationsColl.createIndex({ userId: 1, read: 1 }),
  ]);

  indexesCreated = true;
}

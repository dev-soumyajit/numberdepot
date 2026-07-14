import type { WithId } from 'mongodb';
import type { NumberDoc } from '../types/db';

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function formatNumberDoc(doc: WithId<NumberDoc>) {
  return {
    id: doc._id.toString(),
    number: doc.formattedNumber,
    rawNumber: doc.number,
    countryCode: doc.countryCode,
    areaCode: doc.areaCode,
    numberType: doc.numberType,
    vanityText: doc.vanityText || null,
    salePrice: centsToDollars(doc.price),
    basePrice: centsToDollars(doc.price),
    licensePrice: doc.licensePrice ? centsToDollars(doc.licensePrice) : centsToDollars(doc.price),
    monthlyPrice: centsToDollars(doc.monthlyPrice),
    setupFee: centsToDollars(doc.setupFee),
    source: doc.source,
    status: doc.status,
    isVanity: doc.isVanity,
    isPremium: doc.isPremium,
    isPortable: true,
    features: doc.features,
    description: doc.description || '',
    city: doc.city || '',
    state: doc.state || '',
    listingId: `lst_${doc._id.toString()}`,
    listingType: doc.price > 0 ? 'sale' : 'license',
    allowOffers: true,
    minimumOffer: centsToDollars(Math.round(doc.price * 0.7)),
    sellerId: null,
    createdAt: doc.createdAt.toISOString(),
    reservedUntil: doc.reservationExpiresAt?.toISOString() || null,
  };
}

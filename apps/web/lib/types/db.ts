import { ObjectId } from 'mongodb';

export interface NumberDoc {
  _id?: ObjectId;
  number: string; // E.164 format e.g. "12125551234"
  formattedNumber: string; // "(212) 555-1234"
  countryCode: string;
  areaCode: string;
  numberType: 'local' | 'toll_free' | 'vanity';
  vanityText?: string;
  price: number; // cents
  monthlyPrice: number; // cents
  setupFee: number; // cents
  licensePrice?: number; // cents
  source: 'inventory' | 'numberbarn';
  status: 'available' | 'reserved' | 'sold' | 'inactive';
  isVanity: boolean;
  isPremium: boolean;
  allowOffers?: boolean;
  minimumOffer?: number; // cents
  features: string[];
  description?: string;
  city?: string;
  state?: string;
  transferInfo?: {
    accountNumber?: string;
    pin?: string;
  };
  ownerId?: ObjectId;
  orderId?: ObjectId;
  soldAt?: Date;
  reservedBy?: ObjectId;
  reservedAt?: Date;
  reservationExpiresAt?: Date;
  createdBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  numberId?: ObjectId;
  number: string;
  numberType: string;
  source: 'inventory' | 'numberbarn';
  price: number; // cents
  setupFee: number; // cents
  monthlyPrice: number; // cents
  planType: string;
  numberbarnTn?: string;
}

export interface OrderDoc {
  _id?: ObjectId;
  orderNumber: string; // "ND-YYYYMMDD-NNN"
  userId: ObjectId;
  items: OrderItem[];
  subtotal: number; // cents
  setupFees: number; // cents
  monthlyTotal: number; // cents
  totalAmount: number; // cents
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethod?: string;
  paymentId?: string;
  numberbarnOrderIds?: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface UserNumberDoc {
  _id?: ObjectId;
  userId: ObjectId;
  numberId?: ObjectId;
  number: string;
  formattedNumber: string;
  numberType: string;
  areaCode: string;
  source: 'inventory' | 'numberbarn';
  plan: 'park' | 'forward' | 'unlimited' | 'business';
  monthlyPrice: number; // cents
  status: 'active' | 'cancelled' | 'suspended' | 'porting';
  forwardingNumber?: string;
  forwardingEnabled: boolean;
  voicemailEnabled: boolean;
  portingStatus?: 'not_started' | 'pending' | 'in_progress' | 'completed';
  portingNotes?: string;
  orderId: ObjectId;
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferDoc {
  _id?: ObjectId;
  buyerId: ObjectId;
  sellerId?: ObjectId | null; // null for admin-owned inventory numbers
  numberId: ObjectId;
  number: string;
  formattedNumber: string;
  listingPrice: number; // cents — the number's listed price
  offerAmount: number; // cents — buyer's offer
  counterAmount?: number; // cents — seller/admin counter
  buyerMessage?: string;
  sellerResponse?: string;
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'cancelled' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
}

export interface NotificationDoc {
  _id?: ObjectId;
  userId: ObjectId;
  title: string;
  message: string;
  type: 'order' | 'offer' | 'system' | 'billing';
  read: boolean;
  readAt?: Date;
  actionUrl?: string;
  entityType?: string; // 'offer', 'order', 'number'
  entityId?: string;
  createdAt: Date;
}

export interface FaqDoc {
  _id?: ObjectId;
  question: string;
  answer: string;
  category: string;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentPageDoc {
  _id?: ObjectId;
  slug: string; // 'about', 'terms', 'privacy'
  title: string;
  content: string; // HTML or markdown
  updatedAt: Date;
}

export interface BlogPostDoc {
  _id?: ObjectId;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingsDoc {
  _id?: ObjectId;
  key: string;
  value: unknown;
  updatedAt: Date;
}

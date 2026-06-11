export const ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
  PENDING: 'pending',
} as const;

export const NUMBER_TYPE = {
  LOCAL: 'local',
  TOLL_FREE: 'toll_free',
  VANITY: 'vanity',
  CANADIAN: 'canadian',
  UK: 'uk',
} as const;

export const NUMBER_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  SOLD: 'sold',
  PARKED: 'parked',
  FORWARDING: 'forwarding',
  PORTED_OUT: 'ported_out',
  DELISTED: 'delisted',
} as const;

export const LISTING_TYPE = {
  SALE: 'sale',
  LICENSE: 'license',
  BOTH: 'both',
} as const;

export const LISTING_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SOLD: 'sold',
  LICENSED: 'licensed',
  EXPIRED: 'expired',
  DELISTED: 'delisted',
} as const;

export const OFFER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  COUNTERED: 'countered',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
} as const;

export const PLAN_TYPE = {
  PARK: 'park',
  FORWARD: 'forward',
  UNLIMITED: 'unlimited',
  BUSINESS: 'business',
  PORT_AWAY: 'port_away',
} as const;

export const PLAN_PRICES = {
  park: 2.99,
  forward: 6.99,
  unlimited: 19.99,
  business: 9.99,
  port_away: 0,
} as const;

export const BROKER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SUSPENDED: 'suspended',
  REJECTED: 'rejected',
} as const;

export const COMMISSION_STATUS = {
  PENDING: 'pending',
  HELD: 'held',
  AVAILABLE: 'available',
  PAID_OUT: 'paid_out',
} as const;

export const PORT_TYPE = {
  PORT_IN: 'port_in',
  PORT_OUT: 'port_out',
} as const;

export const PORT_STATUS = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const OFFER_EXPIRY_HOURS = 24;
export const FIRST_SALE_HOLD_DAYS = 30;
export const REGULAR_HOLD_DAYS = 10;
export const SETUP_FEE = 5.00;
export const PLATFORM_COMMISSION_RATE = 10; // 10% platform fee on seller numbers

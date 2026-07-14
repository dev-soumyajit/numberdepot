# NumberDepot — Production Backend Plan

## What Client Wants (Summary)
1. Client has **37K numbers** already purchased — upload via admin panel
2. **NumberBarn API = fallback** — only called when number not found in own DB
3. **Dual checkout**: own numbers → Stripe (money to client), NumberBarn numbers → redirect to NumberBarn
4. **Remove Express server** — everything in Next.js API routes
5. MongoDB for everything (auth already there)

---

## Phase 1: Foundation

### 1A. MongoDB Collections

**phone_numbers** (main collection)
```
number, formatted, areaCode, numberType (local/toll_free/vanity),
vanityText, source (platform/broker/numberbarn), status (available/reserved/sold/delisted),
basePrice, salePrice, monthlyPrice, licensePrice,
allowOffers, minimumOffer, isPremium, isVanity,
stateName, cityName, pattern, features,
sellerId, ownerId, numberbarnData (raw NB response if from NB),
viewsCount, createdAt, updatedAt
```

**orders**
```
orderNumber (ND-20260709-001), buyerId, items[],
subtotal, taxAmount, fusfFee (1.50), totalAmount,
status (pending/processing/completed/failed/refunded),
paymentInfo { stripePaymentIntentId, method, paidAt },
numberbarnItems [{ tn, redirectUrl, status }],
completedAt, createdAt
```

**carts** (TTL 7 days)
```
userId, items[], updatedAt, expiresAt
```

**offers**
```
phoneNumberId, buyerId, sellerId, offerType, amount,
counterAmount, status, expiresAt, createdAt
```

**broker_profiles**
```
userId, businessName, commissionRate (default 10%),
totalSales, totalRevenue, pendingBalance, availableBalance,
status (pending/approved/rejected), createdAt
```

**commissions**
```
orderId, brokerId, saleAmount, commissionRate,
platformFee, sellerEarnings, status (held/available/paid_out),
holdUntil (10 days), createdAt
```

**notifications**
```
userId, type, title, message, data, isRead, createdAt
```

### 1B. Auth Middleware (reusable)
- Extract JWT verification from `/api/users/me` into `lib/auth-middleware.ts`
- `requireAuth()`, `requireAdmin()`, `requireSeller()` helpers

### 1C. API Client Refactor
- Change `lib/api.ts` to send ALL requests to `/api/*` first
- Fall back to mock only on 404 (route not built yet)
- This way frontend never changes — each new API route auto-replaces mock

---

## Phase 2: Numbers + Search + Bulk Upload

### 2A. Numbers API Routes
```
GET  /api/numbers              → list available (public, paginated)
GET  /api/numbers/area-codes   → area codes with counts
GET  /api/numbers/my           → user's owned numbers
GET  /api/numbers/[id]         → single number detail
POST /api/numbers/admin        → admin add number
GET  /api/numbers/admin/all    → admin list all
PUT  /api/numbers/admin/[id]   → admin edit
DEL  /api/numbers/admin/[id]   → admin delete
POST /api/numbers/admin/bulk   → CSV upload (37K numbers)
POST /api/numbers/seller       → seller add number
PUT  /api/numbers/seller/[id]  → seller edit
DEL  /api/numbers/seller/[id]  → seller delist
```

### 2B. Bulk CSV Upload (for 37K numbers)
- Admin uploads CSV with columns: number, areaCode, numberType, salePrice, vanityText, etc.
- Parse with `csv-parse` library
- Insert in batches of 1,000 using `bulkWrite` with `ordered: false`
- Return progress updates
- ~10-30 seconds for 37K numbers

### 2C. Search with NumberBarn Fallback
```
GET /api/search?q=PIZZA&area_code=212&type=vanity&price_min=10&price_max=500&page=1&limit=20
```
Flow:
1. Search own MongoDB first (text index + filters)
2. If results < limit AND page 1 → call NumberBarn API to fill gaps
3. NumberBarn results marked with `source: "numberbarn"`
4. Merge, deduplicate, return unified list
5. Cache NB responses for 10 min to avoid excess API calls

### 2D. NumberBarn Client (`lib/numberbarn.ts`)
```
searchNumberBarn({ npa, search, state, priceMin, priceMax, limit })
mapNumberBarnToLocal(nbResult) → converts to our format
```
Token stored in env: `NUMBERBARN_API_TOKEN`

---

## Phase 3: Cart + Checkout + Payments

### 3A. Cart API
```
GET    /api/orders/cart          → get cart
POST   /api/orders/cart/items    → add item
DELETE /api/orders/cart/items/[id] → remove item
DELETE /api/orders/cart          → clear cart
```
MongoDB-backed (no Redis needed).

### 3B. Dual Checkout Flow
```
POST /api/orders          → create order from cart
POST /api/orders/[id]/pay → process payment
GET  /api/orders          → user's orders
GET  /api/orders/[id]     → order detail
```

**Own numbers (platform/broker):**
- Stripe PaymentIntent → client confirms → webhook updates order
- Number status → "sold", ownerId → buyer
- Subscription created for chosen plan

**NumberBarn numbers:**
- Redirect user to `https://www.numberbarn.com/number/{tn}`
- Order item marked `pending_external_purchase`
- When NB order API becomes available → auto-purchase server-side

### 3C. Payment Split
- Platform numbers: 100% to client
- Seller numbers: 90% to seller, 10% platform commission
- Setup fee ($5): always to platform
- FUSF fee ($1.50/order): always to platform
- Seller payout held 10 days, then available for withdrawal

---

## Phase 4: Offers + Seller Dashboard

### 4A. Offers API
```
POST /api/offers                → make offer
GET  /api/offers/sent           → buyer's offers
GET  /api/offers/received       → seller's offers
PUT  /api/offers/[id]/accept    → accept
PUT  /api/offers/[id]/decline   → decline
PUT  /api/offers/[id]/counter   → counter-offer
PUT  /api/offers/[id]/cancel    → cancel
```

### 4B. Broker/Seller API
```
POST /api/broker/apply          → apply as seller
GET  /api/broker/dashboard      → stats
GET  /api/broker/profile        → profile
PUT  /api/broker/profile        → update
GET  /api/broker/sales          → sales history
POST /api/broker/payouts        → request payout
GET  /api/broker/payouts        → payout history
```

---

## Phase 5: Admin Dashboard + Users

### 5A. Admin API
```
GET  /api/admin/dashboard                    → real stats (aggregation)
GET  /api/admin/settings                     → platform settings
PUT  /api/admin/settings                     → update settings
GET  /api/admin/broker-applications          → pending applications
PUT  /api/admin/broker-applications/[id]     → approve/reject
GET  /api/orders/admin/all                   → all orders
```

### 5B. Users API
```
GET  /api/users          → admin: list users
PUT  /api/users/[id]/status → admin: suspend/activate
PUT  /api/users/me       → update own profile
PUT  /api/users/me/password → change password
```

### 5C. Notifications API
```
GET  /api/notifications           → user's notifications
PUT  /api/notifications/read-all  → mark all read
PUT  /api/notifications/[id]/read → mark one read
```

---

## Phase 6: Cleanup

- Remove `lib/mock-data.ts` entirely
- Simplify `lib/api.ts` (no more mock fallback)
- Remove `apps/api` directory (Express server)
- Remove PostgreSQL/Redis dependencies
- Update deployment config

---

## Number Ownership Transfer

**Client's own numbers (37K):**
1. Buyer pays via Stripe → order completed
2. Platform marks number as `sold`, assigns `ownerId`
3. Client's telecom backend processes the actual port/assignment
4. Buyer gets subscription (park/forward/unlimited)

**Seller numbers:**
1. Buyer pays → 90% held for seller (10 days)
2. Seller initiates port-out to buyer
3. Once confirmed → payout released

**NumberBarn numbers:**
1. User redirected to NumberBarn to complete purchase
2. NumberBarn handles transfer directly
3. Platform acts as discovery/search layer only

---

## New Dependencies
```
stripe          → payment processing
csv-parse       → CSV parsing for bulk upload
```

## New Env Variables
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NUMBERBARN_API_TOKEN=at_2pQmYziBU4ga879_...
NUMBERBARN_API_BASE=https://www.numberbarn.com/api
```

---

## What Works NOW vs What Needs NumberBarn Order API

**CAN BUILD NOW:**
- All MongoDB collections + indexes
- All Next.js API routes
- 37K number bulk upload
- NumberBarn search fallback
- Stripe payment for own numbers
- Seller commission system
- Admin dashboard with real data
- Mixed cart (own + NB numbers)
- NB numbers → redirect to NumberBarn website

**NEEDS NB ORDER API (later):**
- Server-to-server NumberBarn purchase
- Unified checkout for mixed carts
- Auto number provisioning from NumberBarn

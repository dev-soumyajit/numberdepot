import { Router, Response, NextFunction, Request } from 'express';
import { prisma } from '../../config/database';
import { authenticate, AuthRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import { CacheService } from '../../services/cache.service';
import { apiResponse, generateOrderNumber, paginationHelper } from '../../utils/helpers';
import { NotFoundError, AppError } from '../../utils/errors';
import { EmailService } from '../../services/email.service';
import { SETUP_FEE, PLATFORM_COMMISSION_RATE } from '../../utils/constants';

const router = Router();

// ═══════════════════════════════════════════
// CART (Redis-backed)
// ═══════════════════════════════════════════

// GET /orders/cart
router.get('/cart', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const items = await CacheService.getCart(req.user!.id);
    res.json(apiResponse(items));
  } catch (error) { next(error); }
});

// POST /orders/cart/items — Add number to cart
router.post('/cart/items', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { phoneNumberId, listingId, planType } = req.body;

    // Find the phone number
    const phone = await prisma.phoneNumber.findUnique({
      where: { id: phoneNumberId },
      include: { owner: { select: { id: true, role: true } } },
    });
    if (!phone || phone.status !== 'available') throw new AppError('Number is not available', 400);

    // Find the listing (required — every number for sale must have a listing)
    const listing = await prisma.listing.findFirst({
      where: {
        phoneNumberId,
        status: 'active',
        ...(listingId && { id: listingId }),
      },
      include: { seller: { select: { id: true, role: true } } },
    });
    if (!listing) throw new AppError('This number has no active listing', 400);

    // Determine payment split
    const isAdminNumber = phone.source === 'platform' || listing.seller.role === 'admin' || listing.seller.role === 'super_admin';
    const price = Number(listing.salePrice || listing.licensePrice || phone.basePrice);
    const commissionRate = isAdminNumber ? 0 : PLATFORM_COMMISSION_RATE; // 0% for admin, 10% for sellers
    const platformFee = isAdminNumber ? price : price * (commissionRate / 100); // Admin gets full, seller gets 90%
    const sellerPayout = isAdminNumber ? 0 : price - platformFee;

    const cart = await CacheService.getCart(req.user!.id);

    // Prevent duplicates
    if (cart.find((item: any) => item.phoneNumberId === phoneNumberId)) {
      throw new AppError('Number is already in your cart', 400);
    }

    // Can't buy your own number
    if (phone.ownerId === req.user!.id) {
      throw new AppError('You cannot purchase your own number', 400);
    }

    const monthlyFees: Record<string, number> = { park: 2.99, forward: 6.99, unlimited: 19.99, business: 9.99, port_away: 0 };

    cart.push({
      id: `cart_${Date.now()}`,
      phoneNumberId,
      listingId: listing.id,
      number: phone.formatted,
      numberType: phone.numberType,
      price,
      planType: planType || 'park',
      setupFee: SETUP_FEE,
      monthlyFee: monthlyFees[planType || 'park'] || 2.99,
      // Payment split info
      sellerId: listing.sellerId,
      isAdminNumber,
      commissionRate,
      platformFee,
      sellerPayout,
    });

    await CacheService.setCart(req.user!.id, cart);
    res.json(apiResponse(cart, 'Added to cart'));
  } catch (error) { next(error); }
});

// DELETE /orders/cart/items/:id
router.delete('/cart/items/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    let cart = await CacheService.getCart(req.user!.id);
    cart = cart.filter((item: any) => item.id !== req.params.id);
    await CacheService.setCart(req.user!.id, cart);
    res.json(apiResponse(cart, 'Removed from cart'));
  } catch (error) { next(error); }
});

// DELETE /orders/cart
router.delete('/cart', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    await CacheService.clearCart(req.user!.id);
    res.json(apiResponse([], 'Cart cleared'));
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════
// ORDERS + PAYMENT
// ═══════════════════════════════════════════

// POST /orders — Create order from cart
router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const cart = await CacheService.getCart(req.user!.id);
    if (!cart.length) throw new AppError('Cart is empty', 400);

    const subtotal = cart.reduce((sum: number, item: any) => sum + item.price + item.setupFee, 0);
    const taxAmount = 0; // Calculate tax based on location if needed
    const fusfFee = subtotal > 0 ? 1.50 : 0; // Universal Service Fund fee
    const totalAmount = subtotal + taxAmount + fusfFee;

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        buyerId: req.user!.id,
        subtotal, taxAmount, fusfFee, totalAmount,
        status: 'pending',
        orderItems: {
          create: cart.map((item: any) => ({
            phoneNumberId: item.phoneNumberId,
            listingId: item.listingId,
            itemType: 'purchase',
            planType: item.planType,
            price: item.price,
            setupFee: item.setupFee,
            monthlyFee: item.monthlyFee,
            sellerId: item.sellerId,
            commissionRate: item.commissionRate,
            commissionAmount: item.platformFee, // Platform's cut
            sellerPayout: item.sellerPayout, // Seller's cut (0 for admin numbers)
          })),
        },
      },
      include: {
        orderItems: {
          include: { phoneNumber: { select: { formatted: true, numberType: true, source: true } } },
        },
      },
    });

    res.status(201).json(apiResponse(order, 'Order created — proceed to payment'));
  } catch (error) { next(error); }
});

/*
 ╔══════════════════════════════════════════════════════════╗
 ║              PAYMENT FLOW                               ║
 ║                                                          ║
 ║  Buyer pays total amount                                 ║
 ║  ├─ If PLATFORM number (admin-owned):                    ║
 ║  │   └─ 100% goes to platform → admin revenue           ║
 ║  │                                                       ║
 ║  └─ If SELLER number (broker-owned):                     ║
 ║      ├─ 10% → Platform commission fee                    ║
 ║      └─ 90% → Seller payout (held 10 days, then avail)  ║
 ║                                                          ║
 ║  + Setup fee ($5) always goes to platform                ║
 ║  + FUSF fee ($1.50) always goes to platform              ║
 ║  + Monthly plan fee goes to platform                     ║
 ╚══════════════════════════════════════════════════════════╝
*/

// POST /orders/:id/pay — Process payment (mock Stripe)
router.post('/:id/pay', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        orderItems: {
          include: {
            phoneNumber: { select: { id: true, formatted: true, source: true, ownerId: true } },
          },
        },
        buyer: { select: { email: true, firstName: true } },
      },
    });
    if (!order) throw new NotFoundError('Order');
    if (order.buyerId !== req.user!.id) throw new AppError('Not your order', 403);
    if (order.status !== 'pending') throw new AppError('Order already processed', 400);

    // ── STEP 1: Charge buyer (mock Stripe) ──
    const stripePaymentId = `pi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    console.log(`\n💳 ═══════════════════════════════════════════`);
    console.log(`💳  PAYMENT PROCESSING — Order ${order.orderNumber}`);
    console.log(`💳  Buyer: ${order.buyer.email}`);
    console.log(`💳  Total: $${Number(order.totalAmount).toFixed(2)}`);
    console.log(`💳  Stripe PI: ${stripePaymentId}`);
    console.log(`💳 ═══════════════════════════════════════════\n`);

    // ── STEP 2: Update order status ──
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'completed',
        stripePaymentIntentId: stripePaymentId,
        completedAt: new Date(),
      },
    });

    // ── STEP 3: Create payment record ──
    await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: req.user!.id,
        amount: order.totalAmount,
        paymentMethod: req.body.paymentMethod || 'card',
        stripePaymentId,
        status: 'succeeded',
      },
    });

    // ── STEP 4: Process each item — transfer ownership + split payments ──
    let totalPlatformRevenue = Number(order.fusfFee); // FUSF always goes to platform
    let totalSellerPayouts = 0;

    for (const item of order.orderItems) {
      if (!item.phoneNumberId) continue;

      const isAdminNumber = item.phoneNumber.source === 'platform';
      const itemPrice = Number(item.price);
      const setupFee = Number(item.setupFee || 0);

      // ─── Transfer number ownership to buyer ───
      await prisma.phoneNumber.update({
        where: { id: item.phoneNumberId },
        data: { status: 'sold', ownerId: req.user!.id },
      });

      // ─── Create subscription for selected plan ───
      if (item.planType && item.monthlyFee) {
        await prisma.subscription.create({
          data: {
            userId: req.user!.id,
            phoneNumberId: item.phoneNumberId,
            planType: item.planType,
            monthlyAmount: item.monthlyFee,
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // ─── Mark listing as sold ───
      if (item.listingId) {
        await prisma.listing.update({
          where: { id: item.listingId },
          data: { status: 'sold', soldAt: new Date() },
        });
      }

      // ═══════════════════════════════════════
      // PAYMENT SPLIT LOGIC
      // ═══════════════════════════════════════

      if (isAdminNumber) {
        // ─── PLATFORM NUMBER: 100% goes to platform ───
        totalPlatformRevenue += itemPrice + setupFee;

        console.log(`   📦 [PLATFORM] ${item.phoneNumber.formatted}`);
        console.log(`      Price: $${itemPrice.toFixed(2)} + Setup: $${setupFee.toFixed(2)}`);
        console.log(`      → Platform gets: $${(itemPrice + setupFee).toFixed(2)} (100%)`);

      } else {
        // ─── SELLER NUMBER: 90% seller, 10% platform ───
        const platformFee = Number(item.commissionAmount || itemPrice * 0.10);
        const sellerEarnings = Number(item.sellerPayout || itemPrice - platformFee);

        totalPlatformRevenue += platformFee + setupFee; // Platform gets commission + setup fee
        totalSellerPayouts += sellerEarnings;

        console.log(`   📦 [SELLER] ${item.phoneNumber.formatted}`);
        console.log(`      Price: $${itemPrice.toFixed(2)} + Setup: $${setupFee.toFixed(2)}`);
        console.log(`      → Seller gets: $${sellerEarnings.toFixed(2)} (${100 - Number(item.commissionRate)}%)`);
        console.log(`      → Platform gets: $${(platformFee + setupFee).toFixed(2)} (${item.commissionRate}% + setup)`);

        // Create commission record for seller payout tracking
        const brokerProfile = await prisma.brokerProfile.findUnique({
          where: { userId: item.sellerId! },
        });

        if (brokerProfile) {
          await prisma.commission.create({
            data: {
              orderItemId: item.id,
              brokerId: brokerProfile.id,
              saleAmount: item.price,
              commissionRate: item.commissionRate,
              platformFee: platformFee,
              sellerEarnings: sellerEarnings,
              status: 'held', // Hold for 10 days before seller can withdraw
              holdUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            },
          });

          // Update broker balance
          await prisma.brokerProfile.update({
            where: { id: brokerProfile.id },
            data: {
              pendingBalance: { increment: sellerEarnings },
              totalSales: { increment: 1 },
              totalRevenue: { increment: itemPrice },
            },
          });

          // Notify seller about the sale
          await prisma.notification.create({
            data: {
              userId: item.sellerId!,
              type: 'sale_completed',
              title: 'Number Sold! 🎉',
              message: `Your number ${item.phoneNumber.formatted} was sold for $${itemPrice.toFixed(2)}. You earned $${sellerEarnings.toFixed(2)} (after ${item.commissionRate}% platform fee).`,
              data: { orderId: order.id, earnings: sellerEarnings },
            },
          });

          await EmailService.sendSaleCompleted(
            item.sellerId!, // Will be resolved to email in email service
            item.phoneNumber.formatted,
            sellerEarnings
          );
        }
      }
    }

    // ── STEP 5: Log payment summary ──
    console.log(`\n   💰 ─── PAYMENT SUMMARY ───`);
    console.log(`   💰 Total charged to buyer: $${Number(order.totalAmount).toFixed(2)}`);
    console.log(`   💰 Platform revenue: $${totalPlatformRevenue.toFixed(2)}`);
    console.log(`   💰 Seller payouts (pending): $${totalSellerPayouts.toFixed(2)}`);
    console.log(`   💰 ═══════════════════════\n`);

    // ── STEP 6: Create audit log ──
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'order_completed',
        entityType: 'order',
        entityId: order.id,
        newData: {
          orderNumber: order.orderNumber,
          total: Number(order.totalAmount),
          platformRevenue: totalPlatformRevenue,
          sellerPayouts: totalSellerPayouts,
          items: order.orderItems.length,
        },
      },
    });

    // ── STEP 7: Clear cart + send confirmation ──
    await CacheService.clearCart(req.user!.id);
    await EmailService.sendOrderConfirmation(
      order.buyer.email,
      order.orderNumber,
      Number(order.totalAmount)
    );

    // Notify buyer
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        type: 'order_completed',
        title: 'Order Confirmed! ✅',
        message: `Your order ${order.orderNumber} for $${Number(order.totalAmount).toFixed(2)} has been completed. Your numbers are now active.`,
        data: { orderId: order.id, orderNumber: order.orderNumber },
      },
    });

    res.json(apiResponse({
      orderNumber: order.orderNumber,
      total: Number(order.totalAmount),
      items: order.orderItems.length,
      paymentId: stripePaymentId,
    }, 'Payment successful! Numbers are now yours.'));
  } catch (error) { next(error); }
});

// ═══════════════════════════════════════════
// ORDER HISTORY
// ═══════════════════════════════════════════

// GET /orders — Buyer's orders
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: req.user!.id },
      include: {
        orderItems: {
          include: { phoneNumber: { select: { formatted: true, numberType: true, source: true } } },
        },
        payments: { select: { status: true, amount: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(apiResponse(orders));
  } catch (error) { next(error); }
});

// GET /orders/:id — Order detail
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        orderItems: { include: { phoneNumber: true } },
        payments: true,
        buyer: { select: { email: true, firstName: true, lastName: true } },
      },
    });
    if (!order) throw new NotFoundError('Order');
    if (order.buyerId !== req.user!.id && !['admin', 'super_admin'].includes(req.user!.role)) {
      throw new AppError('Not authorized', 403);
    }
    res.json(apiResponse(order));
  } catch (error) { next(error); }
});

// GET /orders/admin/all — Admin: all orders
router.get('/admin/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = Math.min(100, parseInt(req.query.limit as string || '20'));
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip: (page - 1) * limit, take: limit,
        include: {
          buyer: { select: { email: true, firstName: true, lastName: true } },
          orderItems: {
            include: {
              phoneNumber: { select: { formatted: true, source: true } },
              seller: { select: { email: true, firstName: true } },
            },
          },
          payments: { select: { status: true, stripePaymentId: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);
    res.json(apiResponse(orders, 'Orders retrieved', paginationHelper(page, limit, total)));
  } catch (error) { next(error); }
});

export default router;

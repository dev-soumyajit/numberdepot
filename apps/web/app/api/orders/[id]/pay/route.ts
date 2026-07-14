import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth-middleware';
import { getOrdersCollection, getNumbersCollection, getUserNumbersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';
import { centsToDollars } from '@/lib/utils/pricing';
import { formatPhone } from '@/lib/utils/phone';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    const auth = requireAuth(req);
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    const ordersCol = await getOrdersCollection();
    const numbersCol = await getNumbersCollection();
    const userNumsCol = await getUserNumbersCollection();
    const userId = new ObjectId(auth.userId);
    const now = new Date();

    const order = await ordersCol.findOne({ _id: new ObjectId(id), userId });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.status !== 'pending') {
      return NextResponse.json({ error: `Order is ${order.status}, cannot process payment` }, { status: 400 });
    }

    // Process each item
    const userNumbers = [];
    const nbOrderIds: string[] = [];

    for (const item of order.items) {
      if (item.source === 'inventory' && item.numberId) {
        // Mark number as sold
        await numbersCol.findOneAndUpdate(
          { _id: item.numberId },
          {
            $set: {
              status: 'sold' as const,
              ownerId: userId,
              orderId: order._id,
              soldAt: now,
              updatedAt: now,
            },
            $unset: { reservedBy: '', reservedAt: '', reservationExpiresAt: '' },
          }
        );
      } else if (item.source === 'numberbarn' && item.numberbarnTn) {
        // Purchase from NumberBarn
        try {
          const { purchaseNumber } = await import('@/lib/numberbarn');
          const result = await purchaseNumber(item.numberbarnTn);
          if (result.success && result.orderId) {
            nbOrderIds.push(result.orderId);
          } else {
            console.error(`[Pay] NumberBarn purchase failed for ${item.numberbarnTn}:`, result.error);
          }
        } catch (e) {
          console.error(`[Pay] NumberBarn purchase error for ${item.numberbarnTn}:`, e);
        }
      }

      // Create user number record
      const digits = item.number.replace(/\D/g, '');
      const areaCode = digits.length === 11 ? digits.slice(1, 4) : digits.slice(0, 3);

      userNumbers.push({
        userId,
        numberId: item.numberId || undefined,
        number: digits,
        formattedNumber: formatPhone(digits),
        numberType: item.numberType,
        areaCode,
        source: item.source,
        plan: item.planType as 'park' | 'forward' | 'unlimited' | 'business',
        monthlyPrice: item.monthlyPrice,
        status: 'active' as const,
        forwardingEnabled: false,
        voicemailEnabled: false,
        portingStatus: item.source === 'numberbarn' ? ('pending' as const) : undefined,
        orderId: order._id,
        purchasedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (userNumbers.length > 0) {
      await userNumsCol.insertMany(userNumbers);
    }

    // Update order status
    const orderUpdate: Record<string, unknown> = { status: 'completed', completedAt: now, updatedAt: now };
    if (nbOrderIds.length > 0) orderUpdate.numberbarnOrderIds = nbOrderIds;
    await ordersCol.updateOne(
      { _id: order._id },
      { $set: orderUpdate }
    );

    // Send confirmation email (best-effort)
    try {
      const { sendOrderConfirmation } = await import('@/lib/resend');
      await sendOrderConfirmation(auth.email, order.orderNumber, order.items, centsToDollars(order.totalAmount));
    } catch (e) {
      console.error('Failed to send order confirmation email:', e);
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Payment processed', status: 'completed' },
    });
  });
}

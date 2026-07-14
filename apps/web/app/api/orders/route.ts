import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAuth } from '@/lib/auth-middleware';
import { getNumbersCollection, getOrdersCollection } from '@/lib/collections';
import { apiHandler } from '@/lib/api-handler';
import { centsToDollars, dollarsToCents } from '@/lib/utils/pricing';

export async function POST(req: NextRequest) {
  return apiHandler(async () => {
    const auth = requireAuth(req);
    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items required' }, { status: 400 });
    }

    const numbersCol = await getNumbersCollection();
    const ordersCol = await getOrdersCollection();
    const userId = new ObjectId(auth.userId);
    const now = new Date();

    // Validate all reserved numbers belong to this user
    const orderItems = [];
    let subtotal = 0;
    let setupFees = 0;
    let monthlyTotal = 0;

    for (const item of items) {
      if (item.source === 'numberbarn') {
        // NumberBarn items don't have a reservation in our DB
        const price = dollarsToCents(item.price || 0);
        const setupFee = dollarsToCents(item.setupFee || 9.99);
        const monthlyPrice = dollarsToCents(item.monthlyFee || 0);

        orderItems.push({
          number: item.number,
          numberType: item.numberType || 'local',
          source: 'numberbarn' as const,
          price,
          setupFee,
          monthlyPrice,
          planType: item.planType || 'park',
          numberbarnTn: item.numberbarnTn || item.rawNumber,
        });

        subtotal += price;
        setupFees += setupFee;
        monthlyTotal += monthlyPrice;
        continue;
      }

      // Inventory items
      if (!item.phoneNumberId || !ObjectId.isValid(item.phoneNumberId)) {
        return NextResponse.json({ error: `Invalid number ID: ${item.phoneNumberId}` }, { status: 400 });
      }

      const numDoc = await numbersCol.findOne({
        _id: new ObjectId(item.phoneNumberId),
        reservedBy: userId,
        status: 'reserved',
      });

      if (!numDoc) {
        return NextResponse.json(
          { error: `Number ${item.phoneNumberId} is not reserved by you` },
          { status: 409 }
        );
      }

      orderItems.push({
        numberId: numDoc._id,
        number: numDoc.formattedNumber,
        numberType: numDoc.numberType,
        source: 'inventory' as const,
        price: numDoc.price,
        setupFee: numDoc.setupFee,
        monthlyPrice: numDoc.monthlyPrice,
        planType: item.planType || 'park',
      });

      subtotal += numDoc.price;
      setupFees += numDoc.setupFee;
      monthlyTotal += numDoc.monthlyPrice;
    }

    const totalAmount = subtotal + setupFees + monthlyTotal;

    // Generate order number
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const todayCount = await ordersCol.countDocuments({
      createdAt: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      },
    });
    const orderNumber = `ND-${dateStr}-${String(todayCount + 1).padStart(3, '0')}`;

    const order = {
      orderNumber,
      userId,
      items: orderItems,
      subtotal,
      setupFees,
      monthlyTotal,
      totalAmount,
      status: 'pending' as const,
      createdAt: now,
      updatedAt: now,
    };

    const result = await ordersCol.insertOne(order);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        orderNumber,
        status: 'pending',
        totalAmount: centsToDollars(totalAmount),
        items: orderItems.map((i) => ({
          ...i,
          numberId: i.numberId?.toString(),
          price: centsToDollars(i.price),
          setupFee: centsToDollars(i.setupFee),
          monthlyPrice: centsToDollars(i.monthlyPrice),
        })),
      },
    });
  });
}

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    const auth = requireAuth(req);
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(params.get('limit') || '10')));
    const skip = (page - 1) * limit;

    const ordersCol = await getOrdersCollection();
    const userId = new ObjectId(auth.userId);

    const [orders, total] = await Promise.all([
      ordersCol.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      ordersCol.countDocuments({ userId }),
    ]);

    const data = orders.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      status: o.status,
      totalAmount: centsToDollars(o.totalAmount),
      subtotal: centsToDollars(o.subtotal),
      setupFees: centsToDollars(o.setupFees),
      monthlyTotal: centsToDollars(o.monthlyTotal),
      items: o.items.map((i) => ({
        ...i,
        numberId: i.numberId?.toString(),
        price: centsToDollars(i.price),
        setupFee: centsToDollars(i.setupFee),
        monthlyPrice: centsToDollars(i.monthlyPrice),
      })),
      createdAt: o.createdAt.toISOString(),
      completedAt: o.completedAt?.toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  });
}

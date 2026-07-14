import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth-middleware';
import { apiHandler } from '@/lib/api-handler';

export async function GET(req: NextRequest) {
  return apiHandler(async () => {
    const payload = requireAuth(req);

    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.userId) });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        companyName: user.companyName || '',
        role: user.role,
        status: user.status,
        createdAt: user.createdAt?.toISOString?.() || user.createdAt || '',
      },
    });
  });
}

export async function PUT(req: NextRequest) {
  return apiHandler(async () => {
    const payload = requireAuth(req);
    const body = await req.json();

    const db = await getDb();
    const update: Record<string, unknown> = { updatedAt: new Date() };

    if (body.firstName !== undefined) update.firstName = body.firstName.trim();
    if (body.lastName !== undefined) update.lastName = body.lastName.trim();
    if (body.phone !== undefined) update.phone = body.phone.trim();
    if (body.companyName !== undefined) update.companyName = body.companyName.trim();

    const result = await db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(payload.userId) },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result._id.toString(),
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        phone: result.phone || '',
        companyName: result.companyName || '',
        role: result.role,
        status: result.status,
      },
    });
  });
}

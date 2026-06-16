import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { sendOTP } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password, role } = await req.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection('users');

    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role === 'seller' ? 'seller' : 'buyer',
      status: 'pending_verification',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.insertOne(user);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otps = db.collection('otps');

    // Remove any existing OTPs for this email
    await otps.deleteMany({ email: email.toLowerCase() });

    await otps.insertOne({
      email: email.toLowerCase(),
      otp,
      userId: result.insertedId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Create TTL index if it doesn't exist
    await otps.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});

    await sendOTP(email.toLowerCase(), otp);

    return NextResponse.json({
      message: 'Registration successful. Please verify your email.',
      userId: result.insertedId.toString(),
      email: email.toLowerCase(),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}

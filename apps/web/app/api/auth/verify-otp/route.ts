import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'numberdepot_jwt_secret_2024';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const db = await getDb();
    const otps = db.collection('otps');
    const users = db.collection('users');

    const otpRecord = await otps.findOne({
      email: email.toLowerCase(),
      otp,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // Activate user
    await users.updateOne(
      { _id: new ObjectId(otpRecord.userId) },
      { $set: { status: 'active', updatedAt: new Date() } }
    );

    // Clean up OTP
    await otps.deleteMany({ email: email.toLowerCase() });

    // Get updated user
    const user = await users.findOne({ _id: new ObjectId(otpRecord.userId) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}

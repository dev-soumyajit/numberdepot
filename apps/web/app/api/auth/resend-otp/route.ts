import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendOTP } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection('users');
    const otps = db.collection('otps');

    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists
      return NextResponse.json({ message: 'If the email exists, a new code has been sent.' });
    }

    // Remove old OTPs
    await otps.deleteMany({ email: email.toLowerCase() });

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await otps.insertOne({
      email: email.toLowerCase(),
      otp,
      userId: user._id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOTP(email.toLowerCase(), otp);

    return NextResponse.json({ message: 'A new verification code has been sent.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ error: 'Failed to resend code. Please try again.' }, { status: 500 });
  }
}

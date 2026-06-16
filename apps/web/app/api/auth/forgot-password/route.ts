import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { sendPasswordReset } from '@/lib/resend';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection('users');
    const resets = db.collection('password_resets');

    const user = await users.findOne({ email: email.toLowerCase() });

    // Always return success to avoid email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If the email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');

    // Remove old resets for this email
    await resets.deleteMany({ email: email.toLowerCase() });

    await resets.insertOne({
      email: email.toLowerCase(),
      token,
      userId: user._id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // Create TTL index
    await resets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});

    // Build reset URL
    const origin = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || req.nextUrl.origin;
    const resetUrl = `${origin}/reset-password?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;

    await sendPasswordReset(email.toLowerCase(), resetUrl);

    return NextResponse.json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request. Please try again.' }, { status: 500 });
  }
}

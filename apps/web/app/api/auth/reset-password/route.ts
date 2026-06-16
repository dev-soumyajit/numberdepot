import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const db = await getDb();
    const resets = db.collection('password_resets');
    const users = db.collection('users');

    const resetRecord = await resets.findOne({
      email: email.toLowerCase(),
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await users.updateOne(
      { _id: new ObjectId(resetRecord.userId) },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    // Clean up
    await resets.deleteMany({ email: email.toLowerCase() });

    return NextResponse.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password. Please try again.' }, { status: 500 });
  }
}

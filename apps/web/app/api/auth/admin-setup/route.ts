import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { ensureIndexes } from '@/lib/ensure-indexes';

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const db = await getDb();

    // Check if admin already exists
    const existingAdmin = await db.collection('users').findOne({ role: 'admin' });
    if (existingAdmin) {
      return NextResponse.json({ error: 'Admin account already exists' }, { status: 400 });
    }

    // Check if email already used
    const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date();

    await db.collection('users').insertOne({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      phone: '',
      companyName: '',
      createdAt: now,
      updatedAt: now,
    });

    // Ensure all indexes are created on first setup
    await ensureIndexes();

    return NextResponse.json({ success: true, data: { message: 'Admin account created' } });
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json({ error: 'Setup failed. Please try again.' }, { status: 500 });
  }
}

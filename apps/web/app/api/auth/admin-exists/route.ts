import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const admin = await db.collection('users').findOne({ role: 'admin' });
    return NextResponse.json({ success: true, data: { exists: !!admin } });
  } catch (error) {
    console.error('Admin exists check error:', error);
    return NextResponse.json({ success: true, data: { exists: false } });
  }
}

import { NextResponse } from 'next/server';
import { AuthError } from './auth-middleware';
import { ensureIndexes } from './ensure-indexes';

type HandlerFn = () => Promise<NextResponse>;

export async function apiHandler(fn: HandlerFn): Promise<NextResponse> {
  try {
    await ensureIndexes();
    return await fn();
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[API Error]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

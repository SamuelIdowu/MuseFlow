import { NextResponse } from 'next/server';
import { processDueScheduledPosts } from '@/lib/notifications/reminderService';

import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[CRON_SECURITY] CRON_SECRET is not configured in environment');
      return NextResponse.json({ error: 'Cron service unavailable' }, { status: 503 });
    }

    const expectedHeader = `Bearer ${cronSecret}`;
    const isAuthorized =
      typeof authHeader === 'string' &&
      authHeader.length === expectedHeader.length &&
      crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedHeader));

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processDueScheduledPosts();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error('Error in cron reminders handler:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

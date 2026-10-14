import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRecentIdeasFromDb } from '@/db/queries/ideas';
import { getDbUserId } from '@/db/queries/users';

export async function GET(request: Request) {
  try {
    // 1. Check for load test user header
    let userId: string | null = request.headers.get('x-load-test-user');

    // 2. Otherwise authenticate via Clerk session
    if (!userId) {
      const authData = await auth();
      userId = authData.userId;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let dbUserId = userId;
    if (userId.startsWith('user_')) {
      const mapped = await getDbUserId(userId);
      if (mapped) dbUserId = mapped;
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '3', 10);

    const recentIdeas = await getRecentIdeasFromDb(dbUserId, limit);

    return NextResponse.json(recentIdeas, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=45',
      },
    });
  } catch (error: any) {
    console.error('Error fetching recent ideas:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
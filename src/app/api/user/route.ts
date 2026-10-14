import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ensureDbUser } from '@/db/queries/users';
import { getDashboardStatsFromDb } from '@/db/queries/dashboard';

export async function GET(_request: Request) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const userId = await ensureDbUser(clerkUser.id, email);

    if (!userId) {
      return NextResponse.json({ error: 'User not synced' }, { status: 401 });
    }

    const stats = await getDashboardStatsFromDb(userId);

    const userData = {
      id: userId,
      email,
      stats: {
        ideasGenerated: stats.ideasCount,
        canvasCreated: stats.canvasCount,
        scheduledPosts: stats.scheduledCount,
      },
      createdAt: new Date(clerkUser.createdAt).toISOString(),
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
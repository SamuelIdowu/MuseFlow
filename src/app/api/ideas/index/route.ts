import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ensureDbUser } from '@/db/queries/users';
import { getUserIdeasFromDb } from '@/db/queries/ideas';

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

    const ideaKernels = await getUserIdeasFromDb(userId);
    return NextResponse.json(ideaKernels);
  } catch (error) {
    console.error('Error fetching idea kernels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
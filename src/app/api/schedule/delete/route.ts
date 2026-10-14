import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ensureDbUser } from '@/db/queries/users';
import { deleteScheduledPostFromDb } from '@/db/queries/schedule';

export async function DELETE(request: Request) {
  try {
    // Get user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      console.error('Schedule DELETE - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const userId = await ensureDbUser(clerkUser.id, email);

    if (!userId) {
      console.error('Schedule DELETE - Failed to sync user for Clerk user:', clerkUser.id);
      return NextResponse.json({ error: 'User not synced' }, { status: 401 });
    }

    // Get post ID from query parameters
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    await deleteScheduledPostFromDb(userId, postId);
    return NextResponse.json({ message: 'Scheduled post deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

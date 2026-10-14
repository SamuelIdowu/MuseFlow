import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ensureDbUser } from '@/db/queries/users';
import { updateCanvasSessionNameInDb, deleteCanvasSessionFromDb } from '@/db/queries/canvas';

export async function PUT(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    const user = await currentUser();

    if (!clerkUserId || !user) {
      console.error('Canvas update - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error('Canvas update - No email found for user');
      return NextResponse.json({ error: 'User has no email address' }, { status: 400 });
    }

    const userId = await ensureDbUser(clerkUserId, email);
    if (!userId) {
      return NextResponse.json({ error: 'Failed to ensure user exists' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const canvasId = searchParams.get('id');

    if (!canvasId) {
      return NextResponse.json({ error: 'Canvas ID is required' }, { status: 400 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Canvas name is required' }, { status: 400 });
    }

    const updated = await updateCanvasSessionNameInDb(userId, canvasId, name);
    if (!updated) {
      return NextResponse.json({ error: 'Canvas not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating canvas session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    const user = await currentUser();

    if (!clerkUserId || !user) {
      console.error('Canvas delete - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error('Canvas delete - No email found for user');
      return NextResponse.json({ error: 'User has no email address' }, { status: 400 });
    }

    const userId = await ensureDbUser(clerkUserId, email);
    if (!userId) {
      return NextResponse.json({ error: 'Failed to ensure user exists' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const canvasId = searchParams.get('id');

    if (!canvasId) {
      return NextResponse.json({ error: 'Canvas ID is required' }, { status: 400 });
    }

    await deleteCanvasSessionFromDb(userId, canvasId);

    return NextResponse.json({ message: 'Canvas session deleted successfully' });
  } catch (error) {
    console.error('Error deleting canvas session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
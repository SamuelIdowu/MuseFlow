import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ensureDbUser } from '@/db/queries/users';
import { db } from '@/db';
import { canvasSessions, canvasBlocks } from '@/db/schema/canvas';
import { eq, and, desc, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    const user = await currentUser();

    if (!clerkUserId || !user) {
      console.error('Canvas API - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error('Canvas API - No email found for user');
      return NextResponse.json({ error: 'User has no email address' }, { status: 400 });
    }

    const userId = await ensureDbUser(clerkUserId, email);
    if (!userId) {
      return NextResponse.json({ error: 'Failed to ensure user exists' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const canvasId = searchParams.get('id');

    if (canvasId) {
      const session = await db.query.canvasSessions.findFirst({
        where: and(eq(canvasSessions.id, canvasId), eq(canvasSessions.userId, userId)),
      });

      if (!session) {
        return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
      }

      const blocks = await db.query.canvasBlocks.findMany({
        where: and(eq(canvasBlocks.canvasId, canvasId), eq(canvasBlocks.userId, userId)),
        orderBy: [asc(canvasBlocks.orderIndex)],
      });

      return NextResponse.json({
        ...session,
        canvas_blocks: blocks,
      });
    } else {
      const sessions = await db.query.canvasSessions.findMany({
        where: eq(canvasSessions.userId, userId),
        orderBy: [desc(canvasSessions.updatedAt)],
      });

      return NextResponse.json(sessions);
    }
  } catch (error) {
    console.error('Error fetching canvas sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
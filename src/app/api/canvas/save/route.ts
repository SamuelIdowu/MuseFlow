/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ensureDbUser } from '@/db/queries/users';
import { db } from '@/db';
import { canvasSessions, canvasBlocks } from '@/db/schema/canvas';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    const user = await currentUser();

    if (!clerkUserId || !user) {
      console.error('Canvas save API - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error('Canvas save API - No email found for user');
      return NextResponse.json({ error: 'User has no email address' }, { status: 400 });
    }

    const userId = await ensureDbUser(clerkUserId, email);
    if (!userId) {
      return NextResponse.json({ error: 'Failed to ensure user exists' }, { status: 500 });
    }

    const { canvas_data, canvas_name, canvas_id } = await request.json();

    if (!canvas_data || !Array.isArray(canvas_data)) {
      return NextResponse.json({ error: 'Canvas data is required and must be an array' }, { status: 400 });
    }

    if (canvas_id) {
      const insertedBlocks = await db.transaction(async (tx) => {
        await tx
          .delete(canvasBlocks)
          .where(and(eq(canvasBlocks.canvasId, canvas_id), eq(canvasBlocks.userId, userId)));

        const blocksWithCanvasId = canvas_data.map((block: any, index: number) => ({
          canvasId: canvas_id,
          userId,
          type: block.type || 'paragraph',
          content: block.content,
          orderIndex: block.order_index ?? index,
          positionX: block.position_x ?? block.position?.x ?? 0,
          positionY: block.position_y ?? block.position?.y ?? 0,
        }));

        const inserted = blocksWithCanvasId.length > 0
          ? await tx.insert(canvasBlocks).values(blocksWithCanvasId).returning()
          : [];

        await tx
          .update(canvasSessions)
          .set({ updatedAt: new Date() })
          .where(and(eq(canvasSessions.id, canvas_id), eq(canvasSessions.userId, userId)));

        return inserted;
      });

      return NextResponse.json({
        success: true,
        canvas_id: canvas_id,
        blocks: insertedBlocks,
      });
    } else {
      const [newSession] = await db
        .insert(canvasSessions)
        .values({
          userId,
          name: canvas_name || 'Untitled Canvas',
        })
        .returning();

      const blocksWithCanvasId = canvas_data.map((block: any, index: number) => ({
        canvasId: newSession.id,
        userId,
        type: block.type || 'paragraph',
        content: block.content,
        orderIndex: block.order_index ?? index,
        positionX: block.position_x ?? block.position?.x ?? 0,
        positionY: block.position_y ?? block.position?.y ?? 0,
      }));

      const inserted = blocksWithCanvasId.length > 0
        ? await db.insert(canvasBlocks).values(blocksWithCanvasId).returning()
        : [];

      return NextResponse.json({
        success: true,
        canvas_id: newSession.id,
        blocks: inserted,
      });
    }
  } catch (error) {
    console.error('Error saving canvas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
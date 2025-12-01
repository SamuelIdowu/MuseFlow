import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createSupabaseServiceClient, ensureSupabaseUser } from '@/lib/supabaseServerClient';

export async function POST(request: Request) {
  try {
    // Get Clerk authentication
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      console.error('Canvas save API - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error('Canvas save API - No email found for user');
      return NextResponse.json({ error: 'User has no email address' }, { status: 400 });
    }

    // Ensure user exists in Supabase and get their UUID
    const supabaseUserId = await ensureSupabaseUser(userId, email);
    if (!supabaseUserId) {
      return NextResponse.json({ error: 'Failed to ensure user exists' }, { status: 500 });
    }

    // Create Supabase service client (bypasses RLS)
    const supabase = createSupabaseServiceClient();

    const { canvas_data, canvas_name, canvas_id } = await request.json();

    // Validate input
    if (!canvas_data || !Array.isArray(canvas_data)) {
      return NextResponse.json({ error: 'Canvas data is required and must be an array' }, { status: 400 });
    }

    if (canvas_id) {
      // First, delete existing blocks for this canvas
      const deleteResult = await supabase
        .from('canvas_blocks')
        .delete()
        .eq('canvas_id', canvas_id)
        .eq('user_id', supabaseUserId);

      if (deleteResult.error) {
        throw deleteResult.error;
      }

      // Then insert new blocks
      const blocksWithCanvasId = canvas_data.map((block: any, index: number) => ({
        canvas_id: canvas_id,
        user_id: supabaseUserId,
        type: block.type,
        content: block.content,
        order_index: block.order_index ?? index,
        meta: block.meta || {}
      }));

      const insertResult = await supabase
        .from('canvas_blocks')
        .insert(blocksWithCanvasId)
        .select();

      if (insertResult.error) {
        throw insertResult.error;
      }

      // Update the canvas session's updated_at timestamp
      const updateCanvasResult = await supabase
        .from('canvas_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', canvas_id)
        .eq('user_id', supabaseUserId);

      if (updateCanvasResult.error) {
        throw updateCanvasResult.error;
      }

      return NextResponse.json({
        success: true,
        canvas_id: canvas_id,
        blocks: insertResult.data
      });
    } else {
      // Create new canvas session first
      const canvasSessionResult = await supabase
        .from('canvas_sessions')
        .insert([{
          user_id: supabaseUserId,
          name: canvas_name || 'Untitled Canvas'
        }])
        .select()
        .single();

      if (canvasSessionResult.error) {
        throw canvasSessionResult.error;
      }

      const newCanvas = canvasSessionResult.data;

      // Then save the blocks
      const blocksWithCanvasId = canvas_data.map((block: any, index: number) => ({
        canvas_id: newCanvas.id,
        user_id: supabaseUserId,
        type: block.type,
        content: block.content,
        order_index: block.order_index ?? index,
        meta: block.meta || {}
      }));

      const insertResult = await supabase
        .from('canvas_blocks')
        .insert(blocksWithCanvasId)
        .select();

      if (insertResult.error) {
        throw insertResult.error;
      }

      return NextResponse.json({
        success: true,
        canvas_id: newCanvas.id,
        blocks: insertResult.data
      });
    }
  } catch (error) {
    console.error('Error saving canvas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
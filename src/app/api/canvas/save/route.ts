import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/lib/database.types';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  try {
    // Get the user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user || userError) {
      console.error('Canvas save - No user found or user error:', { userError });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

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
        .eq('user_id', userId);

      if (deleteResult.error) {
        throw deleteResult.error;
      }

      // Then insert new blocks
      const blocksWithCanvasId = canvas_data.map((block: any, index: number) => ({
        canvas_id: canvas_id,
        user_id: userId,
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
        .eq('user_id', userId);

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
          user_id: userId,
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
        user_id: userId,
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
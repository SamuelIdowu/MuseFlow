import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { canvasService } from '@/lib/supabaseService';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { canvas_data, canvas_name, canvas_id } = await request.json();

    // Validate input
    if (!canvas_data || !Array.isArray(canvas_data)) {
      return NextResponse.json({ error: 'Canvas data is required and must be an array' }, { status: 400 });
    }

    let result;
    
    if (canvas_id) {
      // Update existing canvas
      result = await canvasService.saveCanvasBlocks(
        canvas_id,
        session.user.id,
        canvas_data
      );
    } else {
      // Create new canvas session first
      const newCanvas = await canvasService.createCanvasSession(
        session.user.id,
        canvas_name || 'Untitled Canvas'
      );
      
      // Then save the blocks
      result = await canvasService.saveCanvasBlocks(
        newCanvas.id,
        session.user.id,
        canvas_data
      );
    }

    return NextResponse.json({
      success: true,
      canvas_id: canvas_id || (await canvasService.getCanvasSession(result[0].canvas_id, session.user.id)).id,
      blocks: result
    });
  } catch (error) {
    console.error('Error saving canvas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
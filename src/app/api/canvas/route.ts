import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { canvasService } from '@/lib/supabaseService';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get canvas session ID from query parameters if provided
    const { searchParams } = new URL(request.url);
    const canvasId = searchParams.get('id');

    if (canvasId) {
      // Get specific canvas session
      const canvasSession = await canvasService.getCanvasSession(canvasId, session.user.id);
      return NextResponse.json(canvasSession);
    } else {
      // Get all canvas sessions for the user
      const { data, error } = await supabase
        .from('canvas_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error fetching canvas sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get canvas session ID from query parameters
    const { searchParams } = new URL(request.url);
    const canvasId = searchParams.get('id');

    if (!canvasId) {
      return NextResponse.json({ error: 'Canvas ID is required' }, { status: 400 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Canvas name is required' }, { status: 400 });
    }

    // Update the canvas session in the database
    const { data, error } = await supabase
      .from('canvas_sessions')
      .update({
        name,
        updated_at: new Date().toISOString()
      })
      .eq('id', canvasId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating canvas session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get canvas session ID from query parameters
    const { searchParams } = new URL(request.url);
    const canvasId = searchParams.get('id');

    if (!canvasId) {
      return NextResponse.json({ error: 'Canvas ID is required' }, { status: 400 });
    }

    // Delete the canvas session from the database
    // This will also delete associated canvas blocks due to foreign key constraint
    const { error } = await supabase
      .from('canvas_sessions')
      .delete()
      .eq('id', canvasId)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Canvas session deleted successfully' });
  } catch (error) {
    console.error('Error deleting canvas session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
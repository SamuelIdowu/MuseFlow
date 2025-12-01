import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/lib/database.types';

export async function PUT(request: Request) {
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
      console.error('Canvas update - No user found or user error:', { userError });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

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
      .eq('user_id', userId)
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
      console.error('Canvas delete - No user found or user error:', { userError });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

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
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ message: 'Canvas session deleted successfully' });
  } catch (error) {
    console.error('Error deleting canvas session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
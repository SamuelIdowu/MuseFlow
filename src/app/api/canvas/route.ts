import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/lib/database.types';

export async function GET(request: Request) {
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
      console.error('Canvas - No user found or user error:', { userError });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Get canvas session ID from query parameters if provided
    const { searchParams } = new URL(request.url);
    const canvasId = searchParams.get('id');

    if (canvasId) {
      // Get specific canvas session with its blocks
      const { data, error } = await supabase
        .from('canvas_sessions')
        .select(`
          *,
          canvas_blocks(*)
        `)
        .eq('id', canvasId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Record not found
          return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
        }
        throw error;
      }

      return NextResponse.json(data);
    } else {
      // Get all canvas sessions for the user
      const { data, error } = await supabase
        .from('canvas_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error fetching canvas sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
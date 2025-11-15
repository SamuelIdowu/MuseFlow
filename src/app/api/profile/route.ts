import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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
    // Get the user (more secure than session)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Add debugging logs
    console.log('Profile GET - User retrieval result:', {
      hasUser: !!user,
      userId: user?.id,
      userError,
      cookiesAvailable: cookieStore.getAll().length > 0
    });

    if (!user || userError) {
      console.error('Profile GET - No user found or user error:', { userError });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the user's profile from the database using the authenticated user
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.log('Profile GET - Database query result:', {
        hasData: !!data,
        error
      });

      if (error.code === 'PGRST116') { // Record not found
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      console.error('Error fetching profile:', error);
      throw error;
    }

    console.log('Profile GET - Successfully fetched profile:', { id: data?.id, userId: user.id });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    // Get the user (more secure than session)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Add debugging logs
    console.log('Profile POST - User retrieval result:', {
      hasUser: !!user,
      userId: user?.id,
      userError,
      cookiesAvailable: cookieStore.getAll().length > 0
    });

    if (!user || userError) {
      console.error('Profile POST - No user found or user error:', { userError });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { niche, tone_config, samples } = await request.json();

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;
    if (existingProfile) {
      // Update existing profile
      console.log('Profile POST - Updating existing profile for user:', user.id);
      result = await supabase
        .from('profiles')
        .update({
          niche,
          tone_config,
          samples,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();
    } else {
      // Create new profile
      console.log('Profile POST - Creating new profile for user:', user.id);
      result = await supabase
        .from('profiles')
        .insert([{
          user_id: user.id,
          niche,
          tone_config,
          samples
        }])
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error in profile operation:', result.error);
      throw result.error;
    }

    console.log('Profile POST - Successfully saved profile:', { id: result.data?.id, userId: user.id });
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
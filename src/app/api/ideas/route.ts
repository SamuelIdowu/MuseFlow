import { NextResponse } from 'next/server';
import { generateIdeas } from '@/lib/geminiClient';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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
    // Get the session (this authenticates the user properly)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // Add debugging logs
    console.log('Session retrieval result:', {
      session: !!session,
      sessionError,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      cookiesAvailable: cookieStore.getAll().length > 0
    });

    if (sessionError) {
      console.error('Session retrieval error:', sessionError);
    }

    if (!session) {
      // Try to get user directly as an alternative
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      console.log('User retrieval result:', {
        hasUser: !!user,
        userId: user?.id,
        userError
      });

      if (!user || userError) {
        console.error('No session and no user found - user not authenticated');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      console.log('User found without session, proceeding with user ID:', user.id);
    }

    const { input_text, input_type = 'text' } = await request.json();

    // Validate input
    if (!input_text?.trim()) {
      return NextResponse.json({ error: 'Input text is required' }, { status: 400 });
    }

    // Call the Gemini API to generate ideas
    const generatedIdeas = await generateIdeas(input_text);

    // Save the idea kernel to the database using the authenticated session or user
    const userId = session?.user?.id || (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await supabase
      .from('idea_kernels')
      .insert([{
        user_id: userId,
        input_type,
        input_data: input_text,
        kernels: generatedIdeas
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating idea kernel:', error);
      throw error;
    }

    console.log('Successfully created idea kernel:', { id: data.id, userId });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating ideas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
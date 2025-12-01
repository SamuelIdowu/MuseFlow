import { NextResponse } from 'next/server';
import { generateIdeas } from '@/lib/geminiClient';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createSupabaseServiceClient, ensureSupabaseUser } from '@/lib/supabaseServerClient';

export async function POST(request: Request) {
  try {
    // Get Clerk authentication
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      console.error('Ideas API - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error('Ideas API - No email found for user');
      return NextResponse.json({ error: 'User has no email address' }, { status: 400 });
    }

    // Ensure user exists in Supabase and get their UUID
    const supabaseUserId = await ensureSupabaseUser(userId, email);
    if (!supabaseUserId) {
      return NextResponse.json({ error: 'Failed to ensure user exists' }, { status: 500 });
    }

    // Create Supabase service client (bypasses RLS)
    const supabase = createSupabaseServiceClient();

    const { input_text, input_type = 'text', active_profile } = await request.json();

    // Validate input
    if (!input_text?.trim()) {
      return NextResponse.json({ error: 'Input text is required' }, { status: 400 });
    }

    // Call the Gemini API to generate ideas
    const generatedIdeas = await generateIdeas(input_text, active_profile);

    // Save the idea kernel to the database
    const { data, error } = await supabase
      .from('idea_kernels')
      .insert([{
        user_id: supabaseUserId,
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

    console.log('Successfully created idea kernel:', { id: data.id, userId: supabaseUserId });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating ideas:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createSupabaseServiceClient, ensureSupabaseUser } from '@/lib/supabaseServerClient';

export async function GET(request: Request) {
  try {
    // Get Clerk authentication
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      console.error('Profile GET - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      console.error('Profile GET - No email found for user');
      return NextResponse.json({ error: 'User has no email address' }, { status: 400 });
    }

    // Ensure user exists in Supabase and get their UUID
    const supabaseUserId = await ensureSupabaseUser(userId, email);
    if (!supabaseUserId) {
      return NextResponse.json({ error: 'Failed to ensure user exists' }, { status: 500 });
    }

    // Create Supabase service client (bypasses RLS)
    const supabase = createSupabaseServiceClient();

    // Fetch the user's profile from the database using the authenticated user
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', supabaseUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      console.error('Error fetching profile:', error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
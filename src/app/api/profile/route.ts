import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createSupabaseServiceClient, getSupabaseUserId } from '@/lib/supabaseServerClient';
import { Database } from '@/lib/database.types';

export async function GET(request: Request) {
  try {
    // Get user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      console.error('Profile GET - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Supabase user ID from Clerk ID
    const supabaseUserId = await getSupabaseUserId(clerkUser.id);

    if (!supabaseUserId) {
      console.error('Profile GET - No Supabase user ID found for Clerk user:', clerkUser.id);
      return NextResponse.json({ error: 'User not synced' }, { status: 401 });
    }

    // Create supabase client to fetch profile
    const supabase = createSupabaseServiceClient();

    // Fetch the user's profile from the database using the Supabase user ID
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', supabaseUserId)
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

    console.log('Profile GET - Successfully fetched profile:', { id: data?.id, userId: supabaseUserId });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Get user from Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      console.error('Profile POST - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Supabase user ID from Clerk ID
    const supabaseUserId = await getSupabaseUserId(clerkUser.id);

    if (!supabaseUserId) {
      console.error('Profile POST - No Supabase user ID found for Clerk user:', clerkUser.id);
      return NextResponse.json({ error: 'User not synced' }, { status: 401 });
    }

    const { niche, tone_config, samples } = await request.json();

    // Create supabase client to save profile
    const supabase = createSupabaseServiceClient();

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', supabaseUserId)
      .single();

    let result;
    if (existingProfile) {
      // Update existing profile
      console.log('Profile POST - Updating existing profile for user:', supabaseUserId);
      result = await supabase
        .from('profiles')
        .update({
          niche,
          tone_config,
          samples
        })
        .eq('user_id', supabaseUserId)
        .select()
        .single();
    } else {
      // Create new profile
      console.log('Profile POST - Creating new profile for user:', supabaseUserId);
      result = await supabase
        .from('profiles')
        .insert([{
          user_id: supabaseUserId,
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

    console.log('Profile POST - Successfully saved profile:', { id: result.data?.id, userId: supabaseUserId });
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { profileService } from '@/lib/supabaseService';
import { createSupabaseServerClient } from '@/lib/supabaseServerClient';

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  
  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the user's profile from the database
    const profile = await profileService.getProfile(session.user.id);
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  
  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { niche, tone_config, samples } = await request.json();

    // Check if profile exists
    const existingProfile = await profileService.getProfile(session.user.id);
    
    let profile;
    if (existingProfile) {
      // Update existing profile
      profile = await profileService.updateProfile(session.user.id, {
        niche,
        tone_config,
        samples
      });
    } else {
      // Create new profile
      profile = await profileService.createProfile(session.user.id, {
        niche,
        tone_config,
        samples
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
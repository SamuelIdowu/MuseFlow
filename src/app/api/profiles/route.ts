import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createSupabaseServiceClient, getSupabaseUserId } from '@/lib/supabaseServerClient';

// GET /api/profiles - Fetch all profiles for the authenticated user
export async function GET() {
    try {
        // Get user from Clerk
        const clerkUser = await currentUser();

        if (!clerkUser) {
            console.error('Profiles GET - No Clerk user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get Supabase user ID from Clerk ID
        const supabaseUserId = await getSupabaseUserId(clerkUser.id);

        if (!supabaseUserId) {
            console.error('Profiles GET - No Supabase user ID found for Clerk user:', clerkUser.id);
            return NextResponse.json({ error: 'User not synced' }, { status: 401 });
        }

        // Create supabase client to fetch profiles
        const supabase = createSupabaseServiceClient();

        // Fetch all user's profiles from the database
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', supabaseUserId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching profiles:', error);
            throw error;
        }

        console.log('Profiles GET - Successfully fetched profiles:', { count: data?.length, userId: supabaseUserId });
        return NextResponse.json({ profiles: data || [] });
    } catch (error) {
        console.error('Error fetching profiles:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/profiles - Create a new profile
export async function POST(request: Request) {
    try {
        // Get user from Clerk
        const clerkUser = await currentUser();

        if (!clerkUser) {
            console.error('Profiles POST - No Clerk user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get Supabase user ID from Clerk ID
        const supabaseUserId = await getSupabaseUserId(clerkUser.id);

        if (!supabaseUserId) {
            console.error('Profiles POST - No Supabase user ID found for Clerk user:', clerkUser.id);
            return NextResponse.json({ error: 'User not synced' }, { status: 401 });
        }

        const { profile_name, niche, tone_config, samples, is_active } = await request.json();

        // Validate required fields
        if (!profile_name || !profile_name.trim()) {
            return NextResponse.json({ error: 'Profile name is required' }, { status: 400 });
        }

        // Create supabase client
        const supabase = createSupabaseServiceClient();

        // If this profile should be active, deactivate all others first
        if (is_active) {
            await supabase
                .from('profiles')
                .update({ is_active: false })
                .eq('user_id', supabaseUserId);
        }

        // Create new profile
        console.log('Profiles POST - Creating new profile for user:', supabaseUserId);
        const { data, error } = await supabase
            .from('profiles')
            .insert([{
                user_id: supabaseUserId,
                profile_name: profile_name.trim(),
                niche: niche || null,
                tone_config: tone_config || null,
                samples: samples || null,
                is_active: is_active || false
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating profile:', error);
            throw error;
        }

        console.log('Profiles POST - Successfully created profile:', { id: data?.id, userId: supabaseUserId });
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

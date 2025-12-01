import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createSupabaseServiceClient, getSupabaseUserId } from '@/lib/supabaseServerClient';

// POST /api/profiles/[id]/activate - Set a profile as active
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get user from Clerk
        const clerkUser = await currentUser();

        if (!clerkUser) {
            console.error('Profile Activate - No Clerk user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get Supabase user ID from Clerk ID
        const supabaseUserId = await getSupabaseUserId(clerkUser.id);

        if (!supabaseUserId) {
            console.error('Profile Activate - No Supabase user ID found for Clerk user:', clerkUser.id);
            return NextResponse.json({ error: 'User not synced' }, { status: 401 });
        }

        // Create supabase client
        const supabase = createSupabaseServiceClient();

        // Verify the profile belongs to the user
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('id', id)
            .single();

        if (!existingProfile || existingProfile.user_id !== supabaseUserId) {
            return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 404 });
        }

        // First, deactivate all profiles for this user
        console.log('Profile Activate - Deactivating all profiles for user:', supabaseUserId);
        await supabase
            .from('profiles')
            .update({ is_active: false })
            .eq('user_id', supabaseUserId);

        // Then, activate the specified profile
        console.log('Profile Activate - Activating profile:', id);
        const { data, error } = await supabase
            .from('profiles')
            .update({ is_active: true })
            .eq('id', id)
            .eq('user_id', supabaseUserId)
            .select()
            .single();

        if (error) {
            console.error('Error activating profile:', error);
            throw error;
        }

        console.log('Profile Activate - Successfully activated profile:', { id: data?.id, userId: supabaseUserId });
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error activating profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

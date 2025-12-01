import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createSupabaseServiceClient, getSupabaseUserId } from '@/lib/supabaseServerClient';

// PUT /api/profiles/[id] - Update a specific profile
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get user from Clerk
        const clerkUser = await currentUser();

        if (!clerkUser) {
            console.error('Profile PUT - No Clerk user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get Supabase user ID from Clerk ID
        const supabaseUserId = await getSupabaseUserId(clerkUser.id);

        if (!supabaseUserId) {
            console.error('Profile PUT - No Supabase user ID found for Clerk user:', clerkUser.id);
            return NextResponse.json({ error: 'User not synced' }, { status: 401 });
        }

        const { profile_name, niche, tone_config, samples } = await request.json();

        // Validate required fields
        if (!profile_name || !profile_name.trim()) {
            return NextResponse.json({ error: 'Profile name is required' }, { status: 400 });
        }

        // Create supabase client
        const supabase = createSupabaseServiceClient();

        // Verify the profile belongs to the user before updating
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('id', id)
            .single();

        if (!existingProfile || existingProfile.user_id !== supabaseUserId) {
            return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 404 });
        }

        // Update the profile
        console.log('Profile PUT - Updating profile:', id);
        const { data, error } = await supabase
            .from('profiles')
            .update({
                profile_name: profile_name.trim(),
                niche: niche || null,
                tone_config: tone_config || null,
                samples: samples || null
            })
            .eq('id', id)
            .eq('user_id', supabaseUserId)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile:', error);
            throw error;
        }

        console.log('Profile PUT - Successfully updated profile:', { id: data?.id, userId: supabaseUserId });
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/profiles/[id] - Delete a specific profile
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get user from Clerk
        const clerkUser = await currentUser();

        if (!clerkUser) {
            console.error('Profile DELETE - No Clerk user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get Supabase user ID from Clerk ID
        const supabaseUserId = await getSupabaseUserId(clerkUser.id);

        if (!supabaseUserId) {
            console.error('Profile DELETE - No Supabase user ID found for Clerk user:', clerkUser.id);
            return NextResponse.json({ error: 'User not synced' }, { status: 401 });
        }

        // Create supabase client
        const supabase = createSupabaseServiceClient();

        // Verify the profile belongs to the user before deleting
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('id', id)
            .single();

        if (!existingProfile || existingProfile.user_id !== supabaseUserId) {
            return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 404 });
        }

        // Delete the profile
        console.log('Profile DELETE - Deleting profile:', id);
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', id)
            .eq('user_id', supabaseUserId);

        if (error) {
            console.error('Error deleting profile:', error);
            throw error;
        }

        console.log('Profile DELETE - Successfully deleted profile:', { id, userId: supabaseUserId });
        return NextResponse.json({ success: true, message: 'Profile deleted successfully' });
    } catch (error) {
        console.error('Error deleting profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

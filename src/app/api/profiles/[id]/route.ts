import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncProfileToAgent } from '@/lib/researchAgentClient';
import { ensureDbUser } from '@/db/queries/users';
import { updateProfileInDb, deleteProfileInDb } from '@/db/queries/profiles';

// PUT /api/profiles/[id] - Update a specific profile
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const clerkUser = await currentUser();

        if (!clerkUser) {
            console.error('Profile PUT - No Clerk user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const userId = await ensureDbUser(clerkUser.id, email);

        if (!userId) {
            console.error('Profile PUT - Failed to sync user for Clerk user:', clerkUser.id);
            return NextResponse.json({ error: 'User not synced' }, { status: 401 });
        }

        const requestJson = await request.json();
        const { profile_name, niche, tone_config, samples } = requestJson;

        // Validate required fields
        if (!profile_name || !profile_name.trim()) {
            return NextResponse.json({ error: 'Profile name is required' }, { status: 400 });
        }

        const updated = await updateProfileInDb(userId, id, {
            profile_name: profile_name.trim(),
            niche: niche || null,
            tone_config: tone_config || null,
            default_content_type: requestJson.default_content_type || null,
            samples: samples || null,
        });

        if (!updated) {
            return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 404 });
        }

        syncProfileToAgent(updated.id, updated.profile_name, updated.niche || undefined).catch(console.warn);
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/profiles/[id] - Delete a specific profile
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const clerkUser = await currentUser();

        if (!clerkUser) {
            console.error('Profile DELETE - No Clerk user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const userId = await ensureDbUser(clerkUser.id, email);

        if (!userId) {
            console.error('Profile DELETE - Failed to sync user for Clerk user:', clerkUser.id);
            return NextResponse.json({ error: 'User not synced' }, { status: 401 });
        }

        const success = await deleteProfileInDb(userId, id);
        if (!success) {
            return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Profile deleted successfully' });
    } catch (error) {
        console.error('Error deleting profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

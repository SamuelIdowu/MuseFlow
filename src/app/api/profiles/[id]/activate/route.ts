import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { ensureDbUser } from '@/db/queries/users';
import { activateProfileInDb } from '@/db/queries/profiles';

// POST /api/profiles/[id]/activate - Set a profile as active
export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const clerkUser = await currentUser();

        if (!clerkUser) {
            console.error('Profile Activate - No Clerk user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const userId = await ensureDbUser(clerkUser.id, email);

        if (!userId) {
            console.error('Profile Activate - Failed to sync user for Clerk user:', clerkUser.id);
            return NextResponse.json({ error: 'User not synced' }, { status: 401 });
        }

        const activated = await activateProfileInDb(userId, id);
        if (!activated) {
            return NextResponse.json({ error: 'Profile not found or access denied' }, { status: 404 });
        }

        return NextResponse.json(activated);
    } catch (error) {
        console.error('Error activating profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

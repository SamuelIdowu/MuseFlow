import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { syncProfileToAgent } from '@/lib/researchAgentClient';
import { checkFeatureAccess } from '@/lib/plans/featureGates';
import { ensureDbUser } from '@/db/queries/users';
import { getUserProfilesFromDb, createProfileInDb } from '@/db/queries/profiles';

// GET /api/profiles - Fetch all profiles for the authenticated user
export async function GET() {
    try {
        const clerkUser = await currentUser();

        if (!clerkUser) {
            console.error('Profiles GET - No Clerk user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const userId = await ensureDbUser(clerkUser.id, email);

        if (!userId) {
            console.error('Profiles GET - Failed to sync user for Clerk user:', clerkUser.id);
            return NextResponse.json({ error: 'User not synced' }, { status: 401 });
        }

        const profiles = await getUserProfilesFromDb(userId);
        return NextResponse.json({ profiles });
    } catch (error: any) {
        console.error('Error fetching profiles:', {
            message: error?.message,
            code: error?.code,
            status: error?.status,
            errors: error?.errors,
            clerkTraceId: error?.clerkTraceId,
            fullError: error
        });
        return NextResponse.json({
            error: 'Internal server error',
            details: error?.errors || error?.message
        }, { status: 500 });
    }
}

// POST /api/profiles - Create a new profile
export async function POST(request: Request) {
    try {
        const clerkUser = await currentUser();

        if (!clerkUser) {
            console.error('Profiles POST - No Clerk user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const userId = await ensureDbUser(clerkUser.id, email);

        if (!userId) {
            console.error('Profiles POST - Failed to sync user for Clerk user:', clerkUser.id);
            return NextResponse.json({ error: 'User not synced' }, { status: 401 });
        }

        const requestJson = await request.json();
        const { profile_name, niche, tone_config, samples, is_active } = requestJson;

        // Validate required fields
        if (!profile_name || !profile_name.trim()) {
            return NextResponse.json({ error: 'Profile name is required' }, { status: 400 });
        }

        // Plan Gate: Check brand_profiles limit
        const gateCheck = await checkFeatureAccess(userId, 'brand_profiles');
        if (!gateCheck.allowed) {
            return NextResponse.json({
                error: 'PLAN_LIMIT_REACHED',
                message: gateCheck.reason || 'Brand profile limit reached. Upgrade to Pro for up to 10 profiles.',
                feature: 'brand_profiles',
                limit: gateCheck.limit,
                current: gateCheck.current,
                requiredPlan: gateCheck.requiredPlan,
            }, { status: 403 });
        }

        const data = await createProfileInDb(userId, {
            profile_name: profile_name.trim(),
            niche: niche || null,
            tone_config: tone_config || null,
            default_content_type: requestJson.default_content_type || null,
            samples: samples || null,
            is_active: is_active || false,
        });

        if (data?.id) {
            syncProfileToAgent(data.id, data.profile_name, data.niche || undefined).catch(console.warn);
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

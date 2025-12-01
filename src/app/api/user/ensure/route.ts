import { auth } from "@clerk/nextjs/server";
import { ensureSupabaseUser } from "@/lib/supabaseServerClient";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * API route to ensure a user exists in Supabase
 * This is called from client components to sync Clerk users with Supabase
 */
export async function POST() {
    const { userId } = await auth();

    if (!userId) {
        console.error('[API /user/ensure] No userId from auth()');
        return Response.json({ error: "Not authorized" }, { status: 401 });
    }

    console.log('[API /user/ensure] Processing for Clerk userId:', userId);

    try {
        // Get user email from Clerk
        const client = await clerkClient();
        const user = await client.users.getUser(userId);

        console.log('[API /user/ensure] Clerk user fetched, email count:', user.emailAddresses?.length);

        if (!user.emailAddresses || user.emailAddresses.length === 0) {
            console.error('[API /user/ensure] User has no email addresses');
            return Response.json(
                { error: "User has no email address" },
                { status: 400 }
            );
        }

        const email = user.emailAddresses[0].emailAddress;
        console.log('[API /user/ensure] Email:', email);

        // Ensure user exists in Supabase
        const supabaseUserId = await ensureSupabaseUser(userId, email);

        if (!supabaseUserId) {
            console.error('[API /user/ensure] ensureSupabaseUser returned null');
            return Response.json(
                { error: "Failed to create/fetch Supabase user" },
                { status: 500 }
            );
        }

        console.log('[API /user/ensure] Success! Supabase userId:', supabaseUserId);

        return Response.json({
            success: true,
            supabaseUserId
        });
    } catch (error) {
        console.error("[API /user/ensure] Error:", error);
        return Response.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

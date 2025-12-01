import { useUser } from "@clerk/nextjs";
import { supabase } from "./supabaseClient";

/**
 * Hook to get the Supabase user ID for the current Clerk user
 * Ensures the user exists in Supabase by calling the API
 */
export async function getSupabaseUserIdClient(clerkUserId: string): Promise<string | null> {
    try {
        // Call API to ensure user exists in Supabase
        // The API uses service role key and returns the Supabase user ID
        const ensureResponse = await fetch('/api/user/ensure', {
            method: 'POST',
        });

        if (!ensureResponse.ok) {
            const errorData = await ensureResponse.json().catch(() => ({}));
            console.error('Failed to ensure user exists in Supabase:', {
                status: ensureResponse.status,
                statusText: ensureResponse.statusText,
                error: errorData
            });
            return null;
        }

        const responseData = await ensureResponse.json();
        console.log('User ensured in Supabase:', responseData);

        // Return the Supabase user ID from the API response
        // No need to query again - the API already has it!
        return responseData.supabaseUserId || null;
    } catch (error) {
        console.error('Error in getSupabaseUserIdClient:', error);
        return null;
    }
}

/**
 * React hook to get Supabase user ID from Clerk user
 * Returns null while loading or if there's an error
 */
export function useSupabaseUserId() {
    const { user: clerkUser, isLoaded } = useUser();

    if (!isLoaded || !clerkUser) {
        return null;
    }

    return clerkUser.id;
}

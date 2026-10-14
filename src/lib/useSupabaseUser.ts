import { useUser } from "@clerk/nextjs";

/**
 * Ensures the user exists in Neon database by calling /api/user/ensure
 */
export async function getDbUserIdClient(_clerkUserId?: string): Promise<string | null> {
    void _clerkUserId;
    try {
        const ensureResponse = await fetch('/api/user/ensure', {
            method: 'POST',
        });

        if (!ensureResponse.ok) {
            const errorData = await ensureResponse.json().catch(() => ({}));
            console.error('Failed to ensure user exists in database:', {
                status: ensureResponse.status,
                statusText: ensureResponse.statusText,
                error: errorData
            });
            return null;
        }

        const responseData = await ensureResponse.json();
        return responseData.userId || responseData.supabaseUserId || null;
    } catch (error) {
        console.error('Error in getDbUserIdClient:', error);
        return null;
    }
}

export const getSupabaseUserIdClient = getDbUserIdClient;

/**
 * React hook to get Clerk user ID
 */
export function useDbUserId() {
    const { user: clerkUser, isLoaded } = useUser();

    if (!isLoaded || !clerkUser) {
        return null;
    }

    return clerkUser.id;
}

export const useSupabaseUserId = useDbUserId;


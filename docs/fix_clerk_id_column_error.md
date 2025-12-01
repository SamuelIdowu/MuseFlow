# Fix for "column users.clerk_id does not exist" Error

## Problem

The error occurs because your code is trying to query a `clerk_id` column in the `users` table that doesn't exist in your Supabase database.

```
Error getting Supabase user ID: {
  code: '42703',
  details: null,
  hint: null,
  message: 'column users.clerk_id does not exist'
}
```

## Root Cause

Your `schema.sql` file defines the `users` table with a `clerk_id` column, but this schema hasn't been applied to your Supabase database yet. The code in files like:
- `src/lib/supabaseServerClient.ts`
- `src/lib/useSupabaseUser.ts`
- `src/app/api/auth/route.ts`

All assume this column exists and try to query it.

## Solution

You have **two options** to fix this:

### Option 1: Run the Migration Script (Recommended)

If you already have data in your `users` table that you want to keep:

1. **Open Supabase SQL Editor**:
   - Go to your Supabase dashboard
   - Navigate to: SQL Editor (in the left sidebar)

2. **Run the migration script**:
   - Copy the contents of `add_clerk_id_column.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

This will safely add the `clerk_id` column to your existing `users` table.

### Option 2: Run the Full Schema (If Starting Fresh)

If you don't have important data yet and want to start fresh:

1. **Drop existing tables** (WARNING: This will delete all data):
   ```sql
   DROP TABLE IF EXISTS scheduled_posts CASCADE;
   DROP TABLE IF EXISTS canvas_blocks CASCADE;
   DROP TABLE IF EXISTS canvas_sessions CASCADE;
   DROP TABLE IF EXISTS idea_kernels CASCADE;
   DROP TABLE IF EXISTS profiles CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```

2. **Run the full schema**:
   - Copy the entire contents of `schema.sql`
   - Paste it into the Supabase SQL Editor
   - Click "Run"

## After Running the Migration

1. **Restart your development server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then start it again:
   npm run dev
   ```

2. **Test the authentication flow**:
   - Try to log in with Clerk
   - The error should be gone
   - Check that users are being created in Supabase

## Verification

To verify the column was added successfully:

1. Go to Supabase Dashboard → Table Editor → `users` table
2. You should see these columns:
   - `id` (uuid)
   - `email` (text)
   - `clerk_id` (text) ← This should now exist
   - `created_at` (timestamptz)

## What This Fixes

Once the `clerk_id` column exists, these operations will work:

✅ User lookup by Clerk ID in `getSupabaseUserId()`
✅ User creation via webhook in `/api/auth/route.ts`
✅ Schedule API endpoints (`/api/schedule`)
✅ Canvas and other features that require user authentication

## Prevention

To avoid this in the future:

1. **Always apply schema changes** to your Supabase database after editing `schema.sql`
2. **Use migrations** for schema changes instead of editing the main schema file
3. **Keep your database in sync** with your code changes

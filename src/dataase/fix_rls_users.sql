-- Fix RLS policies for users table
-- The client (using anon key) can't read from users table
-- We need to allow authenticated users to read user data

-- First, check if policy already exists and drop it if needed
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create policy to allow authenticated users to read all users
-- (You can make this more restrictive if needed)
CREATE POLICY "Authenticated users can read users" ON users
FOR SELECT
TO authenticated
USING (true);

-- Allow service role full access (used by our API)
DROP POLICY IF EXISTS "Service role full access" ON users;
CREATE POLICY "Service role full access" ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Done! ✅
-- Now the client can read user data after the API creates it

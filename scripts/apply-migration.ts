import { createClient } from '@supabase/supabase-js';

// Using Node process.env as Next.js might be handling env loading if run via next context, 
// but for a standalone script, we'll try to keep it simple.
const supabaseUrl = "https://fiyhlclepuqfegmokmum.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is not set in your terminal environment.');
    console.log('\n--- ACTION REQUIRED ---');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log("ALTER TABLE canvas_sessions ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]'::jsonb;");
    console.log('-----------------------\n');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function applyMigration() {
    console.log('Applying migration: Add chat_history to canvas_sessions');
    
    try {
        // Attempting to use a standard table operation as a connectivity check first
        const { error: checkError } = await supabase.from('canvas_sessions').select('id').limit(1);
        if (checkError) {
             console.error('Connectivity check failed:', checkError.message);
             process.exit(1);
        }

        const { error } = await supabase.rpc('exec', { 
            query: "ALTER TABLE canvas_sessions ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]'::jsonb;" 
        });

        if (error) {
            console.log('\n--- SQL TO RUN MANUALLY ---');
            console.log("ALTER TABLE canvas_sessions ADD COLUMN IF NOT EXISTS chat_history JSONB DEFAULT '[]'::jsonb;");
            console.log('---------------------------\n');
            console.log('ERROR: The migration failed via RPC. This is common if "exec" RPC is missing.');
            console.log('Please copy and run the SQL above in the Supabase SQL Editor.');
        } else {
            console.log('Migration applied successfully!');
        }
    } catch (err: any) {
        console.error('Unexpected error:', err.message);
    }
}

applyMigration();

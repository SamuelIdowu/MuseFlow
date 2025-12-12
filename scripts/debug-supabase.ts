
import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

// Load env from .env.local
loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

console.log('Testing Supabase connection to:', supabaseUrl.replace(/https?:\/\/([^.]+)\./, 'https://***.'));

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function testConnection() {
    try {
        console.log('Attempting simple select...');
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Supabase connection failed:', error);
        } else {
            console.log('Supabase connection successful!');
            console.log('Data:', data);
        }

        console.log('Attempting to read idea_kernels (auth check)...');
        const { error: error2 } = await supabase.from('idea_kernels').select('id').limit(1);
        if (error2) {
            console.error('idea_kernels select failed:', error2);
        } else {
            console.log('idea_kernels select successful');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();

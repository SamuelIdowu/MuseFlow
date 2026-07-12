const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkCanvasSchema() {
    console.log('Checking columns for canvas_sessions table...');
    
    // We try to select a single row to see what columns exist in the result
    const { data, error } = await supabase
        .from('canvas_sessions')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error querying canvas_sessions:', error.message);
    } else {
        if (data.length > 0) {
            console.log('Columns found in canvas_sessions:', Object.keys(data[0]));
        } else {
            console.log('No rows found in canvas_sessions. Attempting to insert a temporary row to check schema...');
            // This is a bit risky but we can try a rollback-like approach if we had a transaction
            // Instead, let's try to query a column we suspect is missing to confirm
            const { error: columnError } = await supabase
                .from('canvas_sessions')
                .select('chat_history')
                .limit(1);
            
            if (columnError) {
                console.log('Column "chat_history" DOES NOT exist:', columnError.message);
            } else {
                console.log('Column "chat_history" EXISTS.');
            }
        }
    }
}

checkCanvasSchema();

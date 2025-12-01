
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

async function checkSchema() {
    console.log('Checking schema for profiles table...');

    // Query information_schema to get columns
    // Note: We can't query information_schema directly via supabase-js easily without a stored procedure or raw SQL if enabled.
    // But we can try to select * from profiles limit 0 to see if it errors or returns empty.
    // Actually, supabase-js doesn't return column metadata easily.

    // Let's try to just select * and see what happens, or try to insert a dummy row with just user_id and see what columns are returned if any.
    // Better yet, let's try to use the rpc call if there is one, but there probably isn't.

    // Alternative: Try to select specific columns and see which one fails.

    console.log('Attempting to select * from profiles...');
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting *:', error);
    } else {
        console.log('Select * successful. Data:', data);
        if (data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]));
        } else {
            console.log('No rows found, cannot determine columns from data.');
        }
    }
}

checkSchema();

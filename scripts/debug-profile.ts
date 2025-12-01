
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

async function debugProfileCreation() {
    console.log('Starting profile creation debug...');

    // 1. Get a user to test with (we'll just pick the first one found or you can specify a clerk_id)
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, clerk_id, email')
        .limit(1);

    if (userError) {
        console.error('Error fetching users:', userError);
        return;
    }

    if (!users || users.length === 0) {
        console.error('No users found in the database. Please sign up first.');
        return;
    }

    const user = users[0];
    console.log(`Using user: ${user.email} (ID: ${user.id})`);

    // 2. Attempt to create a profile
    const profileData = {
        user_id: user.id,
        profile_name: 'Debug Profile ' + new Date().toISOString(),
        niche: 'Debugging',
        tone_config: {
            professionalism: 50,
            creativity: 50,
            casualness: 50,
            directness: 50
        },
        samples: ['This is a sample post.'],
        is_active: false
    };

    console.log('Attempting to insert profile:', JSON.stringify(profileData, null, 2));

    const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

    if (error) {
        console.error('❌ Error creating profile:');
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Profile created successfully:', data);

        // Cleanup
        console.log('Cleaning up...');
        await supabase.from('profiles').delete().eq('id', data.id);
    }
}

debugProfileCreation();

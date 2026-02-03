import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local manually since we are running standalone
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading env from:', envPath);

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["'](.*)["']$/, '$1'); // Remove quotes
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    });
} else {
    console.warn('.env.local not found!');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    if (!supabaseUrl) console.error('NEXT_PUBLIC_SUPABASE_URL is missing');
    if (!supabaseKey) console.error('SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing');
    process.exit(1);
}

// Mask key for logging
const maskedKey = supabaseKey.substring(0, 5) + '...' + supabaseKey.substring(supabaseKey.length - 5);
console.log('Testing connection to:', supabaseUrl);
console.log('Using Key:', maskedKey);

async function testConnection() {
    try {
        // 1. Basic Fetch
        console.log('\n--- 1. Testing Basic Fetch ---');
        try {
            const response = await fetch(`${supabaseUrl}/rest/v1/`, {
                headers: {
                    'apikey': supabaseKey!,
                    'Authorization': `Bearer ${supabaseKey}`
                }
            });
            console.log('Basic Fetch Status:', response.status);
            console.log('Basic Fetch OK:', response.ok);
        } catch (e: any) {
            console.error('Basic Fetch FAILED:', e.message);
            console.error('Cause:', e.cause);
        }

        // 2. Supabase Client (Standard)
        console.log('\n--- 2. Testing Standard Supabase Client ---');
        try {
            const supabase = createClient(supabaseUrl!, supabaseKey!);
            const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

            if (error) {
                console.error('Standard Client Error:', error);
            } else {
                console.log('Standard Client Success. Connection working.');
            }
        } catch (e: any) {
            console.error('Standard Client Exception:', e.message);
        }

        // 3. Supabase Client (With specific options from app)
        console.log('\n--- 3. Testing Supabase Client with options (duplex: half) ---');
        try {
            const supabaseWithConfig = createClient(supabaseUrl!, supabaseKey!, {
                auth: { persistSession: false },
                global: {
                    fetch: (url, options) => {
                        return fetch(url, {
                            ...options,
                            // @ts-ignore
                            duplex: 'half',
                        });
                    }
                }
            });

            const { error: configError } = await supabaseWithConfig.from('users').select('count', { count: 'exact', head: true });
            if (configError) {
                console.error('Config Client Error:', configError);
                console.error('Full Error:', JSON.stringify(configError, null, 2));
            } else {
                console.log('Config Client Success.');
            }
        } catch (e: any) {
            console.error('Config Client Exception:', e.message);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();

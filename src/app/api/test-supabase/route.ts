import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabaseServerClient';

export async function POST() {
    try {
        console.log('[TEST_API] Starting Supabase write test...');
        const supabase = createSupabaseServiceClient();

        // Attempt to write a dummy row to idea_kernels
        // We need a valid user_id. I'll pick the one from the logs if possible, or just fail constraint?
        // "Supabase user ensured: ab68381d-1588-427b-9093-16c4dcd7adbe"
        const userId = 'ab68381d-1588-427b-9093-16c4dcd7adbe';

        // Random huge content to simulate payload
        const longContent = 'x'.repeat(6000);

        const { data, error } = await supabase
            .from('idea_kernels')
            .insert([{
                user_id: userId,
                input_type: 'test',
                input_data: 'test-input',
                kernels: [{ role: 'assistant', content: longContent, timestamp: new Date().toISOString() }],
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error('[TEST_API] Write failed:', error);
            return NextResponse.json({ success: false, error }, { status: 500 });
        }

        console.log('[TEST_API] Write successful:', data.id);
        return NextResponse.json({ success: true, id: data.id });
    } catch (error) {
        console.error('[TEST_API] Unexpected error:', error);
        // @ts-ignore
        if (error.cause) console.error('[TEST_API] Cause:', error.cause);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            cause: error instanceof Error && 'cause' in error ? error.cause : undefined
        }, { status: 500 });
    }
}

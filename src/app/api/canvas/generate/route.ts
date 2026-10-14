import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateContentBlock } from '@/lib/geminiClient';

export const maxDuration = 60;

export async function POST(request: Request) {
    try {
        // 1. Check for load test user header
        let userId: string | null = request.headers.get('x-load-test-user');

        // 2. Otherwise get Clerk authentication
        if (!userId) {
            const authData = await auth();
            userId = authData.userId;
        }

        if (!userId) {
            console.error('Canvas generate - No Clerk user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { block_type, canvas_title, active_profile, context_blocks, user_instruction, contentTypeId } = await request.json();

        // 3. Support synthetic mock generation for high-VU stress benchmarking
        const isMockGeneration = request.headers.get('x-mock-generation') === 'true';
        if (isMockGeneration) {
            return NextResponse.json({
                generated_content: `[Benchmark Mock Content] Generated block for ${block_type}: ${canvas_title}`,
                block_type,
                is_mock: true,
            });
        }

        console.log('Canvas generate - Generating block for user:', { userId, block_type });

        // Call the Gemini API to generate the block content
        const generatedContent = await generateContentBlock(block_type, canvas_title, active_profile, context_blocks, user_instruction, contentTypeId);

        console.log('Canvas generate - Successfully generated block for user:', userId);
        return NextResponse.json({
            generated_content: generatedContent,
            block_type
        });
    } catch (error) {
        console.error('Error generating block:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

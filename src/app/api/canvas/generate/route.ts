import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { generateContentBlock } from '@/lib/geminiClient';

export async function POST(request: Request) {
    try {
        // Get Clerk authentication
        const { userId } = await auth();

        if (!userId) {
            console.error('Canvas generate - No Clerk user found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { block_type, canvas_title, active_profile, context_blocks, user_instruction } = await request.json();

        console.log('Canvas generate - Generating block for user:', { userId, block_type });

        // Call the Gemini API to generate the block content
        const generatedContent = await generateContentBlock(block_type, canvas_title, active_profile, context_blocks, user_instruction);

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

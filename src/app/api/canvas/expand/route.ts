import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { expandContentBlock } from '@/lib/geminiClient';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // Get Clerk authentication
    const { userId } = await auth();

    if (!userId) {
      console.error('Canvas expand - No Clerk user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { block_content, block_type, canvas_title, active_profile, context_blocks } = await request.json();

    // Validate input
    if (!block_content?.trim()) {
      return NextResponse.json({ error: 'Block content is required' }, { status: 400 });
    }

    console.log('Canvas expand - Expanding block for user:', { userId, block_type, contentLength: block_content.length });

    // Call the Gemini API to expand the block content
    const expandedContent = await expandContentBlock(block_content, block_type, canvas_title, active_profile, context_blocks);

    console.log('Canvas expand - Successfully expanded block for user:', userId);
    return NextResponse.json({
      original_content: block_content,
      expanded_content: expandedContent,
      block_type
    });
  } catch (error) {
    console.error('Error expanding block:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
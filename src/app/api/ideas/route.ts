import { NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/geminiClient';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createSupabaseServiceClient, ensureSupabaseUser } from '@/lib/supabaseServerClient';


export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    console.log('[IDEAS_API] Starting request processing');

    // Get Clerk authentication (Read-only check)
    // We still want to ensure the user is authenticated, even if we don't save to DB immediately.
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Debug: Check if Gemini Key is present
    if (!process.env.GEMINI_API_KEY) {
      console.error("DEBUG: GEMINI_API_KEY is missing in route environment");
    }

    const body = await request.json();
    const { input_text, input_type = 'text', active_profile, chat_id, history } = body;
    console.log('[IDEAS_API] Request payload received', { input_type, chat_id, hasProfile: !!active_profile, historyLength: history?.length });

    // Validate input
    if (!input_text?.trim()) {
      return NextResponse.json({ error: 'Input text is required' }, { status: 400 });
    }

    let conversationHistory: any[] = [];

    // 1. Use client-provided history if available (Stateless mode)
    if (Array.isArray(history)) {
      conversationHistory = history;
    }
    // 2. Fallback/Hybrid: If chat_id exists, we COULD fetch from DB, but for "Manual Save" flow
    // we primarily rely on what the client sends to keep it consistent with the UI state.
    // However, if the user reloads and continues a saved chat, the client should have that history.
    // So enabling the client to pass history is sufficient.

    // Call the Gemini API to generate chat response
    let generatedResponse: string;
    try {
      console.log('[IDEAS_API] Calling generateChatResponse...');
      generatedResponse = await generateChatResponse(input_text, active_profile, conversationHistory);
      console.log('[IDEAS_API] generateChatResponse success, length:', generatedResponse.length);
    } catch (e) {
      console.error('[IDEAS_API] generateChatResponse failed:', e);
      throw new Error(`Gemini generation failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Return the generated content ONLY. No DB save.
    // The client attaches this to its state. manual save will happen via a separate Server Action.
    return NextResponse.json({
      generated_content: generatedResponse,
      // We return a dummy or null ID since we didn't create a DB record
      id: chat_id || null,
      kernels: [{ role: 'assistant', content: generatedResponse, timestamp: new Date().toISOString() }] // Maintain structure for frontend compat
    });

  } catch (error) {
    console.error('Error generating ideas:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error',
      details: error instanceof Error ? error.stack : error
    }, { status: 500 });
  }
}
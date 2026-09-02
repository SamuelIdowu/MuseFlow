'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getActiveProfile } from '@/lib/dashboardServerActions';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
});

export type AiTransformCommand =
  | 'adjust_tone'
  | 'rephrase'
  | 'make_shorter'
  | 'make_longer'
  | 'fix_grammar'
  | 'custom';

interface TransformTextParams {
  text: string;
  command: AiTransformCommand;
  tone?: string;
  customPrompt?: string;
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 8000,
  fallbackValue?: T
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => {
      if (fallbackValue !== undefined) {
        resolve(fallbackValue);
      } else {
        reject(new Error(`Operation timed out after ${ms}ms`));
      }
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export async function transformSelectedTextAction({
  text,
  command,
  tone,
  customPrompt,
}: TransformTextParams): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    if (!text || text.trim().length === 0) {
      return { success: false, error: 'No text provided to transform' };
    }

    if (!process.env.GEMINI_API_KEY) {
      return {
        success: true,
        result: `${text} (Transformed: ${command}${tone ? ` - ${tone}` : ''})`,
      };
    }

    const activeProfile = await withTimeout(getActiveProfile(), 4000, null).catch(() => null);

    let profileContext = '';
    if (activeProfile) {
      profileContext = `Target Profile: ${activeProfile.profile_name || 'Creator'}, Niche: ${activeProfile.niche || 'General'}. `;
    }

    let instruction = '';
    switch (command) {
      case 'adjust_tone':
        instruction = `Rewrite the following text to have a strictly "${tone || 'Persuasive'}" tone while preserving its core meaning and key facts. ${profileContext}`;
        break;
      case 'rephrase':
        instruction = `Rephrase the following text to improve clarity, rhythm, and punchiness without losing the original meaning. ${profileContext}`;
        break;
      case 'make_shorter':
        instruction = `Condense the following text to be concise, crisp, and high-impact. Cut fluff while keeping the core insight.`;
        break;
      case 'make_longer':
        instruction = `Expand the following text with compelling reasoning, practical examples, or helpful context. Maintain high quality. ${profileContext}`;
        break;
      case 'fix_grammar':
        instruction = `Fix any spelling, punctuation, grammar, and syntax errors in the following text. Keep the voice natural.`;
        break;
      case 'custom':
        instruction = `${customPrompt || 'Improve the following text'}. ${profileContext}`;
        break;
    }

    const prompt = `${instruction}\n\nStrict Rule: Return ONLY the transformed text replacement. Do NOT include markdown code blocks (like \`\`\`), no conversational intro or outro.\n\nOriginal Text:\n${text}`;

    const response = await withTimeout(model.generateContent(prompt), 10000);
    let output = response.response.text().trim();

    if (output.startsWith('```') && output.endsWith('```')) {
      output = output.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    }

    return { success: true, result: output };
  } catch (error: any) {
    console.error('Error in transformSelectedTextAction:', error);
    return { success: false, error: error.message || 'Failed to transform text' };
  }
}

function sanitizeContinuation(text: string): string {
  let cleaned = text
    .replace(/^```[a-z]*\n?/gi, '')
    .replace(/\n?```$/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  // If wrapped in quotes, strip them
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Limit to at most 2 sentences for crisp ghost text
  const sentences = cleaned.split(/(?<=[.?!])\s+/);
  if (sentences.length > 2) {
    cleaned = sentences.slice(0, 2).join(' ');
  }

  if (cleaned.length > 200) {
    cleaned = cleaned.slice(0, 200).replace(/\s+\S*$/, '...');
  }

  // Ensure single leading space if not starting with punctuation
  if (cleaned && !/^[,.;:!?\s]/.test(cleaned)) {
    cleaned = ` ${cleaned}`;
  }

  return cleaned;
}

async function tryResearchAgentContinuation(brief: string): Promise<string | null> {
  const agentUrl = process.env.RESEARCH_AGENT_URL || 'http://localhost:8000';
  const apiKey = process.env.RESEARCH_AGENT_API_KEY || '';
  const clientId =
    process.env.RESEARCH_AGENT_CLIENT_ID || '00000000-0000-0000-0000-000000000000';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    const res = await fetch(`${agentUrl.replace(/\/$/, '')}/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        brief,
        client_id: clientId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.draft && typeof data.draft === 'string') {
        const sanitized = sanitizeContinuation(data.draft);
        if (sanitized.trim().length > 0) {
          return sanitized;
        }
      }
    }
    return null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

export async function generateContentContinuationAction({
  currentContent,
  instruction,
  documentTitle,
}: {
  currentContent: string;
  instruction?: string;
  documentTitle?: string;
}): Promise<{ success: boolean; result?: string; source?: 'research_agent' | 'gemini_fallback'; error?: string }> {
  try {
    const plainText = currentContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plainText || plainText.length < 5) {
      return { success: false, error: 'Not enough context to suggest continuation' };
    }

    const snippet = plainText.slice(-600);

    // 1. Primary: Try Research Agent service (with 2s timeout)
    const researchBrief = `Continue this piece of content seamlessly with a single natural, high-impact sentence or phrase.
${documentTitle ? `Title: ${documentTitle}. ` : ''}
Context snippet: "${snippet}".
${instruction ? `Directive: ${instruction}` : 'Provide the immediate next logical thought without repeating words.'}`;

    const raResult = await tryResearchAgentContinuation(researchBrief);
    if (raResult) {
      return {
        success: true,
        result: raResult,
        source: 'research_agent',
      };
    }

    // 2. Fallback: MuseFlow Native Gemini AI
    if (!process.env.GEMINI_API_KEY) {
      return {
        success: true,
        result: ' and streamline your content creation process with measurable clarity.',
        source: 'gemini_fallback',
      };
    }

    const activeProfile = await withTimeout(getActiveProfile(), 4000, null).catch(() => null);
    let profileContext = '';
    if (activeProfile) {
      profileContext = `Target Voice: ${activeProfile.profile_name || 'Creator'}, Niche: ${activeProfile.niche || 'General'}.`;
    }

    const prompt = `You are a real-time inline ghostwriter and autocomplete engine.
${profileContext}
${documentTitle ? `Document Title: "${documentTitle}"` : ''}

Task: Continue the following text naturally with ONLY the immediate next 1-2 phrases or short sentence (12 to 25 words max).
${instruction ? `Directive: ${instruction}` : ''}

Strict Rules:
- Return ONLY the continuation text.
- Do NOT repeat the last few words of the input.
- Do NOT output HTML tags, markdown blocks, quotes, or conversational intros/outros.
- Must connect smoothly to the preceding text.

Preceding text:
"...${snippet}"`;

    const response = await withTimeout(model.generateContent(prompt), 8000);
    const rawOutput = response.response.text();
    const cleanOutput = sanitizeContinuation(rawOutput);

    return {
      success: true,
      result: cleanOutput,
      source: 'gemini_fallback',
    };
  } catch (error: any) {
    console.error('Error in generateContentContinuationAction:', error);
    return { success: false, error: error.message || 'Failed to generate continuation' };
  }
}

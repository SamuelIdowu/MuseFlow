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

    const activeProfile = await getActiveProfile();

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

    const response = await model.generateContent(prompt);
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

export async function generateContentContinuationAction({
  currentContent,
  instruction,
}: {
  currentContent: string;
  instruction?: string;
}): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        success: true,
        result: '<p>In addition, modern creators who prioritize consistency and clarity build lasting authority across all platforms.</p>',
      };
    }

    const activeProfile = await getActiveProfile();
    let profileContext = '';
    if (activeProfile) {
      profileContext = `Audience Niche: ${activeProfile.niche || 'General'}, Voice: ${activeProfile.profile_name}. `;
    }

    const prompt = `You are an elite ghostwriter and content editor.
${profileContext}
The user is writing a piece of content. Continue the text seamlessly based on what has been written so far.
${instruction ? `Specific Directive: ${instruction}` : 'Generate the next logical paragraph or compelling continuation.'}

Strict Rules:
- Return ONLY the continuation text formatted in clean HTML (e.g. <p>...</p>).
- Do NOT repeat what was already written.
- No commentary or backticks.

Document so far:
${currentContent.slice(-1500)}`;

    const response = await model.generateContent(prompt);
    let output = response.response.text().trim();

    if (output.startsWith('```') && output.endsWith('```')) {
      output = output.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    }

    return { success: true, result: output };
  } catch (error: any) {
    console.error('Error in generateContentContinuationAction:', error);
    return { success: false, error: error.message || 'Failed to generate continuation' };
  }
}

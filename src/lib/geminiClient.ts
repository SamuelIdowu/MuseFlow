import { GoogleGenerativeAI } from "@google/generative-ai";
import { Profile } from "@/types/profile";
import { CONTENT_TYPES } from "@/types/content";
import { fetchUrlContent, extractUrls, isValidUrl } from "./urlUtils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 15000,
  fallbackValue?: T
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => {
      if (fallbackValue !== undefined) {
        resolve(fallbackValue);
      } else {
        reject(new Error(`AI generation timed out after ${ms}ms`));
      }
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function buildProfileContext(profile?: Profile | null): Promise<string> {
  if (!profile) return "";

  let context = `\n\n═══════════════════════════════════════════════════\nCREATOR BRAND VOICE & PERSONA CONTEXT:\n`;
  context += `• Brand / Creator Name: ${profile.profile_name}\n`;
  if (profile.niche) context += `• Core Niche / Industry: ${profile.niche}\n`;

  if (profile.tone_config) {
    const { professionalism = 5, creativity = 5, casualness = 5, directness = 5 } = profile.tone_config;
    context += `• Tone Matrix (1-10 Scale):\n`;
    context += `  - Professionalism [${professionalism}/10]: ${professionalism >= 7 ? 'Authoritative, enterprise-grade, polished' : professionalism <= 3 ? 'Unfiltered, raw, authentic' : 'Balanced, approachable'}\n`;
    context += `  - Creativity [${creativity}/10]: ${creativity >= 7 ? 'Novel metaphors, unconventional hooks, bold storytelling' : 'Clear, structured, straightforward'}\n`;
    context += `  - Casualness [${casualness}/10]: ${casualness >= 7 ? 'Conversational, colloquial, short sentences, friendly' : 'Formal, measured'}\n`;
    context += `  - Directness [${directness}/10]: ${directness >= 7 ? 'Get straight to the point, zero fluff, high value density' : 'Elaborative, explorative'}\n`;
  }

  if (profile.samples && profile.samples.length > 0) {
    const processedSamples = await Promise.all(profile.samples.map(async (s) => {
      if (isValidUrl(s)) {
        const content = await fetchUrlContent(s);
        return content ? `  - Style Reference from ${s}:\n    "${content.substring(0, 1500)}..."` : `  - "${s}"`;
      }
      return `  - "${s}"`;
    }));
    context += `• Creator's Writing Style Examples (mimic this cadence & rhythm):\n${processedSamples.join('\n')}\n`;
  }

  context += `CRITICAL INSTRUCTION: Fully embody this persona. Avoid robotic corporate jargon (like 'In today's fast-paced digital landscape' or 'delve into'). Write with real human creator voice.\n═══════════════════════════════════════════════════\n`;
  return context;
}

export async function generateChatResponse(input: string, activeProfile?: Profile | null, history: any[] = [], contentTypeId?: string): Promise<string> {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
    console.error("GEMINI_API_KEY is not set");
    return `Here is some placeholder content for specific topic: "${input}". 
    
    1. Introduction to the topic.
    2. Key concepts and importance.
    3. Practical applications and examples.
    4. Conclusion and next steps.
    
    This is a simulated response because the API key is missing.`;
  }

  try {
    const profileContext = await buildProfileContext(activeProfile);

    // Check for URLs in input
    const urls = extractUrls(input);
    let urlContext = "";
    if (urls.length > 0) {
      const contents = await Promise.all(urls.map(async url => {
        const content = await fetchUrlContent(url);
        return content ? `\nContent from ${url}:\n${content}\n` : "";
      }));
      urlContext = contents.join("");
    }

    // Format history for the prompt
    let historyContext = "";
    if (history && history.length > 0) {
      historyContext = "\n\nChat History:\n";
      history.forEach((msg, index) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        // Skip the current input if it's somehow already in history (shouldn't be, but good saftey)
        if (msg.content === input && index === history.length - 1) return;
        historyContext += `${role}: ${msg.content}\n`;
      });
      historyContext += "\n";
    }

    // Look up content type if provided
    let contentTypeInstruction = "";
    if (contentTypeId) {
      const typeDef = CONTENT_TYPES.find(t => t.id === contentTypeId);
      if (typeDef) {
        contentTypeInstruction = `\nOUTPUT FORMATTING REQUIREMENT:\nThe user explicitly requested a "${typeDef.label}" (${typeDef.category}).\nStructure the response strictly as a ${typeDef.label}.\n`;
        // Add specific hints based on category
        if (typeDef.category === 'Social Posts') {
          contentTypeInstruction += "Include relevant hashtags and keep it concise/platform-appropriate.\n";
        } else if (typeDef.category === 'Scripts') {
          contentTypeInstruction += "Include scene/segment headers and spoken lines. Use a conversational tone.\n";
        } else if (typeDef.category === 'Articles & Blogs') {
          contentTypeInstruction += "Use clear headings, structured paragraphs, and an educational tone.\n";
        } else if (typeDef.category === 'Copywriting') {
          contentTypeInstruction += "Use persuasive language, strong hooks, and clear calls to action.\n";
        } else if (typeDef.category === 'Technical & Professional') {
          contentTypeInstruction += "Use formal language, objective tone, and precise terminology.\n";
        }
      }
    }

    const prompt = `You are a helpful AI creative assistant.
    ${profileContext}
    ${contentTypeInstruction}
    ${historyContext}
    User Input: "${input}"
    ${urlContext ? `\nAdditional Context from URLs:\n${urlContext}` : ""}
    
    Task: Generate a comprehensive, engaging, and conversational response based on the user's input.
    - If there is chat history, treat the User Input as a follow-up instruction to refine, expand, or modify the previous context.
    - If the user asks for ideas, provide them in a fluid, well-structured format (not just a raw list).
    - If the user asks to write something, write a high-quality draft.
    - Use Markdown formatting (headings, bullet points, bold text) to make it readable.
    - Ensure the tone matches the active profile settings.
    
    Return only the response text.`;

    const result = await withTimeout(model.generateContent(prompt), 15000);
    const response = result.response;

    // Check if there's a response before trying to get text
    if (!response) {
      console.error("No response received from Gemini API");
      return "I'm sorry, I couldn't generate a response at this time. Please try again.";
    }

    return response.text();
  } catch (error) {
    console.error("Error generating chat response with Gemini:", error);
    return "I'm sorry, I encountered an error while generating the response. Please try again.";
  }
}

export async function expandContentBlock(
  content: string,
  blockType: string,
  canvasTitle?: string,
  activeProfile?: Profile | null,
  contextBlocks?: { type: string; content: string }[],
  contentTypeId?: string,
  mode: 'expand' | 'regenerate' = 'expand'
): Promise<string> {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
    console.error("GEMINI_API_KEY is not set for expandContentBlock");
    return content;
  }

  try {
    const profileContext = await buildProfileContext(activeProfile);

    // If content to expand is a URL, fetch it
    let contentToExpand = content;
    if (isValidUrl(content) && mode === 'expand') {
      const fetched = await fetchUrlContent(content);
      if (fetched) {
        contentToExpand = fetched;
        canvasTitle = canvasTitle || `Content from ${content}`;
      }
    }

    let contextPart = canvasTitle ? `Context: Writing a content piece titled "${canvasTitle}".\n` : "";

    // Look up content type if provided
    let contentTypeInstruction = "";
    if (contentTypeId) {
      const typeDef = CONTENT_TYPES.find(t => t.id === contentTypeId);
      if (typeDef) {
        contentTypeInstruction = `\nOUTPUT FORMATTING REQUIREMENT:\nThe user explicitly requested a "${typeDef.label}" (${typeDef.category}).\nStructure the response strictly as a ${typeDef.label}.\n`;
      }
    }

    if (contextBlocks && contextBlocks.length > 0) {
      contextPart += "\nExisting Content Blocks for Context:\n";
      contextBlocks.forEach((block, index) => {
        // Skip the current block if it happens to be in the list
        if (block.content === content) return;
        contextPart += `${index + 1}. [${block.type.toUpperCase()}]: ${block.content.substring(0, 200)}${block.content.length > 200 ? "..." : ""}\n`;
      });
      contextPart += "\n";
    }

    const taskDescription = mode === 'expand' 
      ? `EXPAND and ENHANCE the following ${blockType} content. Your goal is to increase the depth, detail, and length of the content SIGNIFICANTLY (at least 2x the original length).`
      : `REGENERATE and REWRITE the following ${blockType} content. Your goal is to provide a completely fresh linguistic take, using different vocabulary and sentence structures while maintaining the core message.`;

    const prompt = `${contextPart}
    Task: ${taskDescription}
    
    Original Content: "${contentToExpand}"
    
    ${profileContext}
    ${contentTypeInstruction}
    
    Specific Instructions:
    1. ${mode === 'expand' 
        ? 'EXPANSION: Add specific facts, statistics, examples, or detailed explanations. If it is a list, add more relevant items. If it is a paragraph, add more supporting sentences.' 
        : 'REGENERATION: Use a different tone or perspective. Change the phrasing entirely. Do not just swap a few words; rewrite the entire block from scratch.'}
    2. Maintain the original meaning but improve the impact and value.
    3. Ensure the tone aligns with the article title ("${canvasTitle || 'Untitled'}") and the surrounding context blocks.
    4. CRITICAL: Return ONLY the ${mode === 'expand' ? 'expanded' : 'regenerated'} content. Do NOT include any meta-commentary, intros, or outros.
    5. CRITICAL: Do NOT mention that you are an AI or describe your process.
    
    New Content:`;

    const result = await model.generateContent(prompt);
    const response = result.response;

    if (!response) {
      console.error("No response received from Gemini API in expandContentBlock");
      return content;
    }

    const text = response.text().trim();
    return text || content;
  } catch (error) {
    console.error("Error expanding/regenerating content block with Gemini:", error);
    // Return original content in case of error
    return content;
  }
}

export async function generateContentBlock(
  blockType: string,
  canvasTitle?: string,
  activeProfile?: Profile | null,
  contextBlocks?: { type: string; content: string }[],
  userInstruction?: string,
  contentTypeId?: string
): Promise<string> {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
    console.error("GEMINI_API_KEY is not set for generateContentBlock");
    return `[Generated ${blockType} content for "${canvasTitle}"]`;
  }

  try {
    const profileContext = await buildProfileContext(activeProfile);
    let contextPart = canvasTitle ? `Context: Writing a content piece titled "${canvasTitle}".\n` : "";

    if (contextBlocks && contextBlocks.length > 0) {
      contextPart += "\nExisting Content Blocks for Context:\n";
      contextBlocks.forEach((block, index) => {
        contextPart += `${index + 1}. [${block.type.toUpperCase()}]: ${block.content.substring(0, 200)}${block.content.length > 200 ? "..." : ""}\n`;
      });
      contextPart += "\n";
    }

    const instructionPart = userInstruction ? `User Instruction: ${userInstruction}\n` : "";

    // Look up content type if provided
    let contentTypeInstruction = "";
    if (contentTypeId) {
      const typeDef = CONTENT_TYPES.find(t => t.id === contentTypeId);
      if (typeDef) {
        contentTypeInstruction = `\nOUTPUT FORMATTING REQUIREMENT:\nThe user explicitly requested a "${typeDef.label}" (${typeDef.category}).\nStructure the response strictly as a ${typeDef.label}.\n`;
        // Add specific hints based on category
        if (typeDef.category === 'Social Posts') {
          contentTypeInstruction += "Include relevant hashtags and keep it concise/platform-appropriate.\n";
        } else if (typeDef.category === 'Scripts') {
          contentTypeInstruction += "Include scene/segment headers and spoken lines. Use a conversational tone.\n";
        } else if (typeDef.category === 'Articles & Blogs') {
          contentTypeInstruction += "Use clear headings, structured paragraphs, and an educational tone.\n";
        } else if (typeDef.category === 'Copywriting') {
          contentTypeInstruction += "Use persuasive language, strong hooks, and clear calls to action.\n";
        } else if (typeDef.category === 'Technical & Professional') {
          contentTypeInstruction += "Use formal language, objective tone, and precise terminology.\n";
        }
      }
    }

    const prompt = `${contextPart}${instructionPart}
    Task: Generate high-quality content for a ${blockType} block.
    
    ${profileContext}
    ${contentTypeInstruction}
    
    Instructions:
    1. Write engaging, professional, and valuable content that fits the overall article title ("${canvasTitle || 'Untitled'}").
    2. Ensure it aligns with the context of the other blocks provided above.
    3. If there is a "User Instruction", prioritize following it strictly.
    4. CRITICAL: Return ONLY the generated content. Do NOT include any meta-commentary or descriptions of what you wrote.
    
    Generated Content:`;

    const result = await model.generateContent(prompt);
    const response = result.response;

    if (!response) {
      console.error("No response received from Gemini API in generateContentBlock");
      return `[Generated ${blockType} content]`;
    }

    return response.text();
  } catch (error) {
    console.error("Error generating content block with Gemini:", error);
    return `[Error generating content]`;
  }
}

export async function suggestBestTime(
  content: string,
  context?: string,
  activeProfile?: Profile | null
): Promise<string> {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
    console.error("GEMINI_API_KEY is not set for suggestBestTime");
    return "09:00";
  }

  try {
    const profileContext = await buildProfileContext(activeProfile);
    const prompt = `Based on the content and context provided, suggest the best time to post this content for maximum engagement:
    Content: "${content}"
    Context: "${context || "General content for social media"}".${profileContext}

    Consider factors like typical engagement patterns, audience availability, etc.
    Return only the suggested time in HH:MM format (24-hour) without additional commentary.`;

    const result = await model.generateContent(prompt);
    const response = result.response;

    if (!response) {
      console.error("No response received from Gemini API in suggestBestTime");
      return "09:00";
    }

    return response.text().trim();
  } catch (error) {
    console.error("Error suggesting best time with Gemini:", error);
    // Return a default time in case of error
    return "09:00";
  }
}

export async function formatForChannel(
  content: string,
  channel: string,
  activeProfile?: Profile | null
): Promise<string> {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
    console.error("GEMINI_API_KEY is not set for formatForChannel");
    return content;
  }

  try {
    const profileContext = await buildProfileContext(activeProfile);
    const channelInstructions: Record<string, string> = {
      linkedin:
        "Format this content for LinkedIn. Keep it professional, engaging, and include relevant hashtags. 2000 character max.",
      x: "Format this content for X (Twitter). Keep it concise, engaging, and include relevant hashtags. 280 character max.",
      blog: "Format this content for a blog post. Include a title and structure it with paragraphs.",
    };

    const prompt = `${channelInstructions[channel] ||
      "Format this content appropriately for the specified channel."
      }:${profileContext}\n\n${content}`;

    const result = await model.generateContent(prompt);
    const response = result.response;

    if (!response) {
      console.error("No response received from Gemini API in formatForChannel");
      return content;
    }

    return response.text();
  } catch (error) {
    console.error("Error formatting for channel with Gemini:", error);
    // Return original content in case of error
    return content;
  }
}

export async function generateCampaignContent(
  topic: string,
  activeProfile?: Profile | null,
  count: number = 10,
  platform: string = 'linkedin',
  tone: string = 'professional',
  userInstruction: string = '',
  context: string = ''
): Promise<any[]> {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
    console.error("GEMINI_API_KEY is not set for generateCampaignContent");
    return Array(count).fill({ content: `Simulated post about ${topic}` });
  }

  try {
    const profileContext = await buildProfileContext(activeProfile);
    const platformInstructions = platform === 'x'
      ? "Twitter/X posts (max 280 chars)"
      : "LinkedIn posts (short-form, professional but engaging)";

    const prompt = `Task: Generate a campaign of ${count} distinct content pieces about "${topic}".
    Platform: ${platformInstructions}
    Tone: ${tone}
    ${userInstruction ? `Additional Instructions: ${userInstruction}` : ''}
    ${context ? `Context Material: ${context.substring(0, 15000)}` : ''}
    ${profileContext}

    Requirements:
    1. Create exactly ${count} distinct posts.
    2. Vary the angles (e.g., educational, controversial, personal story, question/engagement, promotional).
    3. Ensure the tone matches the profile.
    4. Return the result strictly as a valid JSON array of objects, where each object has a "content" field and a "type" field (e.g., "educational", "story", etc.).
    
    Example Output Format:
    [
      { "content": "Post 1 text...", "type": "educational" },
      { "content": "Post 2 text...", "type": "story" }
    ]

    DO NOT include markdown formatting like \`\`\`json \`\`\`. Just return the raw JSON string.`;

    const result = await model.generateContent(prompt);
    const response = result.response;

    if (!response) {
      throw new Error("No response from Gemini");
    }

    const text = response.text().trim();
    // Clean up markdown code blocks if present
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error generating campaign content:", error);
    return [];
  }
}

export async function generateCanvasBlocksFromChat(
  input: string,
  activeProfile?: Profile | null,
  history: any[] = [],
  files: { data: string; mimeType: string }[] = [],
  currentCanvas?: { blocks: any[], edges: any[] }
): Promise<{ 
  blocks: { id: string; type: string; content: string; title?: string; x?: number; y?: number; action?: 'create' | 'update' | 'delete' }[]; 
  edges: { source: string; target: string; label?: string; action?: 'create' | 'delete' }[];
  message: string 
}> {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
    return {
      message: "API Key missing. Cannot generate blocks.",
      blocks: [
        { id: "node-1", type: "heading", content: "AI Content Generation", action: 'create' },
        { id: "node-2", type: "paragraph", content: `This is a placeholder for: ${input}`, action: 'create' }
      ],
      edges: [
        { source: "node-1", target: "node-2", action: 'create' }
      ]
    };
  }

  try {
    const profileContext = await buildProfileContext(activeProfile);
    
    // Format history
    let historyContext = "";
    if (history && history.length > 0) {
      historyContext = "\n\nChat History:\n";
      history.forEach((msg) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        historyContext += `${role}: ${msg.content}\n`;
      });
    }

    let canvasContext = "";
    if (currentCanvas && currentCanvas.blocks.length > 0) {
      canvasContext = "\n\nCurrent Canvas State:\n";
      currentCanvas.blocks.forEach(b => {
        canvasContext += `- Block [ID: ${b.id}, Type: ${b.type}, Pos: (${Math.round(b.x)}, ${Math.round(b.y)})]: ${b.content.substring(0, 100)}${b.content.length > 100 ? '...' : ''}\n`;
      });
      if (currentCanvas.edges.length > 0) {
        canvasContext += "Existing Connections:\n";
        currentCanvas.edges.forEach(e => {
          canvasContext += `- ${e.source} -> ${e.target}${e.label ? ` (${e.label})` : ''}\n`;
        });
      }
    }

    const prompt = `You are an AI content architect. Your job is to transform user requests into a structured visual canvas of content blocks.
    ${profileContext}
    ${historyContext}
    ${canvasContext}
    
    User Request: "${input}"
    
    Instructions:
    1. Analyze the User Request against the Current Canvas State (if provided).
    2. You can:
       - CREATE new blocks (action: "create").
       - UPDATE existing blocks (action: "update"). Use the existing Block ID.
       - DELETE blocks (action: "delete").
    3. IMPORTANT: When UPDATE-ing, DO NOT change the (x, y) coordinates. Maintain their current position.
    4. NEW blocks should be placed to the RIGHT of the block they are connected to.
    5. Always create new blocks near the connected one (approx 400px to the right, with some vertical offset if there are multiple children).
    6. Layout Style: Left-to-Right branching tree.
    7. Return a JSON object with:
       - "blocks": Array of { "id": string, "type": string, "content": string, "x": number, "y": number, "action": "create" | "update" | "delete" }
       - "edges": Array of { "source": string, "target": string, "label": string (optional), "action": "create" | "delete" }
       - "message": A conversational summary message.
    
    Layout Tips (Left-to-Right):
    - Root node at (100, 400).
    - Level 2 nodes at (500, 200), (500, 600).
    - Level 3 nodes at (900, 100), (900, 300), etc.
    - Maintain at least 400px horizontal spacing and 300px vertical spacing.
    
    Return ONLY raw JSON.`;




    const parts: any[] = [{ text: prompt }];
    
    // Add files
    if (files && files.length > 0) {
      const SUPPORTED_MIME_TYPES = [
        'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
        'application/pdf', 'text/plain', 'text/csv', 'text/markdown',
        'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/aac', 'audio/ogg', 'audio/flac',
        'video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/webm'
      ];

      files.forEach(file => {
        let mimeType = file.mimeType;
        
        // Handle empty or generic MIME types
        if (!mimeType || mimeType === 'application/octet-stream') {
          // If we have a data URL, try to extract from there
          if (file.data.startsWith('data:')) {
            const match = file.data.match(/^data:([^;]+);base64,/);
            if (match) mimeType = match[1];
          }
        }

        if (SUPPORTED_MIME_TYPES.includes(mimeType)) {
          parts.push({
            inlineData: {
              data: file.data.includes(',') ? file.data.split(',')[1] : file.data,
              mimeType: mimeType
            }
          });
        } else {
          console.warn(`[Gemini] Skipping unsupported MIME type: ${mimeType}`);
        }
      });
    }


    const result = await withTimeout(model.generateContent(parts), 15000);
    const response = result.response;
    
    if (!response) {
      throw new Error("No response from Gemini API");
    }

    // Check if the response was blocked by safety filters
    if (response.promptFeedback?.blockReason) {
      return {
        message: `I'm sorry, I couldn't generate a response because it was blocked: ${response.promptFeedback.blockReason}`,
        blocks: [],
        edges: []
      };
    }

    const text = response.text().trim();
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      return JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON response:", cleanText);
      throw new Error("Failed to parse AI response as JSON");
    }
  } catch (error: any) {
    console.error("Error in generateCanvasBlocksFromChat:", error);
    
    // Check for specific error types
    const errorMessage = error.message || "Unknown error";
    if (errorMessage.includes("400") || errorMessage.includes("Bad Request")) {
      return {
        message: "The AI request failed (possibly due to an unsupported file type or too much data). Please try again with fewer files or different content.",
        blocks: [],
        edges: []
      };
    }

    return {
      message: "I'm sorry, I encountered an error while generating the blocks. Please try again.",
      blocks: [],
      edges: []
    };
  }

}

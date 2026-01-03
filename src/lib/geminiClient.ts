import { GoogleGenerativeAI } from "@google/generative-ai";
import { Profile } from "@/types/profile";
import { CONTENT_TYPES } from "@/types/content";
import { fetchUrlContent, extractUrls, isValidUrl } from "./urlUtils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

async function buildProfileContext(profile?: Profile | null): Promise<string> {
  if (!profile) return "";

  let context = `\n\nTarget Audience Profile:\n`;
  context += `- Name: ${profile.profile_name}\n`;
  if (profile.niche) context += `- Niche: ${profile.niche}\n`;

  if (profile.tone_config) {
    context += `- Tone Settings (1-10): Professionalism: ${profile.tone_config.professionalism}, Creativity: ${profile.tone_config.creativity}, Casualness: ${profile.tone_config.casualness}, Directness: ${profile.tone_config.directness}\n`;
  }

  if (profile.samples && profile.samples.length > 0) {
    const processedSamples = await Promise.all(profile.samples.map(async (s) => {
      if (isValidUrl(s)) {
        const content = await fetchUrlContent(s);
        return content ? `  "Style Sample from ${s}: ${content.substring(0, 2000)}..."` : `  "${s}"`;
      }
      return `  "${s}"`;
    }));
    context += `- Writing Style Samples:\n${processedSamples.join('\n')}\n`;
  }

  context += `\nIMPORTANT: Ensure the generated content strictly adheres to this profile's niche, tone, and style.\n`;
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

    const result = await model.generateContent(prompt);
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
  contentTypeId?: string
): Promise<string> {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
    console.error("GEMINI_API_KEY is not set for expandContentBlock");
    return `${content} - This is an expanded version with additional detail and context to make the content more comprehensive and valuable for the reader.`;
  }

  try {
    const profileContext = await buildProfileContext(activeProfile);

    // If content to expand is a URL, fetch it
    let contentToExpand = content;
    if (isValidUrl(content)) {
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

    if (contextBlocks && contextBlocks.length > 0) {
      contextPart += "\nExisting Content Blocks for Context:\n";
      contextBlocks.forEach((block, index) => {
        // Skip the current block if it happens to be in the list (though caller should filter it)
        if (block.content === content) return;
        contextPart += `${index + 1}. [${block.type.toUpperCase()}]: ${block.content.substring(0, 200)}${block.content.length > 200 ? "..." : ""}\n`;
      });
      contextPart += "\n";
    }

    const prompt = `${contextPart}Task: Expand the following ${blockType} block: "${contentToExpand}".${profileContext}${contentTypeInstruction}
    Instructions: Make it more detailed, engaging, and comprehensive while maintaining the original meaning. Ensure the tone fits the overall article title and aligns with the context of the other blocks provided above.
    Return only the expanded content without additional commentary.`;

    const result = await model.generateContent(prompt);
    const response = result.response;

    if (!response) {
      console.error("No response received from Gemini API in expandContentBlock");
      return `${content} - This is an expanded version with additional detail and context to make the content more comprehensive and valuable for the reader.`;
    }

    return response.text();
  } catch (error) {
    console.error("Error expanding content block with Gemini:", error);
    // Return fallback expansion in case of error
    return `${content} - This is an expanded version with additional detail and context to make the content more comprehensive and valuable for the reader.`;
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

    const prompt = `${contextPart}${instructionPart}Task: Generate content for a ${blockType} block.${profileContext}${contentTypeInstruction}
    Instructions: Write high-quality, engaging content that fits the overall article title and aligns with the context of the other blocks provided above.
    Return only the generated content without additional commentary.`;

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

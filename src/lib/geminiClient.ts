import { GoogleGenerativeAI } from "@google/generative-ai";
import { Profile } from "@/types/profile";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

function buildProfileContext(profile?: Profile | null): string {
  if (!profile) return "";

  let context = `\n\nTarget Audience Profile:\n`;
  context += `- Name: ${profile.profile_name}\n`;
  if (profile.niche) context += `- Niche: ${profile.niche}\n`;

  if (profile.tone_config) {
    context += `- Tone Settings (1-10): Professionalism: ${profile.tone_config.professionalism}, Creativity: ${profile.tone_config.creativity}, Casualness: ${profile.tone_config.casualness}, Directness: ${profile.tone_config.directness}\n`;
  }

  if (profile.samples && profile.samples.length > 0) {
    context += `- Writing Style Samples:\n${profile.samples.map(s => `  "${s}"`).join('\n')}\n`;
  }

  context += `\nIMPORTANT: Ensure the generated content strictly adheres to this profile's niche, tone, and style.\n`;
  return context;
}

export async function generateIdeas(input: string, activeProfile?: Profile | null): Promise<string[]> {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
    console.error("GEMINI_API_KEY is not set");
    const inputKeywords = input.split(' ').slice(0, 3).join(' ');
    return [
      `Understanding ${inputKeywords}`,
      `Getting Started with ${inputKeywords}`,
      `Best Practices for ${inputKeywords}`,
      `${inputKeywords}: A Beginner's Guide`,
      `Common Questions About ${inputKeywords}`,
    ];
  }

  try {
    const profileContext = buildProfileContext(activeProfile);
    const prompt = `Generate 5-10 content idea kernels based on the following input: "${input}".${profileContext}
    Each idea should be a concise title or hook that could be expanded into a full piece of content.
    Respond with only the ideas, one per line, without any other text.`;

    const result = await model.generateContent(prompt);
    const response = result.response;

    // Check if there's a response before trying to get text
    if (!response) {
      console.error("No response received from Gemini API");
      const inputKeywords = input.split(' ').slice(0, 3).join(' ');
      return [
        `Understanding ${inputKeywords}`,
        `Getting Started with ${inputKeywords}`,
        `Best Practices for ${inputKeywords}`,
        `${inputKeywords}: A Beginner's Guide`,
        `Common Questions About ${inputKeywords}`,
      ];
    }

    const text = response.text();

    // Split the response into individual ideas
    const ideas = text
      .split("\n")
      .map((idea: string) => idea.trim())
      .filter((idea: string) => idea.length > 0);

    return ideas;
  } catch (error) {
    console.error("Error generating ideas with Gemini:", error);
    // Return dynamic fallback ideas based on input
    const inputKeywords = input.split(' ').slice(0, 3).join(' ');
    return [
      `Understanding ${inputKeywords}`,
      `Getting Started with ${inputKeywords}`,
      `Best Practices for ${inputKeywords}`,
      `${inputKeywords}: A Beginner's Guide`,
      `Common Questions About ${inputKeywords}`,
    ];
  }
}

export async function expandContentBlock(
  content: string,
  blockType: string,
  canvasTitle?: string,
  activeProfile?: Profile | null,
  contextBlocks?: { type: string; content: string }[]
): Promise<string> {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
    console.error("GEMINI_API_KEY is not set for expandContentBlock");
    return `${content} - This is an expanded version with additional detail and context to make the content more comprehensive and valuable for the reader.`;
  }

  try {
    const profileContext = buildProfileContext(activeProfile);

    let contextPart = canvasTitle ? `Context: Writing a content piece titled "${canvasTitle}".\n` : "";

    if (contextBlocks && contextBlocks.length > 0) {
      contextPart += "\nExisting Content Blocks for Context:\n";
      contextBlocks.forEach((block, index) => {
        // Skip the current block if it happens to be in the list (though caller should filter it)
        if (block.content === content) return;
        contextPart += `${index + 1}. [${block.type.toUpperCase()}]: ${block.content.substring(0, 200)}${block.content.length > 200 ? "..." : ""}\n`;
      });
      contextPart += "\n";
    }

    const prompt = `${contextPart}Task: Expand the following ${blockType} block: "${content}".${profileContext}
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
  userInstruction?: string
): Promise<string> {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
    console.error("GEMINI_API_KEY is not set for generateContentBlock");
    return `[Generated ${blockType} content for "${canvasTitle}"]`;
  }

  try {
    const profileContext = buildProfileContext(activeProfile);
    let contextPart = canvasTitle ? `Context: Writing a content piece titled "${canvasTitle}".\n` : "";

    if (contextBlocks && contextBlocks.length > 0) {
      contextPart += "\nExisting Content Blocks for Context:\n";
      contextBlocks.forEach((block, index) => {
        contextPart += `${index + 1}. [${block.type.toUpperCase()}]: ${block.content.substring(0, 200)}${block.content.length > 200 ? "..." : ""}\n`;
      });
      contextPart += "\n";
    }

    const instructionPart = userInstruction ? `User Instruction: ${userInstruction}\n` : "";

    const prompt = `${contextPart}${instructionPart}Task: Generate content for a ${blockType} block.${profileContext}
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
    const profileContext = buildProfileContext(activeProfile);
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
    const profileContext = buildProfileContext(activeProfile);
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

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export async function generateIdeas(input: string): Promise<string[]> {
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
    const prompt = `Generate 5-10 content idea kernels based on the following input: "${input}".
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
  blockType: string
): Promise<string> {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
    console.error("GEMINI_API_KEY is not set for expandContentBlock");
    return `${content} - This is an expanded version with additional detail and context to make the content more comprehensive and valuable for the reader.`;
  }

  try {
    const prompt = `Expand the following content ${blockType}: "${content}".
    Make it more detailed, engaging, and comprehensive while maintaining the original meaning.
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

export async function suggestBestTime(
  content: string,
  context?: string
): Promise<string> {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
    console.error("GEMINI_API_KEY is not set for suggestBestTime");
    return "09:00";
  }

  try {
    const prompt = `Based on the content and context provided, suggest the best time to post this content for maximum engagement:
    Content: "${content}"
    Context: "${context || "General content for social media"}".

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
  channel: string
): Promise<string> {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
    console.error("GEMINI_API_KEY is not set for formatForChannel");
    return content;
  }

  try {
    const channelInstructions: Record<string, string> = {
      linkedin:
        "Format this content for LinkedIn. Keep it professional, engaging, and include relevant hashtags. 2000 character max.",
      x: "Format this content for X (Twitter). Keep it concise, engaging, and include relevant hashtags. 280 character max.",
      blog: "Format this content for a blog post. Include a title and structure it with paragraphs.",
    };

    const prompt = `${
      channelInstructions[channel] ||
      "Format this content appropriately for the specified channel."
    }:\n\n${content}`;

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

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    maxOutputTokens: 30,
    temperature: 0.2,
  },
});

function cleanContinuation(text: string): string {
  let cleaned = text
    .replace(/^```[a-z]*\n?/gi, "")
    .replace(/\n?```$/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\r\n]+/g, " ")
    .trim();

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  const sentences = cleaned.split(/(?<=[.?!])\s+/);
  if (sentences.length > 2) {
    cleaned = sentences.slice(0, 2).join(" ");
  }

  if (cleaned.length > 120) {
    cleaned = cleaned.slice(0, 120).replace(/\s+\S*$/, "...");
  }

  if (cleaned && !/^[,.;:!?\s]/.test(cleaned)) {
    cleaned = ` ${cleaned}`;
  }

  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, documentTitle } = body;

    if (!text || typeof text !== "string" || text.trim().length < 3) {
      return NextResponse.json({ success: false, error: "Insufficient context" });
    }

    const snippet = text.slice(-300);

    // 1. If Research Agent is configured and active, attempt fast query with 300ms timeout
    const agentUrl = process.env.RESEARCH_AGENT_URL;
    const apiKey = process.env.RESEARCH_AGENT_API_KEY;
    const clientId = process.env.RESEARCH_AGENT_CLIENT_ID;

    if (agentUrl && apiKey && clientId) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 300);

        const raRes = await fetch(`${agentUrl.replace(/\/$/, "")}/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": apiKey,
          },
          body: JSON.stringify({
            brief: `Continue this thought naturally with 1 short sentence: "${snippet}"`,
            client_id: clientId,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (raRes.ok) {
          const data = await raRes.json();
          if (data?.draft) {
            const cleaned = cleanContinuation(data.draft);
            if (cleaned.trim().length > 0) {
              return NextResponse.json({
                success: true,
                result: cleaned,
                source: "research_agent",
              });
            }
          }
        }
      } catch {
        // Fallback immediately without blocking
      }
    }

    // 2. High-speed Fallback / Primary: Gemini 2.0 Flash (~250ms latency)
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: true,
        result: " and create impactful experiences for your audience.",
        source: "gemini_fallback",
      });
    }

    const prompt = `You are a real-time inline ghostwriter and autocomplete engine for a writing editor.
${documentTitle ? `Document: "${documentTitle}"` : ""}

Task: Complete the thought naturally with ONLY the immediate next 1-2 phrases or short sentence (8 to 15 words max).

Strict Rules:
- Return ONLY the continuation text.
- Do NOT repeat the input text.
- Do NOT output HTML, markdown, quotes, or conversational intros/outros.
- Must connect smoothly to the preceding text.

Preceding text:
"...${snippet}"`;

    const response = await model.generateContent(prompt);
    const rawOutput = response.response.text();
    const result = cleanContinuation(rawOutput);

    return NextResponse.json({
      success: true,
      result,
      source: "gemini_fallback",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate autocomplete" },
      { status: 500 }
    );
  }
}

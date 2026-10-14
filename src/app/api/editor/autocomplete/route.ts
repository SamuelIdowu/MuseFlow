import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiApiKey } from "@/lib/geminiClient";

// Circuit breaker for Research Agent to avoid adding 300ms lag per keystroke when offline
let lastResearchAgentFailure = 0;
const AGENT_COOLDOWN_MS = 30000; // 30s cooldown before retrying an offline agent

function cleanContinuation(text: string, precedingSnippet: string = ""): string {
  let cleaned = text
    .replace(/^```[a-z]*\n?/gi, "")
    .replace(/\n?```$/gi, "")
    .replace(/^(Continuation|Completion|Suggestion|Here is[^:]*):\s*/i, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\r\n]+/g, " ")
    .trim();

  // Strip wrapping quotes
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Remove any trailing quote or double quote left by the model
  cleaned = cleaned.replace(/["']+$/g, "").trim();

  // Limit to 1-2 sentences max
  const sentences = cleaned.split(/(?<=[.?!])\s+/);
  if (sentences.length > 2) {
    cleaned = sentences.slice(0, 2).join(" ");
  }

  if (cleaned.length > 100) {
    cleaned = cleaned.slice(0, 100).replace(/\s+\S*$/, "...");
  }

  // Add leading space if preceding snippet doesn't end with whitespace and continuation starts with word/number
  if (cleaned && !precedingSnippet.endsWith(" ") && !/^[,.;:!?\s]/.test(cleaned)) {
    cleaned = ` ${cleaned}`;
  }

  return cleaned;
}

export async function POST(req: NextRequest) {
  let snippet = "";
  try {
    const body = await req.json();
    const { text, prefix, suffix, documentTitle } = body;

    const rawPrefix = (typeof prefix === "string" ? prefix : text) || "";
    const rawSuffix = typeof suffix === "string" ? suffix : "";

    if (!rawPrefix || rawPrefix.trim().length < 3) {
      return NextResponse.json({ success: true, result: "" });
    }

    snippet = rawPrefix.slice(-300);
    const suffixSnippet = rawSuffix.slice(0, 150).trim();

    // 1. If Research Agent is configured and alive, attempt fast query with 300ms timeout
    const agentUrl = process.env.RESEARCH_AGENT_URL;
    const apiKey = process.env.RESEARCH_AGENT_API_KEY;
    const clientId = process.env.RESEARCH_AGENT_CLIENT_ID;

    const isAgentCoolingDown = Date.now() - lastResearchAgentFailure < AGENT_COOLDOWN_MS;

    if (agentUrl && apiKey && clientId && !isAgentCoolingDown) {
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
            const cleaned = cleanContinuation(data.draft, snippet);
            if (cleaned.trim().length > 0) {
              return NextResponse.json({
                success: true,
                result: cleaned,
                source: "research_agent",
              });
            }
          }
        } else {
          lastResearchAgentFailure = Date.now();
        }
      } catch {
        lastResearchAgentFailure = Date.now();
        // Fallback immediately to Gemini without blocking
      }
    }

    // 2. High-speed Primary Autocomplete: Gemini 3.5 Flash Lite (<180ms latency)
    const activeKey = getGeminiApiKey();
    if (!activeKey) {
      return NextResponse.json({
        success: true,
        result: "",
        source: "none",
      });
    }

    const prompt = `You are a real-time inline ghostwriter and autocomplete engine in a professional document editor.
Your task is to write the immediate next 3 to 10 words that seamlessly continue the user's unfinished thought at the cursor.

Strict Rules:
1. Output ONLY the raw continuation words.
2. Never repeat any words from before the cursor.
3. Do NOT output quotes, markdown, explanations, or conversational intros/outros.
4. If the text before cursor ends in a space, start directly with the next word.
5. If text after cursor is provided, smoothly bridge toward it without repeating words.
6. Make sure the continuation is grammatically seamless, fluent, and contextually grounded.

${documentTitle ? `Document Context: "${documentTitle}"\n` : ""}${suffixSnippet ? `Text after cursor:\n"${suffixSnippet}"\n` : ""}Text before cursor:
"${snippet}"

Continuation:`;

    const genAI = new GoogleGenerativeAI(activeKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      generationConfig: {
        maxOutputTokens: 60,
        temperature: 0.2,
      },
    });
    const response = await model.generateContent(prompt);

    const rawOutput = response.response.text();
    const result = cleanContinuation(rawOutput, snippet);

    return NextResponse.json({
      success: true,
      result,
      source: "gemini_fallback",
    });
  } catch (error: any) {
    console.error("[Autocomplete] Error generating continuation:", error);

    // Silent fallback: Never return canned random sentences which produce grammatically broken text.
    // Professional autocomplete engines (Copilot, Cursor) fail silently to preserve editor trust.
    return NextResponse.json({
      success: true,
      result: "",
      source: "none",
    });
  }
}

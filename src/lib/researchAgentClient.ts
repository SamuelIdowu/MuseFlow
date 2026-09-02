/**
 * Research Agent Client
 * Centralized API adapter connecting Museflow to the Research Agent backend service.
 */

export interface SourceCitation {
  type: "kb" | "web";
  excerpt: string;
  url?: string;
  document_id?: string;
  title?: string;
}

export interface GenerationResponse {
  request_id: string;
  draft: string;
  sources: SourceCitation[];
  model_used: string;
  status: string;
}

export interface BYOKConfig {
  llm_provider: "google" | "openai" | "anthropic";
  llm_model: string;
  llm_api_key: string;
}

export interface BYOKStatusResponse {
  llm_provider: string;
  llm_model: string;
  byok_configured: boolean;
}

const AGENT_BASE_URL = process.env.NEXT_PUBLIC_RESEARCH_AGENT_URL || "http://localhost:8000";
const AGENT_API_KEY = process.env.RESEARCH_AGENT_API_KEY || "dev_tenant_key";

/**
 * Creates or synchronizes a Brand Voice Profile in Research Agent.
 * In Research Agent, a 'client' corresponds 1-to-1 with a Museflow Profile.
 */
export async function syncProfileToAgent(profileId: string, profileName: string, toneDescription?: string): Promise<boolean> {
  try {
    const res = await fetch(`${AGENT_BASE_URL}/clients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": AGENT_API_KEY,
      },
      body: JSON.stringify({
        id: profileId,
        name: profileName,
      }),
    });

    if (res.status === 409 || res.ok) {
      // If profile already exists or was created, update voice profile details if provided
      if (toneDescription) {
        await fetch(`${AGENT_BASE_URL}/clients/${profileId}/voice-profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": AGENT_API_KEY,
          },
          body: JSON.stringify({
            tone: toneDescription,
            pov: "first-person",
          }),
        });
      }
      return true;
    }
    return false;
  } catch (error) {
    console.warn("Failed to sync profile to Research Agent:", error);
    return false;
  }
}

/**
 * Configures Bring-Your-Own-Key (BYOK) for a specific profile.
 */
export async function configureProfileBYOK(profileId: string, config: BYOKConfig): Promise<BYOKStatusResponse> {
  const res = await fetch(`${AGENT_BASE_URL}/clients/${profileId}/byok`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": AGENT_API_KEY,
    },
    body: JSON.stringify(config),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to configure BYOK" }));
    throw new Error(errorData.detail || "Failed to configure BYOK");
  }

  return res.json();
}

/**
 * Removes BYOK for a profile and restores the Platform Default Model.
 */
export async function removeProfileBYOK(profileId: string): Promise<void> {
  const res = await fetch(`${AGENT_BASE_URL}/clients/${profileId}/byok`, {
    method: "DELETE",
    headers: {
      "X-Api-Key": AGENT_API_KEY,
    },
  });

  if (!res.ok && res.status !== 404) {
    throw new Error("Failed to reset BYOK configuration");
  }
}

/**
 * Gets the current BYOK status for a profile.
 */
export async function getProfileBYOKStatus(profileId: string): Promise<BYOKStatusResponse> {
  try {
    const res = await fetch(`${AGENT_BASE_URL}/clients/${profileId}/byok`, {
      headers: {
        "X-Api-Key": AGENT_API_KEY,
      },
    });

    if (!res.ok) {
      return { llm_provider: "", llm_model: "", byok_configured: false };
    }

    return res.json();
  } catch {
    return { llm_provider: "", llm_model: "", byok_configured: false };
  }
}

/**
 * Streams content generation from Research Agent into TipTap or Canvas.
 */
export async function streamGenerationFromAgent(
  profileId: string,
  brief: string,
  callbacks: {
    onDelta: (token: string) => void;
    onSources?: (sources: SourceCitation[]) => void;
    onDone?: (fullDraft: string) => void;
    onError?: (error: Error) => void;
  }
): Promise<void> {
  try {
    const response = await fetch(`${AGENT_BASE_URL}/generate?stream=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": AGENT_API_KEY,
      },
      body: JSON.stringify({
        client_id: profileId,
        brief,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Generation failed (${response.status}): ${err}`);
    }

    if (!response.body) {
      throw new Error("ReadableStream not supported in response");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.trim() || line.startsWith(":")) continue; // Skip heartbeat pings

        if (line.startsWith("0:")) {
          // Token delta: 0:"token string"
          try {
            const token = JSON.parse(line.slice(2));
            fullText += token;
            callbacks.onDelta(token);
          } catch {
            // Ignore parse errors on raw tokens
          }
        } else if (line.startsWith("8:")) {
          // Sources payload: 8:[{...}, {...}]
          try {
            const sources = JSON.parse(line.slice(2));
            if (Array.isArray(sources) && callbacks.onSources) {
              callbacks.onSources(sources);
            }
          } catch {
            // Ignore parse error on sources
          }
        }
      }
    }

    if (callbacks.onDone) {
      callbacks.onDone(fullText);
    }
  } catch (err: any) {
    if (callbacks.onError) {
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    } else {
      throw err;
    }
  }
}

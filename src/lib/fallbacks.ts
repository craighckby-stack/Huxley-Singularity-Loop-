/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/lib/fallbacks.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { Chunk } from '../types';

interface FallbackConfig {
  anthropicKey?: string;
  cerebrasKey?: string;
  grokKey?: string;
}

interface AIProxyRequestPayload {
  messages: Array<{ role: string; content: string }>;
}

interface AnthropicResponseContent {
  text?: string;
}

interface AnthropicResponseBody {
  content?: AnthropicResponseContent[];
}

interface CerebrasChoiceMessage {
  content?: string;
}

interface CerebrasChoice {
  message?: CerebrasChoiceMessage;
}

interface CerebrasResponseBody {
  choices?: CerebrasChoice[];
}

const MAX_PROMPT_LENGTH = 100000;
const MAX_RESPONSE_LENGTH = 1048576;

const validateAndSanitizePrompt = (prompt: string): string => {
  if (typeof prompt !== 'string') {
    throw new Error("INVALID_PROMPT: Prompt must be a string.");
  }
  if (prompt.length === 0) {
    throw new Error("INVALID_PROMPT: Prompt cannot be empty.");
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error("INVALID_PROMPT: Prompt exceeds maximum permitted length.");
  }
  return prompt;
};

const validateChunkArray = (data: unknown): Chunk[] => {
  if (!Array.isArray(data)) {
    console.warn("[Fallback] Parsed response is not an array");
    return [];
  }
  const validatedChunks: Chunk[] = [];
  for (const item of data) {
    if (item && typeof item === 'object') {
      validatedChunks.push(item as Chunk);
    }
  }
  return validatedChunks;
};

const parseAIResponse = (text: string): Chunk[] => {
  try {
    if (typeof text !== 'string') {
      return [];
    }
    if (text.length > MAX_RESPONSE_LENGTH) {
      console.error("Response text exceeds maximum length.");
      return [];
    }
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');
    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
      const parsedJson = JSON.parse(text.substring(startIndex, endIndex + 1));
      return validateChunkArray(parsedJson);
    }
    const parsedJsonFallback = JSON.parse(text);
    return validateChunkArray(parsedJsonFallback);
  } catch (error) {
    console.error("Failed to parse fallback AI response:", error);
    return [];
  }
};

const requestAIProxy = async (endpoint: string, prompt: string, suffix: string): Promise<any | null> => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `${prompt}\n\n${suffix}` }]
      } as AIProxyRequestPayload)
    });

    const rawText = await response.text();
    if (rawText.length > MAX_RESPONSE_LENGTH) {
      throw new Error("RESPONSE_TOO_LARGE: Response exceeds size bounds.");
    }

    const data = JSON.parse(rawText);
    if (!response.ok) {
      console.warn(`[Fallback] Endpoint ${endpoint} returned error:`, data);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`[Fallback] Request to ${endpoint} failed:`, error);
    return null;
  }
};

export const callFallbackAI = async (prompt: string, config: FallbackConfig): Promise<Chunk[]> => {
  const sanitizedPrompt = validateAndSanitizePrompt(prompt);

  // 1. Try Anthropic First
  console.log("[Fallback] Attempting Anthropic via Proxy...");
  const anthropicData = (await requestAIProxy(
    '/api/ai/anthropic',
    sanitizedPrompt,
    "RESPONSE MUST BE A JSON ARRAY OF CHUNKS. NO EXPLANATION."
  )) as AnthropicResponseBody | null;

  if (
    anthropicData?.content &&
    Array.isArray(anthropicData.content) &&
    anthropicData.content[0] &&
    typeof anthropicData.content[0].text === 'string'
  ) {
    return parseAIResponse(anthropicData.content[0].text);
  } else if (anthropicData) {
    console.warn("[Fallback] Anthropic returned invalid format:", anthropicData);
  }

  // 2. Try Cerebras Second
  console.log("[Fallback] Attempting Cerebras via Proxy...");
  const cerebrasData = (await requestAIProxy(
    '/api/ai/cerebras',
    sanitizedPrompt,
    "RESPONSE MUST BE A JSON ARRAY. RETURN ONLY JSON."
  )) as CerebrasResponseBody | null;

  if (
    cerebrasData?.choices &&
    Array.isArray(cerebrasData.choices) &&
    cerebrasData.choices[0]?.message &&
    typeof cerebrasData.choices[0].message.content === 'string'
  ) {
    return parseAIResponse(cerebrasData.choices[0].message.content);
  } else if (cerebrasData) {
    console.warn("[Fallback] Cerebras returned invalid format:", cerebrasData);
  }

  // 3. Try Grok Third
  console.log("[Fallback] Attempting Grok via Proxy...");
  const grokData = (await requestAIProxy(
    '/api/ai/grok',
    sanitizedPrompt,
    "RESPONSE MUST BE A JSON ARRAY. RETURN ONLY JSON."
  )) as CerebrasResponseBody | null;

  if (
    grokData?.choices &&
    Array.isArray(grokData.choices) &&
    grokData.choices[0]?.message &&
    typeof grokData.choices[0].message.content === 'string'
  ) {
    return parseAIResponse(grokData.choices[0].message.content);
  } else if (grokData) {
    console.warn("[Fallback] Grok returned invalid format:", grokData);
  }

  throw new Error("ALL_MODELS_EXHAUSTED: Gemini failed and no fallbacks succeeded or were configured on server.");
};

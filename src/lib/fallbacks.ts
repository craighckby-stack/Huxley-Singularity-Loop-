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

export const callFallbackAI = async (prompt: string, config: FallbackConfig): Promise<Chunk[]> => {
  const sanitizedPrompt = validateAndSanitizePrompt(prompt);

  // Try Anthropic First
  try {
    console.log("[Fallback] Attempting Anthropic via Proxy...");
    const response = await fetch('/api/ai/anthropic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: sanitizedPrompt + "\n\nRESPONSE MUST BE A JSON ARRAY OF CHUNKS. NO EXPLANATION." }]
      })
    });
    const rawText = await response.text();
    if (rawText.length > MAX_RESPONSE_LENGTH) {
      throw new Error("RESPONSE_TOO_LARGE: Response exceeds size bounds.");
    }
    const data = JSON.parse(rawText);
    if (response.ok && data.content && data.content[0] && typeof data.content[0].text === 'string') {
      return parseAIResponse(data.content[0].text);
    }
    console.warn("[Fallback] Anthropic returned error or invalid format:", data);
  } catch (e) {
    console.error("[Fallback] Anthropic proxy failed:", e);
  }

  // Try Cerebras Second
  try {
    console.log("[Fallback] Attempting Cerebras via Proxy...");
    const response = await fetch('/api/ai/cerebras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: sanitizedPrompt + "\n\nRESPONSE MUST BE A JSON ARRAY. RETURN ONLY JSON." }]
      })
    });
    const rawText = await response.text();
    if (rawText.length > MAX_RESPONSE_LENGTH) {
      throw new Error("RESPONSE_TOO_LARGE: Response exceeds size bounds.");
    }
    const data = JSON.parse(rawText);
    if (response.ok && data.choices && data.choices[0] && data.choices[0].message && typeof data.choices[0].message.content === 'string') {
      return parseAIResponse(data.choices[0].message.content);
    }
    console.warn("[Fallback] Cerebras returned error or invalid format:", data);
  } catch (e) {
    console.error("[Fallback] Cerebras proxy failed:", e);
  }

  // Try Grok Third
  try {
    console.log("[Fallback] Attempting Grok via Proxy...");
    const response = await fetch('/api/ai/grok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: sanitizedPrompt + "\n\nRESPONSE MUST BE A JSON ARRAY. RETURN ONLY JSON." }]
      })
    });
    const rawText = await response.text();
    if (rawText.length > MAX_RESPONSE_LENGTH) {
      throw new Error("RESPONSE_TOO_LARGE: Response exceeds size bounds.");
    }
    const data = JSON.parse(rawText);
    if (response.ok && data.choices && data.choices[0] && data.choices[0].message && typeof data.choices[0].message.content === 'string') {
      return parseAIResponse(data.choices[0].message.content);
    }
    console.warn("[Fallback] Grok returned error or invalid format:", data);
  } catch (e) {
    console.error("[Fallback] Grok proxy failed:", e);
  }

  throw new Error("ALL_MODELS_EXHAUSTED: Gemini failed and no fallbacks succeeded or were configured on server.");
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
    // Basic cleaning to find JSON array
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1 && start < end) {
      const parsed = JSON.parse(text.substring(start, end + 1));
      return validateChunkArray(parsed);
    }
    const parsed = JSON.parse(text);
    return validateChunkArray(parsed);
  } catch (e) {
    console.error("Failed to parse fallback AI response:", e);
    return [];
  }
};

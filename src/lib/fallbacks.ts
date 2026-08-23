
import { Chunk } from '../types';

interface FallbackConfig {
  anthropicKey?: string;
  cerebrasKey?: string;
  grokKey?: string;
}

export const callFallbackAI = async (prompt: string, config: FallbackConfig): Promise<Chunk[]> => {
  // Try Anthropic First
  try {
    console.log("[Fallback] Attempting Anthropic via Proxy...");
    const response = await fetch('/api/ai/anthropic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt + "\n\nRESPONSE MUST BE A JSON ARRAY OF CHUNKS. NO EXPLANATION." }]
      })
    });
    const data = await response.json();
    if (response.ok && data.content && data.content[0]) {
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
        messages: [{ role: 'user', content: prompt + "\n\nRESPONSE MUST BE A JSON ARRAY. RETURN ONLY JSON." }]
      })
    });
    const data = await response.json();
    if (response.ok && data.choices && data.choices[0] && data.choices[0].message) {
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
        messages: [{ role: 'user', content: prompt + "\n\nRESPONSE MUST BE A JSON ARRAY. RETURN ONLY JSON." }]
      })
    });
    const data = await response.json();
    if (response.ok && data.choices && data.choices[0] && data.choices[0].message) {
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
    // Basic cleaning to find JSON array
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse fallback AI response:", text);
    return [];
  }
};

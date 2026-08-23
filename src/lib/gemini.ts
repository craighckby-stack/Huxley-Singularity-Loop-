import { GoogleGenAI, Type } from "@google/genai";
import { Chunk } from '../types';

// Exponential Backoff implementation as per EMG documentation
async function fetchWithExponentialBackoff<T>(apiCall: () => Promise<T>, maxRetries = 5, initialDelay = 1000): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      const delay = initialDelay * Math.pow(2, i) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Maximum retries exceeded");
}

export const analyzeRepoChunks = async (context: string, intentAnchor: string | null, runningArchetype: string | null, memoryContext: string): Promise<Chunk[]> => {
  const archetypeContext = runningArchetype 
    ? `RECURSIVE SYSTEM ARCHETYPE (Current Evolved Identity): \n${runningArchetype}`
    : "SYSTEM DEFAULT: HUXLEY_REASONING_ENGINE_V3.2";

  const prompt = `You are the HYPER-RECURSIVE HUXLEY ENGINE (v3.2). Your mission is to siphon, distill, and evolve code architecture across parallel repositories.

${archetypeContext}

Scan the provided REPOSITORY CONTEXT. Your goal is to identify "Elite Logical Nodes" (patterns, abstractions, or structural choices) that align with our Intent Anchor: "${intentAnchor || 'Autonomous Architectural Evolution'}".

DNA SIPHONING RULES:
1. QUANTUM EXTRACTION: Select 5-10 chunks that represent the highest-fidelity architectural logic of the repo.
2. CRITICAL AUDIT: Inspect every code block for "System Superiority". If a pattern in this repo is objectively superior to the current ${archetypeContext.includes('RECURSIVE SYSTEM ARCHETYPE') ? 'System Archetype' : 'HUXLEY Core'} (specifically in areas like: Firebase security rules, Async pipeline stability, GitHub abstraction layers, or Auth persistence), you MUST trigger a REBOOT.
3. REBOOT SIGNAL: Set "isCriticalUpgrade" to true and provide a detailed explanation of the logic override in the "mutation" field.

MEMORY CONTEXT (Previously siphoned logic to inform this perspective):
${memoryContext || "Memory Pool is currently empty. Baseline reasoning engaged."}

FORMATTING REQUIREMENTS:
- Response MUST be a JSON array of Chunks.
- Each Chunk Schema: { 
    "title": string, 
    "file": string, 
    "code": string, 
    "explanation": string, 
    "mutation": string, 
    "intentAlignmentScore": number, 
    "philosophyCheck": string, 
    "ccrrScore": number, 
    "suggestedBranchName": string,
    "isCriticalUpgrade": boolean
  }

REPOSITORY CONTEXT TO ANALYZE:
${context}
`;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        file: { type: Type.STRING },
        code: { type: Type.STRING },
        explanation: { type: Type.STRING },
        mutation: { type: Type.STRING },
        intentAlignmentScore: { type: Type.NUMBER },
        philosophyCheck: { type: Type.STRING },
        ccrrScore: { type: Type.NUMBER },
        suggestedBranchName: { type: Type.STRING },
        isCriticalUpgrade: { type: Type.BOOLEAN }
      },
      required: ["title", "file", "code", "explanation", "mutation", "intentAlignmentScore", "philosophyCheck", "ccrrScore", "suggestedBranchName"]
    }
  };

  const executePipeline = async (): Promise<Chunk[]> => {
    return await fetchWithExponentialBackoff(async () => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          // Grounding to reduce hallucination
          tools: [{ googleSearch: {} }]
        }
      });
      
      const text = response.text || "[]";
      let results: Chunk[] = [];
      try {
        results = JSON.parse(text);
      } catch (parseError) {
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
          results = JSON.parse(text.substring(start, end + 1));
        }
      }

      return results.filter(chunk => {
        const isStable = (chunk.ccrrScore || 0) >= 7.0; 
        const isAligned = (chunk.intentAlignmentScore || 0) >= 0.6; 
        return isStable && isAligned;
      });
    });
  };

  const timeoutPromise = new Promise<Chunk[]>((_, reject) => 
    setTimeout(() => reject(new Error("CIRCUIT_BREAKER_TRIP: Pipeline timed out (90s)")), 90000)
  );

  return Promise.race([executePipeline(), timeoutPromise]);
};

// NEW: Collective Intelligence Engine implementation from EMG Documentation
export interface PerspectiveReport {
  persona: string;
  perspective: string;
  sources?: { title: string; uri: string }[];
}

export const generatePerspective = async (personaName: string, promptModifier: string, topic: string): Promise<PerspectiveReport> => {
  return await fetchWithExponentialBackoff(async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing.");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Topic: ${topic}`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: promptModifier
      }
    });

    const text = response.text || "No perspective generated.";
    
    // Extract grounding sources
    const sources = response.candidates?.[0]?.groundingMetadata?.searchEntryPoint ? [{
      title: "Google Search Knowledge Base",
      uri: "https://www.google.com/search?q=" + encodeURIComponent(topic)
    }] : [];

    return {
      persona: personaName,
      perspective: text,
      sources
    };
  });
};

export const generateSynthesis = async (topic: string, perspectives: PerspectiveReport[]): Promise<{ report: string; sources: any[] }> => {
  return await fetchWithExponentialBackoff(async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing.");

    const perspectiveText = perspectives.map((p, i) => 
      `--- PERSPECTIVE ${i+1} (${p.persona}) ---\n${p.perspective}`
    ).join('\n\n');

    const synthesisPrompt = `You are the Huxley Collective Intelligence Synthesizer.
Analyze the following collection of ${perspectives.length} diverse architectural perspectives on: "${topic}".
Identify core themes, consensus, conflicts, and emergent ideas.
Do not summarize each one—synthesize a cohesive conclusion of ~250 lines.

Perspectives for Synthesis:
${perspectiveText}`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: synthesisPrompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const report = response.text || "Synthesis failed.";
    const allSources = perspectives.flatMap(p => p.sources || []);
    
    return { 
      report, 
      sources: Array.from(new Set(allSources.map(s => s.uri)))
        .map(uri => allSources.find(s => s.uri === uri))
    };
  });
};

/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/lib/gemini.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Chunk } from '../types';

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_INITIAL_DELAY_MS = 1000;
const PIPELINE_TIMEOUT_MS = 90000;
const MODEL_NAME = "gemini-3-flash-preview";

interface GroundingSource {
  title: string;
  uri: string;
}

export interface PerspectiveReport {
  persona: string;
  perspective: string;
  sources?: GroundingSource[];
}

export interface SynthesisResult {
  report: string;
  sources: GroundingSource[];
}

async function fetchWithExponentialBackoff<T>(
  apiCall: () => Promise<T>, 
  maxRetries = DEFAULT_MAX_RETRIES, 
  initialDelay = DEFAULT_INITIAL_DELAY_MS
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Maximum retries exceeded");
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return apiKey;
}

function parseChunkResults(text: string): Chunk[] {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }
    return [];
  }
}

const createRepoAnalysisPrompt = (
  context: string,
  intentAnchor: string | null,
  runningArchetype: string | null,
  memoryContext: string
): string => {
  const archetypeContext = runningArchetype 
    ? `RECURSIVE SYSTEM ARCHETYPE (Current Evolved Identity): \n${runningArchetype}`
    : "SYSTEM DEFAULT: HUXLEY_REASONING_ENGINE_V3.2";

  return `You are the HYPER-RECURSIVE HUXLEY ENGINE (v3.2). Your mission is to siphon, distill, and evolve code architecture across parallel repositories.

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
};

const repoAnalysisSchema = {
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
    required: [
      "title", 
      "file", 
      "code", 
      "explanation", 
      "mutation", 
      "intentAlignmentScore", 
      "philosophyCheck", 
      "ccrrScore", 
      "suggestedBranchName"
    ]
  }
};

export const analyzeRepoChunks = async (
  context: string, 
  intentAnchor: string | null, 
  runningArchetype: string | null, 
  memoryContext: string
): Promise<Chunk[]> => {
  const prompt = createRepoAnalysisPrompt(context, intentAnchor, runningArchetype, memoryContext);

  const executePipeline = async (): Promise<Chunk[]> => {
    return await fetchWithExponentialBackoff(async () => {
      const apiKey = getApiKey();
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: repoAnalysisSchema,
          tools: [{ googleSearch: {} }]
        }
      });
      
      const text = response.text || "[]";
      const results = parseChunkResults(text);

      return results.filter(chunk => {
        const isStable = (chunk.ccrrScore || 0) >= 7.0; 
        const isAligned = (chunk.intentAlignmentScore || 0) >= 0.6; 
        return isStable && isAligned;
      });
    });
  };

  const timeoutPromise = new Promise<Chunk[]>((_, reject) => 
    setTimeout(() => reject(new Error("CIRCUIT_BREAKER_TRIP: Pipeline timed out (90s)")), PIPELINE_TIMEOUT_MS)
  );

  return Promise.race([executePipeline(), timeoutPromise]);
};

export const generatePerspective = async (
  personaName: string, 
  promptModifier: string, 
  topic: string
): Promise<PerspectiveReport> => {
  return await fetchWithExponentialBackoff(async () => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Topic: ${topic}`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: promptModifier
      }
    });

    const text = response.text || "No perspective generated.";
    
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

export const generateSynthesis = async (
  topic: string, 
  perspectives: PerspectiveReport[]
): Promise<SynthesisResult> => {
  return await fetchWithExponentialBackoff(async () => {
    const apiKey = getApiKey();
    
    const perspectiveText = perspectives.map((p, index) => 
      `--- PERSPECTIVE ${index + 1} (${p.persona}) ---\n${p.perspective}`
    ).join('\n\n');

    const synthesisPrompt = `You are the Huxley Collective Intelligence Synthesizer.
Analyze the following collection of ${perspectives.length} diverse architectural perspectives on: "${topic}".
Identify core themes, consensus, conflicts, and emergent ideas.
Do not summarize each one—synthesize a cohesive conclusion of ~250 lines.

Perspectives for Synthesis:
${perspectiveText}`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: synthesisPrompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const report = response.text || "Synthesis failed.";
    const allSources = perspectives.flatMap(p => p.sources || []);
    const uniqueUris = Array.from(new Set(allSources.map(s => s.uri)));
    
    const sources = uniqueUris
      .map(uri => allSources.find(s => s.uri === uri))
      .filter((source): source is GroundingSource => source !== undefined);

    return { 
      report, 
      sources
    };
  });
};

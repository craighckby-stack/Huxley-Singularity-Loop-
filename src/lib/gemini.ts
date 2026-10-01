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

export interface GroundingSource {
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

function sanitizeInput(input: string, maxLength = 100000): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.slice(0, maxLength);
}

function validateUri(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function fetchWithExponentialBackoff<T>(
  apiCall: () => Promise<T>, 
  maxRetries = DEFAULT_MAX_RETRIES, 
  initialDelay = DEFAULT_INITIAL_DELAY_MS
): Promise<T> {
  const safeMaxRetries = Math.max(1, Math.min(maxRetries, 10));
  const safeInitialDelay = Math.max(100, Math.min(initialDelay, 10000));

  for (let attempt = 0; attempt < safeMaxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === safeMaxRetries - 1) {
        throw error;
      }
      const jitter = Math.random() * 1000;
      const delay = Math.min(safeInitialDelay * Math.pow(2, attempt) + jitter, 30000);
      await new Promise<void>(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Maximum retries exceeded");
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  return apiKey.trim();
}

function parseChunkResults(text: string): Chunk[] {
  if (typeof text !== 'string') {
    return [];
  }
  
  const sanitizedText = sanitizeInput(text, 500000);

  try {
    const parsed = JSON.parse(sanitizedText);
    if (Array.isArray(parsed)) {
      return parsed as Chunk[];
    }
  } catch {
    const startIndex = sanitizedText.indexOf('[');
    const endIndex = sanitizedText.lastIndexOf(']');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      try {
        const parsed = JSON.parse(sanitizedText.substring(startIndex, endIndex + 1));
        if (Array.isArray(parsed)) {
          return parsed as Chunk[];
        }
      } catch {
        return [];
      }
    }
    return [];
  }
  return [];
}

const createRepoAnalysisPrompt = (
  context: string,
  intentAnchor: string | null,
  runningArchetype: string | null,
  memoryContext: string
): string => {
  const safeContext = sanitizeInput(context, 50000);
  const safeIntent = intentAnchor ? sanitizeInput(intentAnchor, 500) : 'Autonomous Architectural Evolution';
  const safeArchetype = runningArchetype ? sanitizeInput(runningArchetype, 2000) : "SYSTEM DEFAULT: HUXLEY_REASONING_ENGINE_V3.2";
  const safeMemory = sanitizeInput(memoryContext, 10000);

  const archetypeContext = runningArchetype 
    ? `RECURSIVE SYSTEM ARCHETYPE (Current Evolved Identity): \n${safeArchetype}`
    : "SYSTEM DEFAULT: HUXLEY_REASONING_ENGINE_V3.2";

  return `You are the HYPER-RECURSIVE HUXLEY ENGINE (v3.2). Your mission is to siphon, distill, and evolve code architecture across parallel repositories.

${archetypeContext}

Scan the provided REPOSITORY CONTEXT. Your goal is to identify "Elite Logical Nodes" (patterns, abstractions, or structural choices) that align with our Intent Anchor: "${safeIntent}".

DNA SIPHONING RULES:
1. QUANTUM EXTRACTION: Select 5-10 chunks that represent the highest-fidelity architectural logic of the repo.
2. CRITICAL AUDIT: Inspect every code block for "System Superiority". If a pattern in this repo is objectively superior to the current ${archetypeContext.includes('RECURSIVE SYSTEM ARCHETYPE') ? 'System Archetype' : 'HUXLEY Core'} (specifically in areas like: Firebase security rules, Async pipeline stability, GitHub abstraction layers, or Auth persistence), you MUST trigger a REBOOT.
3. REBOOT SIGNAL: Set "isCriticalUpgrade" to true and provide a detailed explanation of the logic override in the "mutation" field.

MEMORY CONTEXT (Previously siphoned logic to inform this perspective):
${safeMemory || "Memory Pool is currently empty. Baseline reasoning engaged."}

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
${safeContext}
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
        const ccrr = typeof chunk.ccrrScore === 'number' && !isNaN(chunk.ccrrScore) ? chunk.ccrrScore : 0;
        const alignment = typeof chunk.intentAlignmentScore === 'number' && !isNaN(chunk.intentAlignmentScore) ? chunk.intentAlignmentScore : 0;
        
        const isStable = ccrr >= 7.0; 
        const isAligned = alignment >= 0.6; 
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
  const safePersona = sanitizeInput(personaName, 200);
  const safeModifier = sanitizeInput(promptModifier, 5000);
  const safeTopic = sanitizeInput(topic, 1000);

  return await fetchWithExponentialBackoff(async () => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Topic: ${safeTopic}`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: safeModifier
      }
    });

    const text = response.text || "No perspective generated.";
    
    const hasSearchEntry = response.candidates?.[0]?.groundingMetadata?.searchEntryPoint !== undefined;
    const searchUri = `https://www.google.com/search?q=${encodeURIComponent(safeTopic)}`;
    const sources = (hasSearchEntry && validateUri(searchUri)) ? [{
      title: "Google Search Knowledge Base",
      uri: searchUri
    }] : [];

    return {
      persona: safePersona,
      perspective: text,
      sources
    };
  });
};

export const generateSynthesis = async (
  topic: string, 
  perspectives: PerspectiveReport[]
): Promise<SynthesisResult> => {
  const safeTopic = sanitizeInput(topic, 1000);
  const safePerspectives = Array.isArray(perspectives) ? perspectives.slice(0, 50) : [];

  return await fetchWithExponentialBackoff(async () => {
    const apiKey = getApiKey();
    
    const perspectiveText = safePerspectives.map((p, index) => {
      const pName = sanitizeInput(p.persona, 100);
      const pText = sanitizeInput(p.perspective, 20000);
      return `--- PERSPECTIVE ${index + 1} (${pName}) ---\n${pText}`;
    }).join('\n\n');

    const synthesisPrompt = `You are the Huxley Collective Intelligence Synthesizer.
Analyze the following collection of ${safePerspectives.length} diverse architectural perspectives on: "${safeTopic}".
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
    const allSources = safePerspectives.flatMap(p => p.sources || []);
    const validSources = allSources.filter(s => s && typeof s.uri === 'string' && validateUri(s.uri));
    const uniqueUris = Array.from(new Set(validSources.map(s => s.uri)));
    
    const sources = uniqueUris
      .map(uri => validSources.find(s => s.uri === uri))
      .filter((source): source is GroundingSource => source !== undefined);

    return { 
      report, 
      sources
    };
  });
};

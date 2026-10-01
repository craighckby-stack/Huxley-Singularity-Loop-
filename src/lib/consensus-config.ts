/**
 * ARCHITECTURAL CONSENSUS WEIGHTING LOADER
 * Role: Computes dynamic agent consensus weights and multi-provider fallback priority chains based on environment parameters.
 * Integration: Imported by the Orchestrator/Agent Kernel to ensure resilient multi-model routing.
 * Siphoned Pattern: craighckby-stack/AI_Agent_OS consensus-weighting specifications
 */

export interface ProviderWeightMap {
  gemini: number;
  anthropic: number;
  deepseek: number;
  xai: number;
  cerebras: number;
  groq: number;
  local: number;
}

const DEFAULT_WEIGHTS: Readonly<ProviderWeightMap> = {
  gemini: 0.95,
  anthropic: 0.90,
  deepseek: 0.85,
  xai: 0.80,
  cerebras: 0.75,
  groq: 0.70,
  local: 0.60,
} as const;

/**
 * Validates, bounds-checks, and parses a numeric weight from an environment variable string.
 * Clamps output strictly between 0 and 1, defaulting to fallback if invalid or NaN.
 */
function parseAndClampWeight(value: string | undefined, fallback: number): number {
  if (value === undefined || value === null) {
    return fallback;
  }
  
  const trimmed = value.trim();
  if (trimmed === '') {
    return fallback;
  }
  
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  
  return Math.min(Math.max(parsed, 0), 1);
}

export function parseConsensusWeights(env: Record<string, string | undefined> = process.env): ProviderWeightMap {
  return {
    gemini: parseAndClampWeight(env.CONSENSUS_WEIGHT_GEMINI, DEFAULT_WEIGHTS.gemini),
    anthropic: parseAndClampWeight(env.CONSENSUS_WEIGHT_ANTHROPIC, DEFAULT_WEIGHTS.anthropic),
    deepseek: parseAndClampWeight(env.CONSENSUS_WEIGHT_DEEPSEEK, DEFAULT_WEIGHTS.deepseek),
    xai: parseAndClampWeight(env.CONSENSUS_WEIGHT_XAI, DEFAULT_WEIGHTS.xai),
    cerebras: parseAndClampWeight(env.CONSENSUS_WEIGHT_CEREBRAS, DEFAULT_WEIGHTS.cerebras),
    groq: parseAndClampWeight(env.CONSENSUS_WEIGHT_GROQ, DEFAULT_WEIGHTS.groq),
    local: parseAndClampWeight(env.CONSENSUS_WEIGHT_LOCAL, DEFAULT_WEIGHTS.local),
  };
}

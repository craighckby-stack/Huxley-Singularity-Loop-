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

/**
 * Validates, bounds-checks, and parses a numeric weight from an environment variable string.
 * Clamps output strictly between 0 and 1, defaulting to fallback if invalid or NaN.
 */
function parseAndClampWeight(value: string | undefined, fallback: number): number {
  if (value === undefined || value === null) {
    return fallback;
  }
  const trimmed = String(value).trim();
  if (trimmed === '') {
    return fallback;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
}

export function parseConsensusWeights(env: Record<string, string | undefined> = process.env): ProviderWeightMap {
  return {
    gemini: parseAndClampWeight(env.CONSENSUS_WEIGHT_GEMINI, 0.95),
    anthropic: parseAndClampWeight(env.CONSENSUS_WEIGHT_ANTHROPIC, 0.90),
    deepseek: parseAndClampWeight(env.CONSENSUS_WEIGHT_DEEPSEEK, 0.85),
    xai: parseAndClampWeight(env.CONSENSUS_WEIGHT_XAI, 0.80),
    cerebras: parseAndClampWeight(env.CONSENSUS_WEIGHT_CEREBRAS, 0.75),
    groq: parseAndClampWeight(env.CONSENSUS_WEIGHT_GROQ, 0.70),
    local: parseAndClampWeight(env.CONSENSUS_WEIGHT_LOCAL, 0.60),
  };
}

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

export function parseConsensusWeights(env: Record<string, string | undefined> = process.env): ProviderWeightMap {
  return {
    gemini: parseFloat(env.CONSENSUS_WEIGHT_GEMINI || '0.95'),
    anthropic: parseFloat(env.CONSENSUS_WEIGHT_ANTHROPIC || '0.90'),
    deepseek: parseFloat(env.CONSENSUS_WEIGHT_DEEPSEEK || '0.85'),
    xai: parseFloat(env.CONSENSUS_WEIGHT_XAI || '0.80'),
    cerebras: parseFloat(env.CONSENSUS_WEIGHT_CEREBRAS || '0.75'),
    groq: parseFloat(env.CONSENSUS_WEIGHT_GROQ || '0.70'),
    local: parseFloat(env.CONSENSUS_WEIGHT_LOCAL || '0.60'),
  };
}

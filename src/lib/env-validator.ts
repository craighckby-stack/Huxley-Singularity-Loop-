/**
 * ARCHITECTURAL SYSTEM ENVIRONMENT VALIDATOR & DIAGNOSTIC LOADER
 * Role: Validates runtime environment configuration against expected enterprise schemas,
 *       calculates diagnostic telemetry, and manages resilient multi-provider LLM fallbacks.
 * Integration: Consumed by kernel initialization and diagnostic execution loops.
 * Siphoned Pattern: craighckby-stack/AI_Agent_OS Concept/tessera-enterprise/lib/diagnostic-engine.ts
 */

export interface EnvConfig {
  geminiApiKey: string;
  appUrl: string;
  anthropicApiKey?: string;
  cerebrasApiKey?: string;
  xaiApiKey?: string;
  deepseekApiKey?: string;
  openaiApiKey?: string;
  groqApiKey?: string;
  ollamaBaseUrl?: string;
  consensusThreshold: number;
  zeroLeakSandboxEnabled: boolean;
  memoryPersistencePath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface ValidationResult {
  isValid: boolean;
  missingRequired: string[];
  warnings: string[];
  activeProviders: string[];
  config: Partial<EnvConfig>;
}

export function validateEnvironment(env: Record<string, string | undefined> = process.env): ValidationResult {
  const missingRequired: string[] = [];
  const warnings: string[] = [];
  const activeProviders: string[] = [];

  // Primary Required Keys
  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
    missingRequired.push('GEMINI_API_KEY');
  } else {
    activeProviders.push('gemini');
  }

  // Optional / Fallback Providers
  if (env.ANTHROPIC_API_KEY) activeProviders.push('anthropic');
  if (env.CEREBRAS_API_KEY) activeProviders.push('cerebras');
  if (env.XAI_API_KEY) activeProviders.push('xai');
  if (env.DEEPSEEK_API_KEY) activeProviders.push('deepseek');
  if (env.OPENAI_API_KEY) activeProviders.push('openai');
  if (env.GROQ_API_KEY) activeProviders.push('groq');
  if (env.OLLAMA_BASE_URL) activeProviders.push('ollama');

  // Client-Side Deprecation Audit
  if (env.VITE_ANTHROPIC_API_KEY || env.VITE_CEREBRAS_API_KEY || env.VITE_XAI_API_KEY) {
    warnings.push('Client-side VITE_* AI API keys detected. Migrating to server-proxy route is recommended.');
  }

  const config: Partial<EnvConfig> = {
    geminiApiKey: env.GEMINI_API_KEY,
    appUrl: env.APP_URL || 'http://localhost:3000',
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    cerebrasApiKey: env.CEREBRAS_API_KEY,
    xaiApiKey: env.XAI_API_KEY,
    deepseekApiKey: env.DEEPSEEK_API_KEY,
    openaiApiKey: env.OPENAI_API_KEY,
    groqApiKey: env.GROQ_API_KEY,
    ollamaBaseUrl: env.OLLAMA_BASE_URL || 'http://localhost:11434',
    consensusThreshold: parseFloat(env.CONSENSUS_THRESHOLD || '0.75'),
    zeroLeakSandboxEnabled: env.ZERO_LEAK_SANDBOX_ENABLED === 'true',
    memoryPersistencePath: env.MEMORY_PERSISTENCE_PATH || './memory',
    logLevel: (env.LOG_LEVEL as EnvConfig['logLevel']) || 'info',
  };

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    warnings,
    activeProviders,
    config,
  };
}

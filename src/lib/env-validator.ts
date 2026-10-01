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

// Defensive URL validation pattern to prevent malformed or injection vectors
const URL_REGEX = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
// Safe path validation pattern to restrict path traversal and injection
const PATH_REGEX = /^[a-zA-Z0-9_\-\./]+$/;

export function validateEnvironment(env: Record<string, string | undefined> = process.env): ValidationResult {
  const missingRequired: string[] = [];
  const warnings: string[] = [];
  const activeProviders: string[] = [];

  // Primary Required Keys with null/empty/placeholder string sanitation
  const geminiKey = env.GEMINI_API_KEY?.trim();
  if (!geminiKey || geminiKey === 'MY_GEMINI_API_KEY') {
    missingRequired.push('GEMINI_API_KEY');
  } else {
    activeProviders.push('gemini');
  }

  // Optional / Fallback Providers with sanitization
  if (env.ANTHROPIC_API_KEY?.trim()) activeProviders.push('anthropic');
  if (env.CEREBRAS_API_KEY?.trim()) activeProviders.push('cerebras');
  if (env.XAI_API_KEY?.trim()) activeProviders.push('xai');
  if (env.DEEPSEEK_API_KEY?.trim()) activeProviders.push('deepseek');
  if (env.OPENAI_API_KEY?.trim()) activeProviders.push('openai');
  if (env.GROQ_API_KEY?.trim()) activeProviders.push('groq');
  if (env.OLLAMA_BASE_URL?.trim()) activeProviders.push('ollama');

  // Client-Side Deprecation Audit
  if (env.VITE_ANTHROPIC_API_KEY || env.VITE_CEREBRAS_API_KEY || env.VITE_XAI_API_KEY) {
    warnings.push('Client-side VITE_* AI API keys detected. Migrating to server-proxy route is recommended.');
  }

  // URL bounds and validation check for APP_URL
  let appUrl = env.APP_URL?.trim() || 'http://localhost:3000';
  if (!URL_REGEX.test(appUrl)) {
    warnings.push('APP_URL is malformed or invalid; falling back to default.');
    appUrl = 'http://localhost:3000';
  }

  // URL bounds and validation check for OLLAMA_BASE_URL
  let ollamaBaseUrl = env.OLLAMA_BASE_URL?.trim() || 'http://localhost:11434';
  if (!URL_REGEX.test(ollamaBaseUrl)) {
    warnings.push('OLLAMA_BASE_URL is malformed or invalid; falling back to default.');
    ollamaBaseUrl = 'http://localhost:11434';
  }

  // Strict numeric bounds checking for consensus threshold
  let consensusThreshold = 0.75;
  if (env.CONSENSUS_THRESHOLD !== undefined) {
    const parsedThreshold = parseFloat(env.CONSENSUS_THRESHOLD);
    if (!isNaN(parsedThreshold) && isFinite(parsedThreshold)) {
      if (parsedThreshold < 0.0 || parsedThreshold > 1.0) {
        warnings.push('CONSENSUS_THRESHOLD must be between 0.0 and 1.0; clamping value.');
        consensusThreshold = Math.max(0.0, Math.min(1.0, parsedThreshold));
      } else {
        consensusThreshold = parsedThreshold;
      }
    } else {
      warnings.push('Invalid CONSENSUS_THRESHOLD format; falling back to 0.75.');
    }
  }

  // Path persistence validation to prevent path traversal
  let memoryPersistencePath = env.MEMORY_PERSISTENCE_PATH?.trim() || './memory';
  if (!PATH_REGEX.test(memoryPersistencePath)) {
    warnings.push('MEMORY_PERSISTENCE_PATH contains disallowed characters; falling back to default.');
    memoryPersistencePath = './memory';
  }

  // Log level validation
  const rawLogLevel = env.LOG_LEVEL?.trim();
  const validLogLevels: EnvConfig['logLevel'][] = ['debug', 'info', 'warn', 'error'];
  const logLevel: EnvConfig['logLevel'] = validLogLevels.includes(rawLogLevel as EnvConfig['logLevel'])
    ? (rawLogLevel as EnvConfig['logLevel'])
    : 'info';

  const config: Partial<EnvConfig> = {
    geminiApiKey: geminiKey,
    appUrl,
    anthropicApiKey: env.ANTHROPIC_API_KEY?.trim(),
    cerebrasApiKey: env.CEREBRAS_API_KEY?.trim(),
    xaiApiKey: env.XAI_API_KEY?.trim(),
    deepseekApiKey: env.DEEPSEEK_API_KEY?.trim(),
    openaiApiKey: env.OPENAI_API_KEY?.trim(),
    groqApiKey: env.GROQ_API_KEY?.trim(),
    ollamaBaseUrl,
    consensusThreshold,
    zeroLeakSandboxEnabled: env.ZERO_LEAK_SANDBOX_ENABLED === 'true',
    memoryPersistencePath,
    logLevel,
  };

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    warnings,
    activeProviders,
    config,
  };
}

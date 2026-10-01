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
const URL_PATTERN = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
// Safe path validation pattern to restrict path traversal and injection
const PATH_PATTERN = /^[a-zA-Z0-9_\-\./]+$/;

const DEFAULT_APP_URL = 'http://localhost:3000';
const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_CONSENSUS_THRESHOLD = 0.75;
const DEFAULT_MEMORY_PATH = './memory';
const DEFAULT_LOG_LEVEL: EnvConfig['logLevel'] = 'info';

const VALID_LOG_LEVELS: readonly EnvConfig['logLevel'][] = ['debug', 'info', 'warn', 'error'];

interface ProviderMapping {
  key: keyof EnvConfig;
  envKey: keyof NodeJS.ProcessEnv;
  providerName: string;
}

const OPTIONAL_PROVIDERS: readonly ProviderMapping[] = [
  { key: 'anthropicApiKey', envKey: 'ANTHROPIC_API_KEY', providerName: 'anthropic' },
  { key: 'cerebrasApiKey', envKey: 'CEREBRAS_API_KEY', providerName: 'cerebras' },
  { key: 'xaiApiKey', envKey: 'XAI_API_KEY', providerName: 'xai' },
  { key: 'deepseekApiKey', envKey: 'DEEPSEEK_API_KEY', providerName: 'deepseek' },
  { key: 'openaiApiKey', envKey: 'OPENAI_API_KEY', providerName: 'openai' },
  { key: 'groqApiKey', envKey: 'GROQ_API_KEY', providerName: 'groq' },
  { key: 'ollamaBaseUrl', envKey: 'OLLAMA_BASE_URL', providerName: 'ollama' },
];

function sanitizeUrl(rawUrl: string | undefined, defaultUrl: string, warningMessage: string, warnings: string[]): string {
  const trimmedUrl = rawUrl?.trim();
  if (!trimmedUrl) {
    return defaultUrl;
  }
  if (!URL_PATTERN.test(trimmedUrl)) {
    warnings.push(warningMessage);
    return defaultUrl;
  }
  return trimmedUrl;
}

function parseConsensusThreshold(rawValue: string | undefined, warnings: string[]): number {
  if (rawValue === undefined) {
    return DEFAULT_CONSENSUS_THRESHOLD;
  }

  const parsedValue = parseFloat(rawValue);
  if (Number.isNaN(parsedValue) || !Number.isFinite(parsedValue)) {
    warnings.push('Invalid CONSENSUS_THRESHOLD format; falling back to 0.75.');
    return DEFAULT_CONSENSUS_THRESHOLD;
  }

  if (parsedValue < 0.0 || parsedValue > 1.0) {
    warnings.push('CONSENSUS_THRESHOLD must be between 0.0 and 1.0; clamping value.');
    return Math.max(0.0, Math.min(1.0, parsedValue));
  }

  return parsedValue;
}

function sanitizePath(rawPath: string | undefined, warnings: string[]): string {
  const trimmedPath = rawPath?.trim();
  if (!trimmedPath) {
    return DEFAULT_MEMORY_PATH;
  }
  if (!PATH_PATTERN.test(trimmedPath)) {
    warnings.push('MEMORY_PERSISTENCE_PATH contains disallowed characters; falling back to default.');
    return DEFAULT_MEMORY_PATH;
  }
  return trimmedPath;
}

function parseLogLevel(rawLevel: string | undefined): EnvConfig['logLevel'] {
  const trimmedLevel = rawLevel?.trim() as EnvConfig['logLevel'];
  return VALID_LOG_LEVELS.includes(trimmedLevel) ? trimmedLevel : DEFAULT_LOG_LEVEL;
}

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
  const optionalConfigValues: Partial<EnvConfig> = {};

  for (const provider of OPTIONAL_PROVIDERS) {
    const providerValue = env[provider.envKey]?.trim();
    if (providerValue) {
      activeProviders.push(provider.providerName);
      optionalConfigValues[provider.key] = providerValue as any;
    }
  }

  // Client-Side Deprecation Audit
  if (env.VITE_ANTHROPIC_API_KEY || env.VITE_CEREBRAS_API_KEY || env.VITE_XAI_API_KEY) {
    warnings.push('Client-side VITE_* AI API keys detected. Migrating to server-proxy route is recommended.');
  }

  const appUrl = sanitizeUrl(
    env.APP_URL,
    DEFAULT_APP_URL,
    'APP_URL is malformed or invalid; falling back to default.',
    warnings
  );

  const ollamaBaseUrl = sanitizeUrl(
    env.OLLAMA_BASE_URL,
    DEFAULT_OLLAMA_BASE_URL,
    'OLLAMA_BASE_URL is malformed or invalid; falling back to default.',
    warnings
  );

  const consensusThreshold = parseConsensusThreshold(env.CONSENSUS_THRESHOLD, warnings);
  const memoryPersistencePath = sanitizePath(env.MEMORY_PERSISTENCE_PATH, warnings);
  const logLevel = parseLogLevel(env.LOG_LEVEL);

  const config: Partial<EnvConfig> = {
    geminiApiKey: geminiKey,
    appUrl,
    ollamaBaseUrl,
    consensusThreshold,
    zeroLeakSandboxEnabled: env.ZERO_LEAK_SANDBOX_ENABLED === 'true',
    memoryPersistencePath,
    logLevel,
    ...optionalConfigValues,
  };

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    warnings,
    activeProviders,
    config,
  };
}

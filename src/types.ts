/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/types.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

// Branded types for strict input validation and injection mitigation
export type SanitizedString = string & { readonly __brand: unique symbol };
export type BoundedProbability = number & { readonly __range: '[0, 1]' };
export type BoundedScore = number & { readonly __range: '[0, 100]' };
export type BoundedMemoryLimit = number & { readonly __range: '[1, 1048576]' };

export interface Chunk {
  readonly title: string;
  readonly file: string;
  readonly code: string;
  readonly explanation: string;
  readonly mutation: string;
  /** Bounded between 0 and 1 inclusive for strict probabilistic alignment validation */
  readonly intentAlignmentScore: BoundedProbability;
  readonly philosophyCheck: string;
  /** Bounded between 0 and 100 inclusive for numeric bounds integrity */
  readonly ccrrScore: BoundedScore;
  readonly suggestedBranchName: string;
  readonly isCriticalUpgrade?: boolean;
  /** Cryptographic hash or checksum for memory safety and integrity validation */
  readonly checksum?: string;
  /** Bounded memory allocation limit for payload deserialization */
  readonly maxPayloadSize?: BoundedMemoryLimit;
}

/**
 * Runtime validation guard for BoundedProbability
 */
export function isValidProbability(value: unknown): value is BoundedProbability {
  return typeof value === 'number' && !Number.isNaN(value) && value >= 0 && value <= 1;
}

/**
 * Runtime validation guard for BoundedScore
 */
export function isValidScore(value: unknown): value is BoundedScore {
  return typeof value === 'number' && !Number.isNaN(value) && value >= 0 && value <= 100;
}

/**
 * Runtime validation guard for BoundedMemoryLimit
 */
export function isValidMemoryLimit(value: unknown): value is BoundedMemoryLimit {
  return (
    typeof value === 'number' &&
    !Number.isNaN(value) &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 1048576
  );
}

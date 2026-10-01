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
  title: string;
  file: string;
  code: string;
  explanation: string;
  mutation: string;
  /** Bounded between 0 and 1 inclusive for strict probabilistic alignment validation */
  intentAlignmentScore: number;
  philosophyCheck: string;
  /** Bounded between 0 and 100 inclusive for numeric bounds integrity */
  ccrrScore: number;
  suggestedBranchName: string;
  isCriticalUpgrade?: boolean;
  /** Cryptographic hash or checksum for memory safety and integrity validation */
  checksum?: string;
  /** Bounded memory allocation limit for payload deserialization */
  maxPayloadSize?: number;
}

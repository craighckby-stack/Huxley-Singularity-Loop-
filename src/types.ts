/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/types.ts
 * Role: Core system component participating in autonomous cognitive evolution cycles.
 * Architecture: Type-safe modular unit with resilient state interfaces.
 */

export interface Chunk {
  title: string;
  file: string;
  code: string;
  explanation: string;
  mutation: string;
  intentAlignmentScore: number;
  philosophyCheck: string;
  ccrrScore: number;
  suggestedBranchName: string;
  isCriticalUpgrade?: boolean;
}

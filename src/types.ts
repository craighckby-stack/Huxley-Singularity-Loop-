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

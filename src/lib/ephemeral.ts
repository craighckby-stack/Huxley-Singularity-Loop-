
/**
 * HUXLEY_V3.2_CORE: Ephemeral State Persistence Layer
 * Implements Pressure-Based Decay for DNA payloads.
 */

export interface DNA {
  hash: string;
  payload: any;
  entropy: number;
  timestamp: number;
}

export class EphemeralStorage {
  private state = new Map<string, DNA>();
  private memoryPressure: number = 0; // 0 to 1

  constructor() {
    // Background monitor for pressure-based decay
    setInterval(() => this.applyDecay(), 10000);
  }

  setMemoryPressure(pressure: number) {
    this.memoryPressure = Math.max(0, Math.min(1, pressure));
    if (this.memoryPressure > 0.7) {
      this.applyDecay(); // Immediate cull on high pressure
    }
  }

  persist(dna: DNA) {
    this.state.set(dna.hash, dna);
    console.log(`[HUXLEY_STORAGE] Persisted DNA: ${dna.hash} (Entropy: ${dna.entropy})`);
  }

  private applyDecay() {
    const now = Date.now();
    const pressureMultiplier = this.memoryPressure > 0.7 ? 10 : 1;

    for (const [hash, dna] of this.state.entries()) {
      // Logic: High entropy persists longer.
      // Base lifespan: 1 hour (3600000ms)
      // Entropy coefficient scales this.
      // High pressure drastically reduces lifespan for all, especially low entropy.
      
      const entropyBonus = dna.entropy * 7200000; // Up to 2 extra hours for high entropy
      const baseLifespan = 3600000 + entropyBonus;
      const effectiveLifespan = baseLifespan / pressureMultiplier;

      // Rule: Low-entropy noise (entropy < 0.2) must be purged immediately when pressure > 70%
      const isLowEntropyNoise = dna.entropy < 0.2;
      const shouldPurgeImmediately = isLowEntropyNoise && this.memoryPressure > 0.7;

      if (shouldPurgeImmediately || (now - dna.timestamp) > effectiveLifespan) {
        this.state.delete(hash);
        console.warn(`[HUXLEY_STORAGE] Purged DNA: ${hash} (Entropy: ${dna.entropy}, Reason: ${shouldPurgeImmediately ? 'PRESSURE_CULL' : 'EXPIRATION'})`);
      }
    }
  }

  get(hash: string): DNA | undefined {
    return this.state.get(hash);
  }

  getAll(): DNA[] {
    return Array.from(this.state.values());
  }

  get size(): number {
    return this.state.size;
  }
}

export const huxleyStorage = new EphemeralStorage();

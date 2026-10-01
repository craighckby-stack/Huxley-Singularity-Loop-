/**
 * HUXLEY_V3.2_CORE: Ephemeral State Persistence Layer
 * Implements Pressure-Based Decay for DNA payloads.
 */

export interface DNA {
  hash: string;
  payload: unknown;
  entropy: number;
  timestamp: number;
}

const DECAY_INTERVAL_MS = 10000;
const HIGH_PRESSURE_THRESHOLD = 0.7;
const LOW_ENTROPY_THRESHOLD = 0.2;
const BASE_LIFESPAN_MS = 3600000; // 1 hour
const ENTROPY_BONUS_SCALER = 7200000; // Up to 2 extra hours for high entropy

export class EphemeralStorage {
  private readonly state = new Map<string, DNA>();
  private memoryPressure: number = 0; // 0 to 1
  private decayTimer: ReturnType<typeof setInterval>;

  constructor() {
    // Background monitor for pressure-based decay
    this.decayTimer = setInterval(() => this.applyDecay(), DECAY_INTERVAL_MS);
  }

  setMemoryPressure(pressure: number): void {
    this.memoryPressure = Math.max(0, Math.min(1, pressure));
    if (this.memoryPressure > HIGH_PRESSURE_THRESHOLD) {
      this.applyDecay(); // Immediate cull on high pressure
    }
  }

  persist(dna: DNA): void {
    this.state.set(dna.hash, dna);
    console.log(`[HUXLEY_STORAGE] Persisted DNA: ${dna.hash} (Entropy: ${dna.entropy})`);
  }

  private applyDecay(): void {
    const now = Date.now();
    const isHighPressure = this.memoryPressure > HIGH_PRESSURE_THRESHOLD;
    const pressureMultiplier = isHighPressure ? 10 : 1;

    for (const [hash, dna] of this.state.entries()) {
      const entropyBonus = dna.entropy * ENTROPY_BONUS_SCALER;
      const baseLifespan = BASE_LIFESPAN_MS + entropyBonus;
      const effectiveLifespan = baseLifespan / pressureMultiplier;

      const isLowEntropyNoise = dna.entropy < LOW_ENTROPY_THRESHOLD;
      const shouldPurgeImmediately = isLowEntropyNoise && isHighPressure;
      const isExpired = (now - dna.timestamp) > effectiveLifespan;

      if (shouldPurgeImmediately || isExpired) {
        this.state.delete(hash);
        const reason = shouldPurgeImmediately ? 'PRESSURE_CULL' : 'EXPIRATION';
        console.warn(`[HUXLEY_STORAGE] Purged DNA: ${hash} (Entropy: ${dna.entropy}, Reason: ${reason})`);
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

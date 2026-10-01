/**
 * HUXLEY_V3.2_CORE: Ephemeral State Persistence Layer
 * Implements Pressure-Based Decay for DNA payloads.
 */

export interface DNA {
  readonly hash: string;
  readonly payload: unknown;
  readonly entropy: number;
  readonly timestamp: number;
}

const DECAY_INTERVAL_MS = 10000;
const HIGH_PRESSURE_THRESHOLD = 0.7;
const LOW_ENTROPY_THRESHOLD = 0.2;
const BASE_LIFESPAN_MS = 3600000; // 1 hour
const ENTROPY_BONUS_SCALER = 7200000; // Up to 2 extra hours for high entropy
const PRESSURE_MULTIPLIER_HIGH = 10;
const PRESSURE_MULTIPLIER_NORMAL = 1;
const MAX_STORAGE_CAPACITY = 10000; // Strict bounds limit for memory safety

type PurgeReason = 'PRESSURE_CULL' | 'EXPIRATION' | '';

interface PurgeEvaluation {
  readonly shouldPurge: boolean;
  readonly reason: PurgeReason;
}

export class EphemeralStorage {
  private readonly state = new Map<string, DNA>();
  private memoryPressure = 0; // 0 to 1
  private readonly decayTimer: ReturnType<typeof setInterval>;

  constructor() {
    // Background monitor for pressure-based decay
    this.decayTimer = setInterval(() => this.applyDecay(), DECAY_INTERVAL_MS);
  }

  public setMemoryPressure(pressure: number): void {
    if (typeof pressure !== 'number' || Number.isNaN(pressure)) {
      return;
    }
    this.memoryPressure = Math.max(0, Math.min(1, pressure));
    if (this.isHighPressure()) {
      this.applyDecay(); // Immediate cull on high pressure
    }
  }

  public persist(dna: DNA): void {
    if (!dna || typeof dna.hash !== 'string' || dna.hash.length === 0) {
      return;
    }
    if (typeof dna.entropy !== 'number' || Number.isNaN(dna.entropy)) {
      return;
    }
    if (typeof dna.timestamp !== 'number' || Number.isNaN(dna.timestamp)) {
      return;
    }

    // Strict capacity bounds checking to prevent memory exhaustion
    if (this.state.size >= MAX_STORAGE_CAPACITY && !this.state.has(dna.hash)) {
      // Evict oldest or excess entries if capacity is reached
      const firstKey = this.state.keys().next().value;
      if (firstKey !== undefined) {
        this.state.delete(firstKey);
      }
    }

    this.state.set(dna.hash, dna);
    console.log(`[HUXLEY_STORAGE] Persisted DNA: ${dna.hash} (Entropy: ${dna.entropy})`);
  }

  public get(hash: string): DNA | undefined {
    if (typeof hash !== 'string' || hash.length === 0) {
      return undefined;
    }
    return this.state.get(hash);
  }

  public getAll(): DNA[] {
    return Array.from(this.state.values());
  }

  public get size(): number {
    return this.state.size;
  }

  private isHighPressure(): boolean {
    return this.memoryPressure > HIGH_PRESSURE_THRESHOLD;
  }

  private calculateEffectiveLifespan(dna: DNA, isHighPressure: boolean): number {
    const entropy = typeof dna.entropy === 'number' && !Number.isNaN(dna.entropy) ? dna.entropy : 0;
    const entropyBonus = entropy * ENTROPY_BONUS_SCALER;
    const baseLifespan = BASE_LIFESPAN_MS + entropyBonus;
    const pressureMultiplier = isHighPressure ? PRESSURE_MULTIPLIER_HIGH : PRESSURE_MULTIPLIER_NORMAL;
    return baseLifespan / pressureMultiplier;
  }

  private evaluatePurge(dna: DNA, now: number, isHighPressure: boolean): PurgeEvaluation {
    const entropy = typeof dna.entropy === 'number' && !Number.isNaN(dna.entropy) ? dna.entropy : 0;
    const timestamp = typeof dna.timestamp === 'number' && !Number.isNaN(dna.timestamp) ? dna.timestamp : now;
    
    const isLowEntropyNoise = entropy < LOW_ENTROPY_THRESHOLD;
    const shouldPurgeImmediately = isLowEntropyNoise && isHighPressure;
    const effectiveLifespan = this.calculateEffectiveLifespan(dna, isHighPressure);
    const isExpired = (now - timestamp) > effectiveLifespan;

    if (shouldPurgeImmediately) {
      return { shouldPurge: true, reason: 'PRESSURE_CULL' };
    }
    if (isExpired) {
      return { shouldPurge: true, reason: 'EXPIRATION' };
    }
    return { shouldPurge: false, reason: '' };
  }

  private applyDecay(): void {
    const now = Date.now();
    const isHighPressure = this.isHighPressure();

    for (const [hash, dna] of this.state.entries()) {
      const evaluation = this.evaluatePurge(dna, now, isHighPressure);

      if (evaluation.shouldPurge) {
        this.state.delete(hash);
        const entropy = typeof dna.entropy === 'number' ? dna.entropy : 0;
        console.warn(`[HUXLEY_STORAGE] Purged DNA: ${hash} (Entropy: ${entropy}, Reason: ${evaluation.reason})`);
      }
    }
  }
}

export const huxleyStorage = new EphemeralStorage();

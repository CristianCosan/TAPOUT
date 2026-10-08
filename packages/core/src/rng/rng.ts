// Seeded xorshift32 generator (salvaged from the earlier rebuild).
// The same generator replaces Math.random in the legacy v12 harness, so the
// port and the original consume an identical stream of draws.

export interface RngState {
  seed: number;
  value: number;
  draws: number;
}

const UINT32_RANGE = 4_294_967_296;

export function hashSeed(input: number | string): number {
  if (typeof input === 'number' && Number.isFinite(input)) {
    const normalized = input >>> 0;
    return normalized === 0 ? 0x6d2b79f5 : normalized;
  }
  let hash = 0x811c9dc5;
  for (const char of String(input)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  const normalized = hash >>> 0;
  return normalized === 0 ? 0x6d2b79f5 : normalized;
}

export function createRngState(seed: number | string): RngState {
  const normalized = hashSeed(seed);
  return { seed: normalized, value: normalized, draws: 0 };
}

/** Advances the state in place and returns a float in [0, 1). */
export function nextFloat(state: RngState): number {
  let value = state.value >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  state.value = value >>> 0;
  state.draws += 1;
  return state.value / UINT32_RANGE;
}

/** A Math.random-compatible function bound to a state object. */
export function randomFn(state: RngState): () => number {
  return () => nextFloat(state);
}

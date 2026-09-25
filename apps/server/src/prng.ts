/**
 * Mulberry32 is a simple, fast 32-bit PRNG with great statistical properties.
 * Given an unsigned 32-bit integer seed, produces deterministic floats in [0, 1).
 */
export function createMulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a cryptographically random 32-bit unsigned seed for room PRNG.
 */
export function generateSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] >>> 0;
}

/**
 * Generates a cryptographically random float in [0, 1),
 * using 53 bits of entropy (standard IEEE 754 double precision).
 * Immune to server hibernation and re-seeding issues.
 */
export function cryptoRandom(): number {
  const buf = new Uint32Array(2);
  crypto.getRandomValues(buf);
  return ((buf[0] >>> 5) * 67108864 + (buf[1] >>> 6)) / 9007199254740992;
}


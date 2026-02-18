/**
 * Dispersion/precision modeling for weapon accuracy
 * 
 * Uses MOA-based precision scaling with deterministic seeded RNG
 * to ensure reproducible test results while simulating real weapon scatter.
 */

/**
 * Seeded mulberry32 PRNG (32-bit)
 * Simple, fast, and produces deterministic random numbers from a seed.
 * 
 * @param seed - The seed value (can convert from string via hash)
 * @returns A random value in [0, 1)
 */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state += 0x6D2B79F5;
    let t = Math.imul(state ^ state >>> 15, state | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Hash a string to a 32-bit integer
 * Uses simple DJB2 hash algorithm
 * 
 * @param str - String to hash
 * @returns 32-bit hash integer
 */
export function stringHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
  }
  return hash >>> 0; // Ensure positive 32-bit
}

/**
 * Combine a seed with a shot number to get a per-shot seed
 * 
 * @param baseSeed - Base seed (from level or test mode)
 * @param shotNumber - Shot number (0-indexed)
 * @returns Combined seed for this shot
 */
export function combineSeed(baseSeed: number, shotNumber: number): number {
  // Mix base seed with shot number using XOR and multiplication
  return ((baseSeed * 2654435761) + shotNumber) >>> 0;
}

/**
 * Generate a normally-distributed random value using Box-Muller transform
 * ~68% of values within 1σ, ~95% within 2σ, ~99.7% within 3σ
 * 
 * @param rand - Random function returning [0, 1)
 * @returns normally-distributed value centered at 0
 */
function normalRandom(rand: () => number): number {
  // Box-Muller transform
  const u1 = rand();
  const u2 = rand();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0;
}

/**
 * Convert MOA to meters at a given distance
 * 1 MOA ≈ 1.047 inches at 100 yards = 0.02699 meters at 100 yards = 91.44 meters
 * So MOA * 0.0002951 gives meters at 1 meter distance (tangent approximation for small angles)
 * 
 * More precise: MOA in radians = MOA * (π / 10800)
 * At distance D: spread = D * tan(MOA * π / 10800)
 * 
 * @param moa - Minutes of angle
 * @param distanceM - Target distance in meters
 * @returns Spread in meters (radius, not diameter)
 */
export function moaToSpreadMeters(moa: number, distanceM: number): number {
  const moaRadians = moa * (Math.PI / 10800); // Convert MOA to radians
  return distanceM * Math.tan(moaRadians); // Spread radius at this distance
}

/**
 * Standard deviation for shot dispersion
 * For a 3-shot group to cover X inches (the MOA rating), we need:
 * - 95% of shots should land within the MOA circle (2σ)
 * - So MOA diameter = 4σ (radius = 2σ)
 * - σ = MOA_radius / 2
 * 
 * This gives us the standard deviation for normal distribution
 * 
 * @param precisionMoaAt100 - Weapon's precision rating at 100 yards (MOA)
 * @param distanceM - Target distance in meters
 * @returns Standard deviation in meters
 */
export function dispersionStdDev(precisionMoaAt100: number, distanceM: number): number {
  // Convert distance to yards for MOA calculation
  const distanceYards = distanceM / 0.9144;
  
  // Scale MOA by distance (MOA is linear with distance)
  const moaAtDistance = precisionMoaAt100 * (distanceYards / 100);
  
  // MOA radius (half of diameter)
  const moaRadius = moaAtDistance / 2;
  
  // Standard deviation = MOA radius / 2 (for 95% coverage within MOA circle)
  const moaRadiusMeters = moaToSpreadMeters(moaRadius * 2, distanceM);
  
  return moaRadiusMeters / 2;
}

/**
 * Sample a radial dispersion offset for a single shot
 * Returns horizontal (dY) and vertical (dZ) dispersion offsets in meters
 * 
 * The offsets are sampled independently from normal distributions,
 * then scaled by the standard deviation for the weapon and distance.
 * 
 * @param distanceM - Target distance in meters
 * @param precisionMoaAt100 - Weapon's precision rating at 100 yards (MOA)
 * @param seed - Seed for deterministic randomness
 * @returns { dY, dZ } - Horizontal (right positive) and vertical (up positive) offsets in meters
 */
export function sampleRadialOffset(
  distanceM: number,
  precisionMoaAt100: number,
  seed: number
): { dY: number; dZ: number } {
  const rand = mulberry32(seed);
  const sigma = dispersionStdDev(precisionMoaAt100, distanceM);
  
  // Sample independent normal distributions for vertical and horizontal
  const yDispersion = normalRandom(rand) * sigma; // Horizontal (side-to-side)
  const zDispersion = normalRandom(rand) * sigma; // Vertical (up-down)
  
  return { dY: yDispersion, dZ: zDispersion };
}

/**
 * Calculate the maximum group size (spread) from a set of impact points
 * Returns the maximum distance between any two shots in the group
 * 
 * @param impacts - Array of { dY, dZ } impact offsets in meters
 * @returns Maximum spread in meters
 */
export function calculateGroupSize(impacts: { dY: number; dZ: number }[]): number {
  if (impacts.length < 2) return 0;
  
  let maxDistance = 0;
  for (let i = 0; i < impacts.length; i++) {
    for (let j = i + 1; j < impacts.length; j++) {
      const dy = impacts[j].dY - impacts[i].dY;
      const dz = impacts[j].dZ - impacts[i].dZ;
      const distance = Math.sqrt(dy * dy + dz * dz);
      maxDistance = Math.max(maxDistance, distance);
    }
  }
  
  return maxDistance;
}

/**
 * Convert meters to MILs (milliradians)
 * 1 MIL = 1/1000 of radians ≈ 0.0573 degrees
 * At distance D, 1 MIL = D/1000 meters
 * 
 * @param metersM - Value in meters
 * @param distanceM - Target distance for MIL conversion
 * @returns Value in MILs
 */
export function metersToMils(metersM: number, distanceM: number): number {
  if (distanceM <= 0) return 0;
  // MILs = offset / target distance * 1000
  return (metersM / distanceM) * 1000;
}

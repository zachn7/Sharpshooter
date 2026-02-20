/**
 * Shotgun pellet pattern engine
 * 
 * Generates deterministic pellet impacts using choke/spread model
 * where spread grows with distance. Used by shotgun weapons for
 * multi-impact scoring.
 */

/**
 * Seeded mulberry32 PRNG (32-bit)
 * Matches the implementation in dispersion.ts for consistency
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
 * Consistent with dispersion.ts implementation
 */
function stringHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
  }
  return hash >>> 0;
}

/**
 * Combine base seed with pellet number for deterministic sampling
 */
function combineSeed(baseSeed: number, pelletNumber: number): number {
  return ((baseSeed * 2654435761) + pelletNumber * 15731) >>> 0;
}

/**
 * Shotgun choke types and their spread modifiers
 * Tighter chokes = tighter patterns
 */
export type ShotgunChoke = 'cylinder' | 'improved-cylinder' | 'modified' | 'improved-modified' | 'full';

/**
 * Spread modifiers for different chokes (multipliers for base spread)
 * Cylinder = no constriction (widest pattern)
 * Full = tightest pattern (most constriction)
 */
const CHOKE_SPREAD_MODIFIERS: Record<ShotgunChoke, number> = {
  'cylinder': 1.0,           // No constriction
  'improved-cylinder': 0.8,  // Light constriction
  'modified': 0.65,          // Medium constriction
  'improved-modified': 0.55, // Medium-tight constriction
  'full': 0.45,              // Maximum constriction
};

/**
 * Convert spread in MILs to meters at a given distance
 * 1 MIL = 1 meter spread per 1000 meters distance
 * 
 * @param spreadMils - Spread diameter in MILs
 * @param distanceM - Target distance in meters
 * @returns Spread radius in meters
 */
export function milsToSpreadMeters(spreadMils: number, distanceM: number): number {
  // MILs to meters: 1 MIL = distanceM / 1000 meters at that distance
  // This gives diameter, so divide by 2 for radius
  return (spreadMils * distanceM) / 2000;
}

/**
 * Calculate pellet spread radius at a given distance
 * Uses choke modifier to tighten or loosen the pattern
 * 
 * @param distanceM - Target distance in meters
 * @param baseSpreadMils - Base spread diameter in MILs (no choke)
 * @param choke - Choke type to apply modifier
 * @returns Spread radius in meters
 */
export function shotgunSpreadRadius(
  distanceM: number,
  baseSpreadMils: number,
  choke: ShotgunChoke = 'cylinder'
): number {
  const chokeModifier = CHOKE_SPREAD_MODIFIERS[choke];
  const effectiveSpreadMils = baseSpreadMils * chokeModifier;
  return milsToSpreadMeters(effectiveSpreadMils, distanceM);
}

/**
 * Sample a random angle uniformly from [0, 2π)
 * Uses consistent RNG seeding
 */
function sampleUniformAngle(rand: () => number): number {
  return rand() * 2 * Math.PI;
}

/**
 * Sample a random radius using square-root distribution for uniform circular distribution
 * Without sqrt transformation, pellets would cluster near center
 * 
 * @param rand - Random function
 * @param maxRadius - Maximum radius in meters
 */
function sampleUniformRadius(rand: () => number, maxRadius: number): number {
  return Math.sqrt(rand()) * maxRadius;
}

/**
 * Configure shotgun pellet pattern generation
 */
export interface ShotgunPatternConfig {
  distanceM: number;        // Target distance in meters
  pelletCount: number;      // Number of pellets in shot
  baseSpreadMils: number;   // Base spread diameter in MILs (no choke)
  choke: ShotgunChoke;      // Choke type
  seed: number | string;    // Seed for deterministic sampling
}

/**
 * Single pellet impact offset relative to aim point
 */
export interface PelletImpact {
  dY: number;      // Horizontal offset (meters, right positive)
  dZ: number;      // Vertical offset (meters, up positive)
}

/**
 * Generate deterministic pellet impacts for a shotgun shot
 * 
 * Pellets are distributed uniformly in a circular pattern with the given spread.
 * Each pellet has a unique offset from the aim point based on RNG sampling.
 * 
 * @param config - Shotgun pattern configuration
 * @returns Array of pellet impact offsets (in meters)
 */
export function samplePelletImpacts(config: ShotgunPatternConfig): PelletImpact[] {
  // Convert string seed to number if necessary
  const numericSeed = typeof config.seed === 'string' ? stringHash(config.seed) : config.seed;
  
  // Cap pellet count for performance (prevent rendering 500+ pellets)
  const maxPelletCount = 50;
  const effectivePelletCount = Math.min(config.pelletCount, maxPelletCount);
  
  // Calculate spread radius at this distance with choke applied
  const spreadRadius = shotgunSpreadRadius(
    config.distanceM,
    config.baseSpreadMils,
    config.choke
  );
  
  const pellets: PelletImpact[] = [];
  
  // Generate pellets with deterministic sampling
  for (let i = 0; i < effectivePelletCount; i++) {
    const pelletSeed = combineSeed(numericSeed, i);
    const rand = mulberry32(pelletSeed);
    
    // Sample angle uniformly [0, 2π)
    const angle = sampleUniformAngle(rand);
    
    // Sample radius uniformly in circle (using sqrt for uniform areal distribution)
    const radius = sampleUniformRadius(rand, spreadRadius);
    
    // Convert polar to Cartesian coordinates
    const dY = radius * Math.cos(angle); // Horizontal (right positive)
    const dZ = radius * Math.sin(angle); // Vertical (up positive)
    
    pellets.push({ dY, dZ });
  }
  
  return pellets;
}

/**
 * Count pellets that hit a circular target
 * 
 * @param pellets - Array of pellet offsets (meters)
 * @param targetRadiusM - Radius of target (meters)
 * @returns Number of pellets within the target (including edge)
 */
export function countPelletsOnTarget(
  pellets: PelletImpact[],
  targetRadiusM: number
): number {
  return pellets.filter(pellet => {
    const distanceFromCenter = Math.sqrt(pellet.dY ** 2 + pellet.dZ ** 2);
    return distanceFromCenter <= targetRadiusM;
  }).length;
}

/**
 * Find the best-scoring pellet on a bullseye target
 * Returns the pellet closest to center (shortest distance)
 * 
 * @param pellets - Array of pellet offsets (meters)
 * @returns Best pellet (minimum distance from center) or undefined if no pellets
 */
export function getBestPelletOnBullseye(pellets: PelletImpact[]): PelletImpact | undefined {
  if (pellets.length === 0) return undefined;
  
  let best = pellets[0];
  let bestDistance = best.dY ** 2 + best.dZ ** 2; // Squared distance, no sqrt needed for comparison
  
  for (let i = 1; i < pellets.length; i++) {
    const distance = pellets[i].dY ** 2 + pellets[i].dZ ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = pellets[i];
    }
  }
  
  return best;
}

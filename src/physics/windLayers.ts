/**
 * Wind Layers Module
 * Handles distance-varying wind sampling with deterministic gusts
 */

// Wind layer segment from level data
export interface WindLayerSegment {
  startM: number;             // Start distance in meters
  endM: number;                // End distance in meters
  windMps: number;             // Wind speed in this segment (m/s, + = left-to-right)
  gustMps: number;             // Gust variation range (+/-) in this segment
}

// Wind sampling context
export interface WindSamplingContext {
  baseWind?: number;           // Fallback constant wind (m/s)
  gust?: number;               // Fallback constant gust (+/- m/s)
  windProfile?: WindLayerSegment[];  // Multi-segment wind profile
  seed: number;                // Deterministic seed for gust sampling
}

// Result of wind sampling
export interface WindSample {
  windSpeed: number;           // Sampled wind speed at this distance (m/s)
  segmentIndex: number;        // Which segment (0-2 for 3-layer profile, or -1 for constant)
}

/**
 * Mulberry32 deterministic PRNG
 * Same algorithm used in ballistics for consistency
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Find which wind segment contains the given distance
 * Returns -1 if no segment found (use constant wind as fallback)
 */
function findSegmentAtDistance(
  distanceM: number,
  windProfile: WindLayerSegment[]
): number {
  for (let i = 0; i < windProfile.length; i++) {
    const segment = windProfile[i];
    if (distanceM >= segment.startM && distanceM < segment.endM) {
      return i;
    }
  }
  return -1;
}

/**
 * Sample wind at a given distance
 * Uses deterministic gust sampling based on segment index and seed
 * 
 * @param distanceM - Distance from shooter in meters
 * @param context - Wind sampling context with profile and seed
 * @returns Wind sample with speed and segment index
 */
export function sampleWindAtDistance(
  distanceM: number,
  context: WindSamplingContext
): WindSample {
  // If we have a wind profile, find the segment
  if (context.windProfile && context.windProfile.length > 0) {
    const segmentIndex = findSegmentAtDistance(distanceM, context.windProfile);
    
    if (segmentIndex >= 0) {
      const segment = context.windProfile[segmentIndex];
      
      // Deterministic gust for this segment
      // Use seed + segment index to ensure each segment has different but deterministic gust
      const segmentSeed = context.seed + segmentIndex * 1000;
      const rng = mulberry32(segmentSeed);
      const gustDelta = segment.gustMps === 0 
        ? 0 
        : (rng() * 2 - 1) * segment.gustMps;
      
      return {
        windSpeed: segment.windMps + gustDelta,
        segmentIndex,
      };
    }
    
    // If outside profile range, extrapolate using last segment
    const lastSegmentIndex = context.windProfile.length - 1;
    const lastSegment = context.windProfile[lastSegmentIndex];
    
    const segmentSeed = context.seed + lastSegmentIndex * 1000;
    const rng = mulberry32(segmentSeed);
    const gustDelta = lastSegment.gustMps === 0 
      ? 0 
      : (rng() * 2 - 1) * lastSegment.gustMps;
    
    return {
      windSpeed: lastSegment.windMps + gustDelta,
      segmentIndex: lastSegmentIndex,
    };
  }
  
  // Fallback to constant wind
  const baseWind = context.baseWind ?? 0;
  const gust = context.gust ?? 0;
  
  // Deterministic gust for constant wind (use seed directly)
  const rng = mulberry32(context.seed);
  const gustDelta = gust === 0 ? 0 : (rng() * 2 - 1) * gust;
  
  return {
    windSpeed: baseWind + gustDelta,
    segmentIndex: -1, // -1 indicates constant wind (no layering)
  };
}

/**
 * Sample wind at multiple distances for visualization
 * Useful for plotting wind profile or debugging
 * 
 * @param distancesM - Array of distances to sample at
 * @param context - Wind sampling context
 * @returns Array of wind samples
 */
export function sampleWindAtMultipleDistances(
  distancesM: number[],
  context: WindSamplingContext
): WindSample[] {
  return distancesM.map(distance => sampleWindAtDistance(distance, context));
}

/**
 * Get representative wind at standard flag positions (near, mid, far)
 * Useful for wind cue visualization
 * 
 * @param targetDistanceM - Total distance to target
 * @param context - Wind sampling context
 * @returns Object with near, mid, far wind samples
 */
export function getWindAtFlagPositions(
  targetDistanceM: number,
  context: WindSamplingContext
): { near: WindSample; mid: WindSample; far: WindSample } {
  const near = sampleWindAtDistance(targetDistanceM * 0.33, context);
  const mid = sampleWindAtDistance(targetDistanceM * 0.66, context);
  const far = sampleWindAtDistance(targetDistanceM, context);
  
  return { near, mid, far };
}

/**
 * Check if a level uses layered wind (windProfile) vs constant wind
 */
export function isLayeredWind(context: WindSamplingContext): boolean {
  return !!(context.windProfile && context.windProfile.length > 0);
}

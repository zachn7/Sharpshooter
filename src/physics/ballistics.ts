export type Vec3 = { x: number; y: number; z: number };

export type BallisticsEnv = {
 airDensityKgM3?: number; // default ~1.225
 gravityMps2?: number; // default 9.80665
 windMps?: number; // +z crosswind (blowing to the right) - used if windProfile is not provided
 gustMps?: number; // gust range +/- - used if windProfile is not provided
 windProfile?: { startM: number; endM: number; windMps: number; gustMps: number }[]; // distance-varying wind layers
 seed?: number; // deterministic gust
};

export type BallisticsShot = {
 distanceM: number; // downrange distance to target plane
 muzzleVelocityMps: number;
 dragFactor: number; // gameplay-tunable (units absorbed)
 dtS?: number; // default 0.002
 maxTimeS?: number; // default 5
 // aim point on target plane in meters relative to bore origin
 aimY_M: number; // vertical
 aimZ_M: number; // horizontal (right)
 recordPath?: boolean;
};

export type ShotResult = {
 impactY_M: number;
 impactZ_M: number;
 timeOfFlightS: number;
 windUsedMps: number;
 path?: Vec3[];
 isLayeredWind?: boolean; // true if windProfile was used (for UI feedback)
};

function mulberry32(seed: number) {
 let a = seed >>> 0;
 return () => {
 a |= 0;
 a = (a + 0x6d2b79f5) | 0;
 let t = Math.imul(a ^ (a >>> 15), 1 | a);
 t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
 return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
 };
}

function lerp(a: number, b: number, t: number) {
 return a + (b - a) * t;
}

// Wind sampling for layered wind
function sampleWindAtEnvDistance(distanceM: number, env: BallisticsEnv, rng: () => number): number {
  // If wind profile is provided, find the segment
  if (env.windProfile && env.windProfile.length > 0) {
    for (const segment of env.windProfile) {
      if (distanceM >= segment.startM && distanceM < segment.endM) {
        // Deterministic gust for this segment (use distance as part of seed)
        const segmentSeed = (env.seed ?? 1) + Math.floor(distanceM);
        const segmentRng = mulberry32(segmentSeed);
        const gustDelta = segment.gustMps === 0 ? 0 : (segmentRng() * 2 - 1) * segment.gustMps;
        return segment.windMps + gustDelta;
      }
    }
    // Outside profile range, extrapolate with last segment
    const lastSegment = env.windProfile[env.windProfile.length - 1];
    const gustDelta = lastSegment.gustMps === 0 ? 0 : (rng() * 2 - 1) * lastSegment.gustMps;
    return lastSegment.windMps + gustDelta;
  }
  
  // Constant wind mode
  const baseWind = env.windMps ?? 0;
  const gust = env.gustMps ?? 0;
  return baseWind === 0 && gust === 0 ? 0 : baseWind + (gust === 0 ? 0 : (rng() * 2 - 1) * gust);
}

export function simulateShotToDistance(shot: BallisticsShot, env: BallisticsEnv = {}): ShotResult {
 const rho = env.airDensityKgM3 ?? 1.225;
 const g = env.gravityMps2 ?? 9.80665;
 const dt = shot.dtS ?? 0.002;
 const maxTime = shot.maxTimeS ?? 5;

 // Determine if using layered wind
 const isLayeredWind = !!(env.windProfile && env.windProfile.length > 0);

 // RNG for gust sampling (only used for constant wind or final values)
 const rng = mulberry32(env.seed ?? 1);

 // Aim point defines launch angles (small-angle safe):
 const angleY = Math.atan2(shot.aimY_M, shot.distanceM);
 const angleZ = Math.atan2(shot.aimZ_M, shot.distanceM);

 // Initial velocity components (x downrange)
 let v: Vec3 = {
 x: shot.muzzleVelocityMps * Math.cos(angleY) * Math.cos(angleZ),
 y: shot.muzzleVelocityMps * Math.sin(angleY),
 z: shot.muzzleVelocityMps * Math.cos(angleY) * Math.sin(angleZ)
 };

 let p: Vec3 = { x: 0, y: 0, z: 0 };

 const path: Vec3[] | undefined = shot.recordPath ? [] : undefined;
 if (path) path.push({ ...p });

 const k = shot.dragFactor * rho; // gameplay-tunable aggregate coefficient

 let t = 0;
 let prevP = { ...p };
 let prevT = 0;

 while (t < maxTime) {
 prevP = { ...p };
 prevT = t;

 // Sample wind at current distance (for layered wind support)
 const windUsed = sampleWindAtEnvDistance(p.x, env, rng);

 // Relative air velocity includes wind in +z
 const vRel: Vec3 = { x: v.x, y: v.y, z: v.z - windUsed };
 const speedRel = Math.hypot(vRel.x, vRel.y, vRel.z);

 // Drag accel: -k * |vRel| * vRel
 const aDrag: Vec3 = speedRel === 0
 ? { x: 0, y: 0, z: 0 }
 : { x: -k * speedRel * vRel.x, y: -k * speedRel * vRel.y, z: -k * speedRel * vRel.z };

 const a: Vec3 = { x: aDrag.x, y: aDrag.y - g, z: aDrag.z };

 // Semi-implicit Euler (stable enough for game)
 v = { x: v.x + a.x * dt, y: v.y + a.y * dt, z: v.z + a.z * dt };
 p = { x: p.x + v.x * dt, y: p.y + v.y * dt, z: p.z + v.z * dt };

 t += dt;
 if (path) path.push({ ...p });

 if (p.x >= shot.distanceM) {
 const frac = (shot.distanceM - prevP.x) / (p.x - prevP.x || 1e-9);
 const impactY = lerp(prevP.y, p.y, frac);
 const impactZ = lerp(prevP.z, p.z, frac);
 const impactT = lerp(prevT, t, frac);
 return {
 impactY_M: impactY,
 impactZ_M: impactZ,
 timeOfFlightS: impactT,
 windUsedMps: windUsed,
 path
 };
 }
 }

 // If we never reached distance, return last state (still deterministic)
 // If we never reached distance, return last state (still deterministic)
 return {
 impactY_M: p.y,
 impactZ_M: p.z,
 timeOfFlightS: t,
 windUsedMps: sampleWindAtEnvDistance(p.x, env, rng),
 path,
 isLayeredWind,
 };
}

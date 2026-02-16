export type Vec3 = { x: number; y: number; z: number };

export type BallisticsEnv = {
 airDensityKgM3?: number; // default ~1.225
 gravityMps2?: number; // default 9.80665
 windMps?: number; // +z crosswind (blowing to the right)
 gustMps?: number; // gust range +/-
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

export function simulateShotToDistance(shot: BallisticsShot, env: BallisticsEnv = {}): ShotResult {
 const rho = env.airDensityKgM3 ?? 1.225;
 const g = env.gravityMps2 ?? 9.80665;
 const baseWind = env.windMps ?? 0;
 const gust = env.gustMps ?? 0;
 const dt = shot.dtS ?? 0.002;
 const maxTime = shot.maxTimeS ?? 5;

 const rng = mulberry32(env.seed ?? 1);
 const gustDelta = gust === 0 ? 0 : (rng() * 2 - 1) * gust;
 const windUsed = baseWind + gustDelta;

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
 return {
 impactY_M: p.y,
 impactZ_M: p.z,
 timeOfFlightS: t,
 windUsedMps: windUsed,
 path
 };
}

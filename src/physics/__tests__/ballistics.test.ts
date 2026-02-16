import { describe, expect, it } from 'vitest';
import { simulateShotToDistance } from '../ballistics';

const g = 9.80665;

describe('ballistics simulateShotToDistance', () => {
 it('no drag/no wind approximates analytic vertical drop', () => {
 const distanceM = 100;
 const muzzleVelocityMps = 800;
 const dtS = 0.001;

 // Aim straight (no elevation) at center
 const res = simulateShotToDistance(
 {
 distanceM,
 muzzleVelocityMps,
 dragFactor: 0,
 dtS,
 aimY_M: 0,
 aimZ_M: 0
 },
 { windMps: 0, gravityMps2: g, seed: 123 }
 );

 const t = distanceM / muzzleVelocityMps;
 const expectedY = -0.5 * g * t * t;

 expect(res.impactZ_M).toBeCloseTo(0, 3);
 expect(res.impactY_M).toBeCloseTo(expectedY, 2); // integration error tolerance
 });

 it('drag increases time-of-flight and drop magnitude vs no-drag', () => {
 const shot = {
 distanceM: 200,
 muzzleVelocityMps: 800,
 dtS: 0.001,
 aimY_M: 0,
 aimZ_M: 0
 };

 const noDrag = simulateShotToDistance({ ...shot, dragFactor: 0 }, { windMps: 0, gravityMps2: g, seed: 1 });
 const withDrag = simulateShotToDistance({ ...shot, dragFactor: 0.00002 }, { windMps: 0, gravityMps2: g, seed: 1 });

 expect(withDrag.timeOfFlightS).toBeGreaterThan(noDrag.timeOfFlightS);
 expect(Math.abs(withDrag.impactY_M)).toBeGreaterThan(Math.abs(noDrag.impactY_M));
 });

 it('crosswind produces lateral drift', () => {
 const res = simulateShotToDistance(
 {
 distanceM: 150,
 muzzleVelocityMps: 800,
 dragFactor: 0.00002,
 dtS: 0.001,
 aimY_M: 0,
 aimZ_M: 0
 },
 { windMps: 5, gravityMps2: g, seed: 1 }
 );

 expect(res.impactZ_M).toBeGreaterThan(0);
 });

 it('determinism: same seed yields same windUsed and impact', () => {
 const env = { windMps: 4, gustMps: 1, gravityMps2: g, seed: 999 };
 const shot = { distanceM: 120, muzzleVelocityMps: 750, dragFactor: 0.00002, dtS: 0.001, aimY_M: 0, aimZ_M: 0 };

 const a = simulateShotToDistance(shot, env);
 const b = simulateShotToDistance(shot, env);

 expect(a.windUsedMps).toBeCloseTo(b.windUsedMps, 10);
 expect(a.impactY_M).toBeCloseTo(b.impactY_M, 10);
 expect(a.impactZ_M).toBeCloseTo(b.impactZ_M, 10);
 });
});

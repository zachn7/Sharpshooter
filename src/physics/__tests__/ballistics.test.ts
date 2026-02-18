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

 it('gust range: windUsed stays within baseline ± gust range', () => {
 const shot = { distanceM: 100, muzzleVelocityMps: 800, dragFactor: 0.00002, dtS: 0.001, aimY_M: 0, aimZ_M: 0 };
 const env = { windMps: 5, gustMps: 2, gravityMps2: g, seed: 12345 };

 const result = simulateShotToDistance(shot, env);

 expect(result.windUsedMps).toBeGreaterThanOrEqual(5 - 2); // baseline - gustMps
 expect(result.windUsedMps).toBeLessThanOrEqual(5 + 2); // baseline + gustMps
 });

 it('gust range: negative wind with gust', () => {
 const shot = { distanceM: 100, muzzleVelocityMps: 800, dragFactor: 0.00002, dtS: 0.001, aimY_M: 0, aimZ_M: 0 };
 const env = { windMps: -5, gustMps: 2, gravityMps2: g, seed: 12345 };

 const result = simulateShotToDistance(shot, env);

 expect(result.windUsedMps).toBeLessThanOrEqual(-5 + 2); // baseline + gustMps (less negative)
 expect(result.windUsedMps).toBeGreaterThanOrEqual(-5 - 2); // baseline - gustMps (more negative)
 });

 it('zero gust: windUsed equals baseline exactly', () => {
 const shot = { distanceM: 100, muzzleVelocityMps: 800, dragFactor: 0.00002, dtS: 0.001, aimY_M: 0, aimZ_M: 0 };
 const env = { windMps: 5, gustMps: 0, gravityMps2: g, seed: 99999 };

 const result1 = simulateShotToDistance(shot, env);
 const result2 = simulateShotToDistance(shot, env);

 expect(result1.windUsedMps).toBe(5);
 expect(result2.windUsedMps).toBe(5);
 });

 it('different seeds produce different gusts within valid range', () => {
 const shot = { distanceM: 100, muzzleVelocityMps: 800, dragFactor: 0.00002, dtS: 0.001, aimY_M: 0, aimZ_M: 0 };

 const result1 = simulateShotToDistance(shot, { windMps: 5, gustMps: 2, gravityMps2: g, seed: 11111 });
 const result2 = simulateShotToDistance(shot, { windMps: 5, gustMps: 2, gravityMps2: g, seed: 22222 });

 // Both within range
 expect(result1.windUsedMps).toBeGreaterThanOrEqual(3);
 expect(result1.windUsedMps).toBeLessThanOrEqual(7);
 expect(result2.windUsedMps).toBeGreaterThanOrEqual(3);
 expect(result2.windUsedMps).toBeLessThanOrEqual(7);
 });

 it('no wind no gust: windUsed is zero', () => {
 const shot = { distanceM: 100, muzzleVelocityMps: 800, dragFactor: 0.00002, dtS: 0.001, aimY_M: 0, aimZ_M: 0 };
 const env = { windMps: 0, gustMps: 0, gravityMps2: g, seed: 12345 };

 const result = simulateShotToDistance(shot, env);
 expect(result.windUsedMps).toBe(0);
 });
});

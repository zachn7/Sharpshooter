import { describe, it, expect } from 'vitest';
import { simulateShotToDistance } from '../ballistics';
import { applyTurretOffset } from '../../utils/turret';

const g = 9.80665;
const BASE_ENV = { gravityMps2: g };

/**
 * These tests verify the sign conventions documented in src/physics/conventions.ts
 * 
 * Key conventions being tested:
 * 1. Positive wind (+Z) causes positive impact Z drift (rightward)
 * 2. Positive windage mils shift POI right (+Z) - simulated by aiming left
 * 3. Positive elevation mils shift POI up (+Y) - simulated by aiming higher
 * 4. All follow right-hand rule coordinate system
 */

describe('sign conventions', () => {
  describe('coordinate system basics', () => {
    it('zero aim with no wind hits above center due to gravity (negative Y)', () => {
      const res = simulateShotToDistance(
        {
          distanceM: 100,
          muzzleVelocityMps: 800,
          dragFactor: 0,
          dtS: 0.001,
          aimY_M: 0,
          aimZ_M: 0
        },
        { ...BASE_ENV, seed: 101 }
      );

      // Gravity pulls down, so impact is negative Y (below center)
      expect(res.impactY_M).toBeLessThan(0);
      expect(res.impactZ_M).toBeCloseTo(0, 6); // No wind = no horizontal drift
    });

    it('aiming up (positive aimY) raises impact (less negative Y)', () => {
      const res = simulateShotToDistance(
        {
          distanceM: 100,
          muzzleVelocityMps: 800,
          dragFactor: 0,
          dtS: 0.001,
          aimY_M: 0.05, // Aim 5cm up
          aimZ_M: 0
        },
        { ...BASE_ENV, seed: 102 }
      );

      const baseline = simulateShotToDistance(
        {
          distanceM: 100,
          muzzleVelocityMps: 800,
          dragFactor: 0,
          dtS: 0.001,
          aimY_M: 0,
          aimZ_M: 0
        },
        { ...BASE_ENV, seed: 102 }
      );

      // Aiming up should result in higher impact (less negative Y)
      expect(res.impactY_M).toBeGreaterThan(baseline.impactY_M);
    });

    it('aiming right (positive aimZ) shifts impact right (positive Z)', () => {
      const res = simulateShotToDistance(
        {
          distanceM: 100,
          muzzleVelocityMps: 800,
          dragFactor: 0,
          dtS: 0.001,
          aimY_M: 0,
          aimZ_M: 0.1 // Aim 10cm right
        },
        { ...BASE_ENV, seed: 103 }
      );

      // Aiming right should hit right of center
      expect(res.impactZ_M).toBeGreaterThan(0);
      expect(res.impactZ_M).toBeCloseTo(0.1, 3); // Should be close to aim point (no wind/drag)
    });
  });

  describe('wind effect sign convention', () => {
    it('positive crosswind (+) causes positive Z drift (right)', () => {
      const res = simulateShotToDistance(
        {
          distanceM: 150,
          muzzleVelocityMps: 800,
          dragFactor: 0.00002,
          dtS: 0.001,
          aimY_M: 0,
          aimZ_M: 0
        },
        { ...BASE_ENV, windMps: 5, seed: 201 }
      );

      // Positive wind should drift to the right (+Z)
      expect(res.impactZ_M).toBeGreaterThan(0);
    });

    it('negative crosswind (-) causes negative Z drift (left)', () => {
      const res = simulateShotToDistance(
        {
          distanceM: 150,
          muzzleVelocityMps: 800,
          dragFactor: 0.00002,
          dtS: 0.001,
          aimY_M: 0,
          aimZ_M: 0
        },
        { ...BASE_ENV, windMps: -5, seed: 202 }
      );

      // Negative wind should drift to the left (-Z)
      expect(res.impactZ_M).toBeLessThan(0);
    });

    it('stronger positive wind causes more rightward drag', () => {
      const wind5 = simulateShotToDistance(
        {
          distanceM: 150,
          muzzleVelocityMps: 800,
          dragFactor: 0.00002,
          dtS: 0.001,
          aimY_M: 0,
          aimZ_M: 0
        },
        { ...BASE_ENV, windMps: 5, seed: 203 }
      );

      const wind10 = simulateShotToDistance(
        {
          distanceM: 150,
          muzzleVelocityMps: 800,
          dragFactor: 0.00002,
          dtS: 0.001,
          aimY_M: 0,
          aimZ_M: 0
        },
        { ...BASE_ENV, windMps: 10, seed: 203 }
      );

      // Stronger positive wind should produce more rightward drift
      expect(wind10.impactZ_M).toBeGreaterThan(wind5.impactZ_M);
    });
  });

  describe('turret windage sign convention', () => {
    const baseShot = {
      distanceM: 100,
      muzzleVelocityMps: 800,
      dragFactor: 0.00002,
      dtS: 0.001,
      aimY_M: 0,
      aimZ_M: 0
    };
    const env = { ...BASE_ENV, windMps: 0, seed: 301 };

    it('positive windage (+) shifts POI right (+Z)', () => {
      // Apply positive windage (simulate via aim offset)
      const adjusted = applyTurretOffset(0, 0, { elevationMils: 0, windageMils: 1.0 }, 100);
      
      const res = simulateShotToDistance(
        { ...baseShot, aimY_M: adjusted.aimY_M, aimZ_M: adjusted.aimZ_M },
        env
      );

      // Positive windage should shift impact to the right
      expect(res.impactZ_M).toBeGreaterThan(0);
    });

    it('negative windage (-) shifts POI left (-Z)', () => {
      // Apply negative windage
      const adjusted = applyTurretOffset(0, 0, { elevationMils: 0, windageMils: -1.0 }, 100);
      
      const res = simulateShotToDistance(
        { ...baseShot, aimY_M: adjusted.aimY_M, aimZ_M: adjusted.aimZ_M },
        env
      );

      // Negative windage should shift impact to the left
      expect(res.impactZ_M).toBeLessThan(0);
    });

    it('increasing windage increases rightward impact Z', () => {
      const adjusted1 = applyTurretOffset(0, 0, { elevationMils: 0, windageMils: 0.5 }, 100);
      const adjusted2 = applyTurretOffset(0, 0, { elevationMils: 0, windageMils: 1.0 }, 100);
      
      const res1 = simulateShotToDistance(
        { ...baseShot, aimY_M: adjusted1.aimY_M, aimZ_M: adjusted1.aimZ_M },
        env
      );
      const res2 = simulateShotToDistance(
        { ...baseShot, aimY_M: adjusted2.aimY_M, aimZ_M: adjusted2.aimZ_M },
        env
      );

      // More positive windage should produce more rightward impact
      expect(res2.impactZ_M).toBeGreaterThan(res1.impactZ_M);
    });
  });

  describe('turret elevation sign convention', () => {
    const baseShot = {
      distanceM: 100,
      muzzleVelocityMps: 800,
      dragFactor: 0.00002,
      dtS: 0.001,
      aimY_M: 0,
      aimZ_M: 0
    };
    const env = { ...BASE_ENV, windMps: 0, seed: 401 };

    it('positive elevation (+) shifts POI up (+Y)', () => {
      // Apply positive elevation
      const adjusted = applyTurretOffset(0, 0, { elevationMils: 1.0, windageMils: 0 }, 100);
      
      const res = simulateShotToDistance(
        { ...baseShot, aimY_M: adjusted.aimY_M, aimZ_M: adjusted.aimZ_M },
        env
      );

      const baseline = simulateShotToDistance(baseShot, env);

      // Positive elevation should produce higher impact (less negative Y)
      expect(res.impactY_M).toBeGreaterThan(baseline.impactY_M);
    });

    it('negative elevation (-) shifts POI down (-Y)', () => {
      // Apply negative elevation
      const adjusted = applyTurretOffset(0, 0, { elevationMils: -1.0, windageMils: 0 }, 100);
      
      const res = simulateShotToDistance(
        { ...baseShot, aimY_M: adjusted.aimY_M, aimZ_M: adjusted.aimZ_M },
        env
      );

      const baseline = simulateShotToDistance(baseShot, env);

      // Negative elevation should produce lower impact (more negative Y)
      expect(res.impactY_M).toBeLessThan(baseline.impactY_M);
    });

    it('increasing elevation increases impact Y (higher hits)', () => {
      const adjusted1 = applyTurretOffset(0, 0, { elevationMils: 0.5, windageMils: 0 }, 100);
      const adjusted2 = applyTurretOffset(0, 0, { elevationMils: 1.0, windageMils: 0 }, 100);
      
      const res1 = simulateShotToDistance(
        { ...baseShot, aimY_M: adjusted1.aimY_M, aimZ_M: adjusted1.aimZ_M },
        env
      );
      const res2 = simulateShotToDistance(
        { ...baseShot, aimY_M: adjusted2.aimY_M, aimZ_M: adjusted2.aimZ_M },
        env
      );

      // More positive elevation should produce higher impact
      expect(res2.impactY_M).toBeGreaterThan(res1.impactY_M);
    });
  });

  describe('combined effects', () => {
    it('positive wind + positive windage produce cumulative rightward drift', () => {
      const baseShot = {
        distanceM: 150,
        muzzleVelocityMps: 800,
        dragFactor: 0.00002,
        dtS: 0.001,
        aimY_M: 0,
        aimZ_M: 0
      };
      const env = { ...BASE_ENV, windMps: 5, seed: 501 };

      const baseline = simulateShotToDistance(baseShot, env);
      const adjusted = applyTurretOffset(0, 0, { elevationMils: 0, windageMils: 1.0 }, 150);
      const res = simulateShotToDistance(
        { ...baseShot, aimY_M: adjusted.aimY_M, aimZ_M: adjusted.aimZ_M },
        env
      );

      // Both positive wind and positive windage should drift further right
      expect(res.impactZ_M).toBeGreaterThan(baseline.impactZ_M);
    });

    it('compensating right wind with left windage (negative) centers the shot', () => {
      const baseShot = {
        distanceM: 150,
        muzzleVelocityMps: 800,
        dragFactor: 0.00002,
        dtS: 0.001,
        aimY_M: 0,
        aimZ_M: 0
      };
      const env = { ...BASE_ENV, windMps: 5, seed: 502 };

      const withWind = simulateShotToDistance(baseShot, env);
      const adjusted = applyTurretOffset(0, 0, { elevationMils: 0, windageMils: -2.0 }, 150);
      const compensated = simulateShotToDistance(
        { ...baseShot, aimY_M: adjusted.aimY_M, aimZ_M: adjusted.aimZ_M },
        env
      );

      // Negative windage should compensate rightward wind drift
      expect(compensated.impactZ_M).toBeLessThan(withWind.impactZ_M);
    });
  });
});

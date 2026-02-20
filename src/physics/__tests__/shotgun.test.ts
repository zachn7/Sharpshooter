import { describe, it, expect } from 'vitest';
import {
  milsToSpreadMeters,
  shotgunSpreadRadius,
  samplePelletImpacts,
  countPelletsOnTarget,
  getBestPelletOnBullseye,
  type ShotgunPatternConfig,
  type PelletImpact,
} from '../shotgun';

describe('shotgun pattern engine', () => {
  describe('milsToSpreadMeters', () => {
    it('converts MILs to meters correctly', () => {
      // 1 MIL at 100m = 0.1m diameter, 0.05m radius
      const radius1mils = milsToSpreadMeters(1, 100);
      expect(radius1mils).toBeCloseTo(0.05, 6);
    });

    it('scales linearly with distance', () => {
      const spread25m = milsToSpreadMeters(10, 25);
      const spread50m = milsToSpreadMeters(10, 50);
      const spread100m = milsToSpreadMeters(10, 100);
      
      expect(spread50m).toBeCloseTo(spread25m * 2, 6);
      expect(spread100m).toBeCloseTo(spread25m * 4, 6);
    });

    it('scales linearly with MILs', () => {
      const spread5mils = milsToSpreadMeters(5, 50);
      const spread10mils = milsToSpreadMeters(10, 50);
      const spread20mils = milsToSpreadMeters(20, 50);
      
      expect(spread10mils).toBeCloseTo(spread5mils * 2, 6);
      expect(spread20mils).toBeCloseTo(spread10mils * 2, 6);
    });
  });

  describe('shotgunSpreadRadius', () => {
    it('applies choke modifiers correctly', () => {
      const distance = 50;
      const baseSpread = 20; // MILs

      const cylinderSpread = shotgunSpreadRadius(distance, baseSpread, 'cylinder');
      const fullSpread = shotgunSpreadRadius(distance, baseSpread, 'full');
      const modifiedSpread = shotgunSpreadRadius(distance, baseSpread, 'modified');

      // Cylinder should be widest
      expect(cylinderSpread).toBeGreaterThan(modifiedSpread);
      expect(cylinderSpread).toBeGreaterThan(fullSpread);

      // Full should be tightest
      expect(fullSpread).toBeLessThan(modifiedSpread);
      expect(fullSpread).toBeLessThan(cylinderSpread);
    });

    it('uses correct choke modifier values', () => {
      const distance = 50;
      const baseSpread = 20; // MILs

      const cylinder = shotgunSpreadRadius(distance, baseSpread, 'cylinder');
      const improvedCylinder = shotgunSpreadRadius(distance, baseSpread, 'improved-cylinder');
      const modified = shotgunSpreadRadius(distance, baseSpread, 'modified');
      const improvedModified = shotgunSpreadRadius(distance, baseSpread, 'improved-modified');
      const full = shotgunSpreadRadius(distance, baseSpread, 'full');

      // Verify approximate modifier ratios
      expect(improvedCylinder / cylinder).toBeCloseTo(0.8, 6);
      expect(modified / cylinder).toBeCloseTo(0.65, 6);
      expect(improvedModified / cylinder).toBeCloseTo(0.55, 6);
      expect(full / cylinder).toBeCloseTo(0.45, 6);
    });
  });

  describe('samplePelletImpacts determinism', () => {
    const baseConfig: ShotgunPatternConfig = {
      distanceM: 50,
      pelletCount: 10,
      baseSpreadMils: 20,
      choke: 'modified',
      seed: 12345,
    };

    it('same seed produces same pellet offsets', () => {
      const pellets1 = samplePelletImpacts(baseConfig);
      const pellets2 = samplePelletImpacts(baseConfig);

      expect(pellets1).toHaveLength(pellets2.length);

      pellets1.forEach((pellet1, i) => {
        const pellet2 = pellets2[i];
        expect(pellet1.dY).toBeCloseTo(pellet2.dY, 10);
        expect(pellet1.dZ).toBeCloseTo(pellet2.dZ, 10);
      });
    });

    it('different seeds produce different pellet offsets', () => {
      const pellets1 = samplePelletImpacts({ ...baseConfig, seed: 12345 });
      const pellets2 = samplePelletImpacts({ ...baseConfig, seed: 54321 });

      // Should have different offsets
      expect(pellets1[0].dY).not.toBeCloseTo(pellets2[0].dY, 6);
      expect(pellets1[0].dZ).not.toBeCloseTo(pellets2[0].dZ, 6);
    });

    it('string seeds produce deterministic results', () => {
      const pellets1 = samplePelletImpacts({ ...baseConfig, seed: 'test-seed-1' });
      const pellets2 = samplePelletImpacts({ ...baseConfig, seed: 'test-seed-1' });
      const pellets3 = samplePelletImpacts({ ...baseConfig, seed: 'test-seed-2' });

      expect(pellets1).toEqual(pellets2);
      expect(pellets1).not.toEqual(pellets3);
    });

    it('produces requested number of pellets', () => {
      const config5 = { ...baseConfig, pelletCount: 5 };
      const config10 = { ...baseConfig, pelletCount: 10 };
      const config20 = { ...baseConfig, pelletCount: 20 };

      expect(samplePelletImpacts(config5)).toHaveLength(5);
      expect(samplePelletImpacts(config10)).toHaveLength(10);
      expect(samplePelletImpacts(config20)).toHaveLength(20);
    });

    it('caps pellet count at 50 for performance', () => {
      const config50 = { ...baseConfig, pelletCount: 50 };
      const config100 = { ...baseConfig, pelletCount: 100 };
      const config500 = { ...baseConfig, pelletCount: 500 };

      expect(samplePelletImpacts(config50)).toHaveLength(50);
      expect(samplePelletImpacts(config100)).toHaveLength(50);
      expect(samplePelletImpacts(config500)).toHaveLength(50);
    });

    it('all pellets are within spread radius', () => {
      const pellets = samplePelletImpacts(baseConfig);
      const spreadRadius = shotgunSpreadRadius(
        baseConfig.distanceM,
        baseConfig.baseSpreadMils,
        baseConfig.choke
      );

      pellets.forEach(pellet => {
        const distanceFromCenter = Math.sqrt(pellet.dY ** 2 + pellet.dZ ** 2);
        expect(distanceFromCenter).toBeLessThanOrEqual(spreadRadius * 1.001); // Add tiny tolerance
      });
    });

    it('produces at least one pellet even with count 1', () => {
      const config = { ...baseConfig, pelletCount: 1 };
      const pellets = samplePelletImpacts(config);
      expect(pellets).toHaveLength(1);
      expect(pellets[0]).toHaveProperty('dY');
      expect(pellets[0]).toHaveProperty('dZ');
    });
  });

  describe('samplePelletImpacts spread scaling', () => {
    it('higher distance yields larger spread in meters', () => {
      const config25m: ShotgunPatternConfig = {
        distanceM: 25,
        pelletCount: 10,
        baseSpreadMils: 20,
        choke: 'cylinder',
        seed: 12345,
      };

      const config50m: ShotgunPatternConfig = {
        ...config25m,
        distanceM: 50,
      };

      const pellets25m = samplePelletImpacts(config25m);
      const pellets50m = samplePelletImpacts(config50m);

      // Calculate average distance from center for each configuration
      const avgDist25m = pellets25m.reduce((sum, p) => sum + Math.sqrt(p.dY ** 2 + p.dZ ** 2), 0) / pellets25m.length;
      const avgDist50m = pellets50m.reduce((sum, p) => sum + Math.sqrt(p.dY ** 2 + p.dZ ** 2), 0) / pellets50m.length;

      // Higher distance should produce larger spread (approximately 2x)
      expect(avgDist50m).toBeGreaterThan(avgDist25m);
      expect(avgDist50m / avgDist25m).toBeGreaterThan(1.8); // Should be ~2x
    });

    it('higher baseSpreadMils yields larger spread', () => {
      const config10mils: ShotgunPatternConfig = {
        distanceM: 50,
        pelletCount: 10,
        baseSpreadMils: 10,
        choke: 'cylinder',
        seed: 12345,
      };

      const config20mils: ShotgunPatternConfig = {
        ...config10mils,
        baseSpreadMils: 20,
      };

      const pellets10mils = samplePelletImpacts(config10mils);
      const pellets20mils = samplePelletImpacts(config20mils);

      const avgDist10mils = pellets10mils.reduce((sum, p) => sum + Math.sqrt(p.dY ** 2 + p.dZ ** 2), 0) / pellets10mils.length;
      const avgDist20mils = pellets20mils.reduce((sum, p) => sum + Math.sqrt(p.dY ** 2 + p.dZ ** 2), 0) / pellets20mils.length;

      expect(avgDist20mils).toBeGreaterThan(avgDist10mils);
      expect(avgDist20mils / avgDist10mils).toBeGreaterThan(1.8); // Should be ~2x
    });

    it('choke affects pattern tightness', () => {
      const configCylinder: ShotgunPatternConfig = {
        distanceM: 50,
        pelletCount: 15,
        baseSpreadMils: 20,
        choke: 'cylinder',
        seed: 12345,
      };

      const configFull: ShotgunPatternConfig = {
        ...configCylinder,
        choke: 'full',
      };

      const pelletsCylinder = samplePelletImpacts(configCylinder);
      const pelletsFull = samplePelletImpacts(configFull);

      const avgDistCylinder = pelletsCylinder.reduce((sum, p) => sum + Math.sqrt(p.dY ** 2 + p.dZ ** 2), 0) / pelletsCylinder.length;
      const avgDistFull = pelletsFull.reduce((sum, p) => sum + Math.sqrt(p.dY ** 2 + p.dZ ** 2), 0) / pelletsFull.length;

      // Full choke should be tighter than cylinder
      expect(avgDistCylinder).toBeGreaterThan(avgDistFull);
    });
  });

  describe('countPelletsOnTarget', () => {
    it('counts pellets within target radius', () => {
      const pellets: PelletImpact[] = [
        { dY: 0, dZ: 0 },      // Center hit
        { dY: 0.3, dZ: 0 },    // Inside 0.5m radius
        { dY: -0.4, dZ: 0.3 }, // Inside 0.5m radius
        { dY: 0.6, dZ: 0 },    // Outside 0.5m radius
        { dY: 0, dZ: 0.8 },    // Outside 0.5m radius
      ];

      const count = countPelletsOnTarget(pellets, 0.5);
      expect(count).toBe(3);
    });

    it('returns 0 for empty pellet array', () => {
      const count = countPelletsOnTarget([], 0.5);
      expect(count).toBe(0);
    });

    it('counts pellets on the edge as hits', () => {
      const pellets: PelletImpact[] = [
        { dY: 0.5, dZ: 0 },      // Exactly on edge
        { dY: -0.5, dZ: 0 },     // Exactly on edge
        { dY: 0.499, dZ: 0 },    // Just inside
      ];

      const count = countPelletsOnTarget(pellets, 0.5);
      expect(count).toBe(3);
    });
  });

  describe('getBestPelletOnBullseye', () => {
    it('returns pellet closest to center', () => {
      const pellets: PelletImpact[] = [
        { dY: 0.3, dZ: 0.2 },    // Distance ≈ 0.36m
        { dY: 0.1, dZ: 0.05 },   // Distance ≈ 0.11m (best)
        { dY: 0.5, dZ: 0.4 },    // Distance ≈ 0.64m
      ];

      const best = getBestPelletOnBullseye(pellets);
      expect(best).toBeDefined();
      expect(best?.dY).toBeCloseTo(0.1, 6);
      expect(best?.dZ).toBeCloseTo(0.05, 6);
    });

    it('returns undefined for empty pellet array', () => {
      const best = getBestPelletOnBullseye([]);
      expect(best).toBeUndefined();
    });

    it('handles single pellet correctly', () => {
      const pellets: PelletImpact[] = [
        { dY: 0.3, dZ: 0.2 },
      ];

      const best = getBestPelletOnBullseye(pellets);
      expect(best).toEqual(pellets[0]);
    });

    it('returns pellet at center if available', () => {
      const pellets: PelletImpact[] = [
        { dY: 0.3, dZ: 0.2 },
        { dY: 0, dZ: 0 },        // Perfect center
        { dY: 0.1, dZ: 0.1 },
      ];

      const best = getBestPelletOnBullseye(pellets);
      expect(best?.dY).toBeCloseTo(0, 6);
      expect(best?.dZ).toBeCloseTo(0, 6);
    });
  });

  describe('10-call determinism test', () => {
    it('produces identical results across 10 calls', () => {
      const config: ShotgunPatternConfig = {
        distanceM: 50,
        pelletCount: 20,
        baseSpreadMils: 15,
        choke: 'modified',
        seed: 'test-determinism',
      };

      const results: PelletImpact[][] = [];

      // Generate 10 identical runs
      for (let i = 0; i < 10; i++) {
        results.push(samplePelletImpacts(config));
      }

      // All runs should be identical
      const firstRun = results[0];
      results.slice(1).forEach(run => {
        expect(run).toEqual(firstRun);
      });
    });
  });
});

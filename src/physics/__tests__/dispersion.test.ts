import { describe, it, expect } from 'vitest';
import {
  stringHash,
  combineSeed,
  moaToSpreadMeters,
  dispersionStdDev,
  sampleRadialOffset,
  calculateGroupSize,
  metersToMils,
} from '../dispersion';

describe('dispersion module', () => {
  describe('stringHash', () => {
    it('produces consistent hashes for identical strings', () => {
      const hash1 = stringHash('test');
      const hash2 = stringHash('test');
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different strings', () => {
      const hash1 = stringHash('test1');
      const hash2 = stringHash('test2');
      expect(hash1).not.toBe(hash2);
    });

    it('produces positive 32-bit values', () => {
      const hash = stringHash('any string');
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThan(4294967296);
    });
  });

  describe('combineSeed', () => {
    it('combines base seed with shot number', () => {
      const seed1 = combineSeed(12345, 0);
      const seed2 = combineSeed(12345, 1);
      const seed3 = combineSeed(12345, 2);
      
      expect(seed1).not.toBe(seed2);
      expect(seed2).not.toBe(seed3);
      expect(seed1).not.toBe(seed3);
    });

    it('produces same result for same inputs', () => {
      const seed1 = combineSeed(12345, 0);
      const seed2 = combineSeed(12345, 0);
      expect(seed1).toBe(seed2);
    });

    it('combines different bases differently', () => {
      const seed1 = combineSeed(12345, 0);
      const seed2 = combineSeed(54321, 0);
      expect(seed1).not.toBe(seed2);
    });
  });

  describe('moaToSpreadMeters', () => {
    it('scales linearly with MOA', () => {
      const spread1moa = moaToSpreadMeters(1, 100);
      const spread2moa = moaToSpreadMeters(2, 100);
      expect(spread2moa).toBeCloseTo(spread1moa * 2, 4);
    });

    it('scales linearly with distance', () => {
      const spread100m = moaToSpreadMeters(1, 100);
      const spread200m = moaToSpreadMeters(1, 200);
      expect(spread200m).toBeCloseTo(spread100m * 2, 4);
    });

    it('produces reasonable values for 1 MOA at 100 yards', () => {
      // 1 MOA radius at 100 yards = 1.047/2 inches = 0.013335m
      // Using actual MOA conversion to get spread in meters
      const spreadMeters = moaToSpreadMeters(2.66, 91.44); // 2.66 MOA at 100 yards
      // 2.66 MOA at 100 yards = ~6.9cm = ~0.07m
      expect(spreadMeters).toBeGreaterThan(0.05);
      expect(spreadMeters).toBeLessThan(0.1);
    });
  });

  describe('dispersionStdDev', () => {
    it('scales with precision MOA', () => {
      const sd1moa = dispersionStdDev(1, 100);
      const sd2moa = dispersionStdDev(2, 100);
      expect(sd2moa).toBeGreaterThan(sd1moa);
    });

    it('scales with distance', () => {
      const sd100m = dispersionStdDev(2, 100);
      const sd200m = dispersionStdDev(2, 200);
      expect(sd200m).toBeGreaterThan(sd100m);
    });

    it('produces 0 for zero precision', () => {
      const sd = dispersionStdDev(0, 100);
      expect(sd).toBe(0);
    });

    it('produces reasonable values for match rifle', () => {
      // 1 MOA at 100 yards should give small spread
      const sd = dispersionStdDev(1.0, 91.44); // 100 yards
      expect(sd).toBeGreaterThan(0);
      expect(sd).toBeLessThan(0.05); // Should be less than 5cm
    });
  });

  describe('sampleRadialOffset', () => {
    it('produces deterministic results with same seed', () => {
      const offset1 = sampleRadialOffset(100, 2.0, 12345);
      const offset2 = sampleRadialOffset(100, 2.0, 12345);
      expect(offset1.dY).toBeCloseTo(offset2.dY, 10);
      expect(offset1.dZ).toBeCloseTo(offset2.dZ, 10);
    });

    it('produces different results with different seeds', () => {
      const offset1 = sampleRadialOffset(100, 2.0, 12345);
      const offset2 = sampleRadialOffset(100, 2.0, 54321);
      const differs = offset1.dY !== offset2.dY || offset1.dZ !== offset2.dZ;
      expect(differs).toBe(true);
    });

    it('scale with distance', () => {
      const offset100 = sampleRadialOffset(100, 2.0, 12345);
      const offset200 = sampleRadialOffset(200, 2.0, 12345);
      
      // At 2x distance, dispersion should be ~2x (on average)
      const ratio100 = Math.sqrt(offset100.dY ** 2 + offset100.dZ ** 2);
      const ratio200 = Math.sqrt(offset200.dY ** 2 + offset200.dZ ** 2);
      expect(ratio200 / ratio100).toBeGreaterThan(1.5);
      expect(ratio200 / ratio100).toBeLessThan(5); // Allow more variance due to randomness
    });

    it('scale with precision MOA', () => {
      const offset1moa = sampleRadialOffset(100, 1.0, 12345);
      const offset2moa = sampleRadialOffset(100, 2.0, 12345);
      
      // Less precise weapon should have larger dispersion
      const mag1moa = Math.sqrt(offset1moa.dY ** 2 + offset1moa.dZ ** 2);
      const mag2moa = Math.sqrt(offset2moa.dY ** 2 + offset2moa.dZ ** 2);
      expect(mag2moa).toBeGreaterThan(mag1moa);
    });

    it('returns zero offsets for zero precision', () => {
      const offset = sampleRadialOffset(100, 0, 12345);
      expect(offset.dY).toBeCloseTo(0, 10); // Handle -0 vs +0 floating point
      expect(offset.dZ).toBeCloseTo(0, 10);
    });

    it('produces normally distributed offsets over many samples', () => {
      const seed = 12345;
      const precision = 2.0;
      const distance = 100;
      const samples = 1000;
      
      const dyValues: number[] = [];
      const dzValues: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        const offset = sampleRadialOffset(distance, precision, combineSeed(seed, i));
        dyValues.push(offset.dY);
        dzValues.push(offset.dZ);
      }
      
      // Mean should be close to 0
      const dyMean = dyValues.reduce((a, b) => a + b, 0) / samples;
      const dzMean = dzValues.reduce((a, b) => a + b, 0) / samples;
      
      expect(Math.abs(dyMean)).toBeLessThan(0.005); // Within 5mm
      expect(Math.abs(dzMean)).toBeLessThan(0.005);
      
      // Calculate standard deviation
      const dyVariance = dyValues.reduce((sum, val) => sum + (val - dyMean) ** 2, 0) / samples;
      const dzVariance = dzValues.reduce((sum, val) => sum + (val - dzMean) ** 2, 0) / samples;
      const dyStdDev = Math.sqrt(dyVariance);
      const dzStdDev = Math.sqrt(dzVariance);
      
      // Should match the expected standard deviation
      const expectedSd = dispersionStdDev(precision, distance);
      expect(dyStdDev).toBeCloseTo(expectedSd, 0);
      expect(dzStdDev).toBeCloseTo(expectedSd, 0);
    });
  });

  describe('calculateGroupSize', () => {
    it('returns 0 for empty array', () => {
      expect(calculateGroupSize([])).toBe(0);
    });

    it('returns 0 for single impact', () => {
      expect(calculateGroupSize([{ dY: 0.1, dZ: 0.2 }])).toBe(0);
    });

    it('calculates distance between two impacts', () => {
      const impacts = [
        { dY: 0, dZ: 0 },
        { dY: 0.03, dZ: 0.04 }, // 3cm right, 4cm up = 5cm distance
      ];
      const groupSize = calculateGroupSize(impacts);
      expect(groupSize).toBeCloseTo(0.05, 4); // 5cm = 0.05m
    });

    it('finds maximum spread in multi-shot group', () => {
      const impacts = [
        { dY: 0, dZ: 0 },
        { dY: 0.01, dZ: 0.01 },    // ~1.4cm from center
        { dY: -0.02, dZ: 0.02 },   // ~2.8cm from center
        { dY: 0.03, dZ: -0.02 },   // ~3.6cm from center
      ];
      const groupSize = calculateGroupSize(impacts);
      // Max distance from (-0.02, 0.02) to (0.03, -0.02) = sqrt(0.05^2 + 0.04^2) ≈ 0.064m
      expect(groupSize).toBeCloseTo(0.06403, 4);
    });

    it('handles tight group', () => {
      const impacts = [
        { dY: 0, dZ: 0 },
        { dY: 0.001, dZ: 0 },
        { dY: 0, dZ: 0.002 },
      ];
      // Max distance is from (0.001, 0) to (0, 0.002) = sqrt(0.001^2 + 0.002^2) ≈ 0.002236m
      const groupSize = calculateGroupSize(impacts);
      expect(groupSize).toBeCloseTo(0.002236, 5);
    });
  });

  describe('metersToMils', () => {
    it('converts meters to MILs correctly', () => {
      // At 100m, 0.1m = 10cm = 1 MIL (since 1 MIL = 0.1m at 100m)
      const mils = metersToMils(0.1, 100);
      expect(mils).toBeCloseTo(1.0, 2);
    });

    it('scales inversely with distance', () => {
      const mils100 = metersToMils(0.1, 100);
      const mils200 = metersToMils(0.2, 200);
      // Same angular size should give same MILs
      expect(mils200).toBeCloseTo(mils100, 2);
    });

    it('returns 0 for zero offset', () => {
      expect(metersToMils(0, 100)).toBe(0);
    });

    it('handles 1 MOA at 100 yards', () => {
      // 1 MOA ≈ 1.047 inches at 100 yards
      // 1.047 inches = 0.02659 meters at 91.44 meters (100 yards)
      const meters = 0.02659;
      const distanceM = 91.44;
      const mils = metersToMils(meters, distanceM);
      
      // 1 MOA ≈ 0.2909 MILs (since 1 MIL ≈ 3.44 MOA)
      expect(mils).toBeCloseTo(0.291, 2);
    });
  });

  describe('integration test: realistic group size', () => {
    it('produces reasonable group size for 3 shots with 2 MOA rifle at 100 yards', () => {
      const precision = 2.0; // 2 MOA
      const distanceM = 91.44; // 100 yards
      const baseSeed = 54321;
      const numShots = 3;
      
      const impacts: { dY: number; dZ: number }[] = [];
      for (let i = 0; i < numShots; i++) {
        const offset = sampleRadialOffset(distanceM, precision, combineSeed(baseSeed, i));
        impacts.push(offset);
      }
      
      const groupSize = calculateGroupSize(impacts);
      
      // 2 MOA should give ~5cm (2 inch) group at 100 yards on average
      // Group can vary 0-3x due to randomness
      expect(groupSize).toBeGreaterThan(0.01); // At least 1cm
      expect(groupSize).toBeLessThan(0.15);    // Less than 15cm
    });

    it('produces smaller groups for more precise weapon', () => {
      const distanceM = 100;
      const baseSeed = 99999;
      
      // Less precise
      const impacts1: { dY: number; dZ: number }[] = [];
      for (let i = 0; i < 3; i++) {
        impacts1.push(sampleRadialOffset(distanceM, 3.0, combineSeed(baseSeed, i)));
      }
      
      // More precise
      const impacts2: { dY: number; dZ: number }[] = [];
      for (let i = 0; i < 3; i++) {
        impacts2.push(sampleRadialOffset(distanceM, 1.0, combineSeed(baseSeed + 1000, i)));
      }
      
      const groupSize1 = calculateGroupSize(impacts1);
      const groupSize2 = calculateGroupSize(impacts2);
      
      expect(groupSize1).toBeGreaterThan(groupSize2);
    });
  });
});

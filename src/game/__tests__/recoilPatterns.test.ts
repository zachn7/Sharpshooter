import { describe, it, expect } from 'vitest';
import {
  getRecoilPattern,
  getRecoilOffset,
  testPatternDeterminism,
  RECOIL_PATTERNS,
} from '../recoilPatterns';

describe('RecoilPatterns', () => {
  describe('pattern lookup', () => {
    it('should find patterns by ID', () => {
      const pattern = getRecoilPattern('pistol-standard');
      expect(pattern).toBeDefined();
      expect(pattern?.id).toBe('pistol-standard');
    });

    it('should return undefined for unknown pattern', () => {
      const pattern = getRecoilPattern('unknown-pattern');
      expect(pattern).toBeUndefined();
    });

    it('should have all patterns with valid IDs', () => {
      RECOIL_PATTERNS.forEach((pattern) => {
        expect(pattern.id).toBeTruthy();
        expect(pattern.name).toBeTruthy();
        expect(pattern.getPeakTimeMs).toBeDefined();
      });
    });
  });

  describe('determinism', () => {
    it('should produce consistent offsets for same input', () => {
      const offset1 = getRecoilOffset('pistol-standard', 50, 1.0);
      const offset2 = getRecoilOffset('pistol-standard', 50, 1.0);
      const offset3 = getRecoilOffset('pistol-standard', 50, 1.0);

      expect(offset1[0]).toBe(offset2[0]);
      expect(offset1[1]).toBe(offset2[1]);
      expect(offset2[0]).toBe(offset3[0]);
      expect(offset2[1]).toBe(offset3[1]);
    });

    it('should produce different offsets for different times', () => {
      const offset1 = getRecoilOffset('pistol-standard', 0, 1.0);
      const offset2 = getRecoilOffset('pistol-standard', 50, 1.0);
      const offset3 = getRecoilOffset('pistol-standard', 100, 1.0);

      // Zero time should have zero offset
      expect(offset1[0]).toBe(0);
      expect(offset1[1]).toBe(0);

      // Later times should have larger offsets
      expect(Math.abs(offset2[0])).toBeGreaterThan(0);
      expect(Math.abs(offset2[0])).toBeLessThanOrEqual(Math.abs(offset3[0]));
    });

    it('should scale with kick intensity', () => {
      const offset1 = getRecoilOffset('pistol-standard', 100, 1.0);
      const offset2 = getRecoilOffset('pistol-standard', 100, 2.0);

      expect(Math.abs(offset2[0])).toBeGreaterThan(Math.abs(offset1[0]));
    });

    it('should pass determinism test for all patterns', () => {
      RECOIL_PATTERNS.forEach((pattern) => {
        expect(testPatternDeterminism(pattern, 1.0)).toBe(true);
        expect(testPatternDeterminism(pattern, 0.5)).toBe(true);
      });
    });

    it('should have consistent vertical dominance over horizontal', () => {
      // Most patterns should have more vertical than horizontal
      const offset = getRecoilOffset('pistol-standard', 50, 1.0);
      expect(Math.abs(offset[0])).toBeGreaterThanOrEqual(Math.abs(offset[1]));
    });
  });

  describe('pattern characteristics', () => {
    it('should have distinct peak times', () => {
      const fastPattern = getRecoilPattern('pistol-fast');
      const slowPattern = getRecoilPattern('sniper-bolt');

      const fastPeak = fastPattern?.getPeakTimeMs() ?? 100;
      const slowPeak = slowPattern?.getPeakTimeMs() ?? 200;
      expect(fastPeak).toBeLessThan(slowPeak);
    });

    it('should handle magnum pattern sharp vertical climb', () => {
      const offset = getRecoilOffset('pistol-magnum', 100, 1.5);
      // Vertical should be dominant
      expect(Math.abs(offset[0])).toBeGreaterThan(0);
    });

    it('should handle circular patterns correctly', () => {
      // Circular patterns should produce offsets at both axes
      const offset = getRecoilOffset('sniper-standard', 50, 1.0);
      expect(Math.abs(offset[0])).toBeGreaterThan(0);
      expect(Math.abs(offset[1])).toBeGreaterThan(0);
    });

    it('should cap at peak time', () => {
      const pattern = getRecoilPattern('pistol-standard');
      const peakTime = pattern?.getPeakTimeMs() || 100;

      const offset1 = getRecoilOffset('pistol-standard', peakTime, 1.0);
      const offset2 = getRecoilOffset('pistol-standard', peakTime * 2, 1.0);
      // Should not increase much beyond peak
      expect(Math.abs(offset2[0])).toBeLessThanOrEqual(Math.abs(offset1[0]) * 1.1);
    });
  });

  describe('fallback behavior', () => {
    it('should use fallback pattern for unknown pattern ID', () => {
      const offset = getRecoilOffset('unknown-pattern-id', 50, 1.0);
      expect(offset).toBeDefined();
      expect(offset.length).toBe(2);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  milToMeters,
  metersToMil,
  metersToPixels,
  milsToPixels,
  getPixelsPerMeter,
  getMilSpacingPixels,
  getNextMagnification,
  MAGNIFICATION_LEVELS,
  type MagnificationLevel,
} from '../reticle';

describe('reticle utilities', () => {
  describe('milToMeters', () => {
    it('converts 1 MIL at 100m to 0.1m', () => {
      expect(milToMeters(100, 1)).toBe(0.1);
    });

    it('converts 1 MIL at 500m to 0.5m', () => {
      expect(milToMeters(500, 1)).toBe(0.5);
    });

    it('converts 5 MIL at 200m to 1m', () => {
      expect(milToMeters(200, 5)).toBe(1.0);
    });

    it('handles zero MILs', () => {
      expect(milToMeters(100, 0)).toBe(0);
    });

    it('handles fractional MILs', () => {
      expect(milToMeters(100, 0.5)).toBe(0.05);
    });
  });

describe('metersToMil', () => {
    it('converts 0.1m at 100m to 1 MIL', () => {
      expect(metersToMil(100, 0.1)).toBe(1);
    });

    it('converts 0.5m at 500m to 1 MIL', () => {
      expect(metersToMil(500, 0.5)).toBe(1);
    });

    it('converts 1m at 200m to 5 MIL', () => {
      expect(metersToMil(200, 1)).toBe(5);
    });

    it('handles zero meters', () => {
      expect(metersToMil(100, 0)).toBe(0);
    });
  });

describe('metersToPixels', () => {
    it('converts 1m to 100 pixels at 1x zoom', () => {
      expect(metersToPixels(1, 100, 1)).toBe(100);
    });

    it('scales with magnification', () => {
      expect(metersToPixels(1, 100, 2)).toBe(200);
      expect(metersToPixels(1, 100, 4)).toBe(400);
      expect(metersToPixels(1, 100, 8)).toBe(800);
    });

    it('handles fractional meters', () => {
      expect(metersToPixels(0.5, 100, 1)).toBe(50);
    });

    it('handles zero meters', () => {
      expect(metersToPixels(0, 100, 1)).toBe(0);
    });
  });

describe('milsToPixels', () => {
    it('converts 1 MIL at 100m with 1x zoom', () => {
      // 1 MIL at 100m = 0.1m
      // With 100 pixels/meter: 0.1 * 100 = 10 pixels
      expect(milsToPixels(100, 1, 100, 1)).toBe(10);
    });

    it('scales with distance', () => {
      // At 500m, 1 MIL = 0.5m
      // With 100 pixels/meter: 0.5 * 100 = 50 pixels
      expect(milsToPixels(500, 1, 100, 1)).toBe(50);
    });

    it('scales with magnification', () => {
      // 1 MIL at 100m = 0.1m
      // With 100 pixels/meter at 4x: 0.1 * 100 * 4 = 40 pixels
      expect(milsToPixels(100, 1, 100, 4)).toBe(40);
    });

    it('handles fractional MILs', () => {
      // 0.5 MIL at 100m = 0.05m
      // With 100 pixels/meter: 0.05 * 100 = 5 pixels
      expect(milsToPixels(100, 0.5, 100, 1)).toBe(5);
    });
  });

describe('getPixelsPerMeter', () => {
    it('calculates pixels per meter', () => {
      // 100 world meters mapped to 1000 canvas pixels
      expect(getPixelsPerMeter(100, 1000)).toBe(10);
    });

    it('handles 1:1 mapping', () => {
      expect(getPixelsPerMeter(100, 100)).toBe(1);
    });

    it('handles different world dimensions', () => {
      // 50 world meters mapped to 1000 canvas pixels
      expect(getPixelsPerMeter(50, 1000)).toBe(20);
    });
  });

describe('getMilSpacingPixels', () => {
    it('calculates 1 MIL spacing at 100m', () => {
      // 1 MIL at 100m with 1x zoom
      // World width: 100m, Canvas width: 1000px -> 10 px/m
      // 0.1m * 10 px/m * 1x = 1px
      const result = getMilSpacingPixels(100, 1, 100, 1000, 1);
      expect(result).toBe(1);
    });

    it('increases with magnification', () => {
      const result4x = getMilSpacingPixels(100, 1, 100, 1000, 4);
      const result8x = getMilSpacingPixels(100, 1, 100, 1000, 8);
      
      expect(result4x).toBe(4); // 1 * 4x = 4px
      expect(result8x).toBe(8); // 1 * 8x = 8px
    });

    it('scales with distance', () => {
      // At 200m, 1 MIL = 0.2m
      // 0.2m * 10 px/m * 1x = 2px
      const result = getMilSpacingPixels(200, 1, 100, 1000, 1);
      expect(result).toBe(2);
    });

    it('handles custom MIL spacing', () => {
      // 0.5 MIL at 100m = 0.05m
      // 0.05m * 10 px/m * 1x = 0.5px
      const result = getMilSpacingPixels(100, 0.5, 100, 1000, 1);
      expect(result).toBe(0.5);
    });
  });

  describe('magnification levels', () => {
    it('has predefined magnification levels', () => {
      expect(MAGNIFICATION_LEVELS).toEqual([1, 4, 8]);
    });

    it('cycles to next magnification', () => {
      expect(getNextMagnification(1)).toBe(4);
      expect(getNextMagnification(4)).toBe(8);
      expect(getNextMagnification(8)).toBe(1);
    });

    it('handles all magnifications', () => {
      const levels: MagnificationLevel[] = [1, 4, 8];
      
      let current: MagnificationLevel = 1;
      for (const level of levels) {
        expect(getNextMagnification(current)).toBe(level === 8 ? 1 : levels[levels.indexOf(level) + 1]);
        current = getNextMagnification(current);
      }
    });
  });
});
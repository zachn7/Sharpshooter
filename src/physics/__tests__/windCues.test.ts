import { describe, it, expect } from 'vitest';
import {
  getDefaultShowNumericWind,
} from '../windCues';

describe('windCues module', () => {
  describe('getDefaultShowNumericWind', () => {
    it('returns true for arcade preset', () => {
      expect(getDefaultShowNumericWind('arcade')).toBe(true);
    });

    it('returns false for realistic preset', () => {
      expect(getDefaultShowNumericWind('realistic')).toBe(false);
    });

    it('returns false for expert preset', () => {
      expect(getDefaultShowNumericWind('expert')).toBe(false);
    });

    it('is consistent across calls', () => {
      const result1 = getDefaultShowNumericWind('arcade');
      const result2 = getDefaultShowNumericWind('arcade');
      expect(result1).toBe(result2);
    });
  });
});

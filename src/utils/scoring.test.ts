import { describe, it, expect } from 'vitest';
import { calculateRingScore, createStandardTarget } from './scoring';

describe('scoring', () => {
  describe('calculateRingScore', () => {
    const target = createStandardTarget(0.5, 0.375);

    it('returns 10 for bullseye (center)', () => {
      const impact = { x: 0.5, y: 0.375 };
      expect(calculateRingScore(impact, target)).toBe(10);
    });

    it('returns 9 for near-center impact', () => {
      const impact = { x: 0.55, y: 0.375 };
      expect(calculateRingScore(impact, target)).toBe(9);
    });

    it('returns 7 for mid-range impact', () => {
      const impact = { x: 0.7, y: 0.375 };
      expect(calculateRingScore(impact, target)).toBe(7);
    });

    it('returns 2 for outermost ring hit', () => {
      const impact = { x: 0.95, y: 0.375 };
      expect(calculateRingScore(impact, target)).toBe(2);
    });

    it('returns 1 for outer ring hit', () => {
      const impact = { x: 0.96, y: 0.375 };
      expect(calculateRingScore(impact, target)).toBe(1);
    });

    it('returns 6 for ring 6 hit', () => {
      const impact = { x: 0.75, y: 0.375 };
      expect(calculateRingScore(impact, target)).toBe(6);
    });

    it('returns 0 for miss outside all rings', () => {
      const impact = { x: 1.1, y: 0.375 };
      expect(calculateRingScore(impact, target)).toBe(0);
    });

    it('handles off-center impacts correctly', () => {
      const impact = { x: 0.5, y: 0.4 };
      expect(calculateRingScore(impact, target)).toBeLessThanOrEqual(10);
    });
  });

  describe('createStandardTarget', () => {
    it('creates target with correct center position', () => {
      const target = createStandardTarget(0.5, 0.375);
      expect(target.centerX).toBe(0.5);
      expect(target.centerY).toBe(0.375);
    });

    it('creates 10 scoring rings', () => {
      const target = createStandardTarget(0.5, 0.375);
      expect(target.rings).toHaveLength(10);
    });

    it('has rings with correct scores (10 down to 1)', () => {
      const target = createStandardTarget(0.5, 0.375);
      const scores = target.rings.map((ring) => ring.score);
      expect(scores).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    });

    it('has rings in increasing radius order', () => {
      const target = createStandardTarget(0.5, 0.375);
      const radii = target.rings.map((ring) => ring.radius);
      for (let i = 1; i < radii.length; i++) {
        expect(radii[i]).toBeGreaterThan(radii[i - 1]);
      }
    });
  });
});

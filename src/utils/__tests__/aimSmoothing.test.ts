import { describe, it, expect } from 'vitest';
import {
  smoothValue,
  smoothPoint,
  AimSmoother,
  createAimSmoother,
  isValidSmoothingFactor,
  getRecommendedSmoothing,
  clampFactor,
} from '../aimSmoothing';

describe('aimSmoothing', () => {
  describe('smoothValue', () => {
    it('should return current value when factor is 1 (no smoothing)', () => {
      const result = smoothValue(10, 5, 1.0);
      expect(result).toBe(10);
    });

    it('should return previous value when factor is 0 (max smoothing)', () => {
      const result = smoothValue(10, 5, 0.0);
      expect(result).toBe(5);
    });

    it('should apply intermediate smoothing with factor 0.5', () => {
      const result = smoothValue(10, 5, 0.5);
      expect(result).toBe(7.5);
    });

    it('should handle negative values', () => {
      const result = smoothValue(-10, -5, 0.5);
      expect(result).toBe(-7.5);
    });

    it('should handle zero values', () => {
      const result = smoothValue(0, 0, 0.5);
      expect(result).toBe(0);
    });
  });

  describe('smoothPoint', () => {
    it('should smooth both coordinates', () => {
      const result = smoothPoint(
        { x: 10, y: 20 },
        { x: 5, y: 10 },
        0.5
      );
      expect(result.x).toBe(7.5);
      expect(result.y).toBe(15);
    });

    it('should not mutate input objects', () => {
      const current = { x: 10, y: 20 };
      const previous = { x: 5, y: 10 };
      const currentCopy = { ...current };
      const previousCopy = { ...previous };
      smoothPoint(current, previous, 0.5);
      expect(current).toEqual(currentCopy);
      expect(previous).toEqual(previousCopy);
    });
  });

  describe('AimSmoother', () => {
    it('should return current on first update', () => {
      const smoother = new AimSmoother(0.5);
      const result = smoother.update({ x: 10, y: 20 });
      expect(result).toEqual({ x: 10, y: 20 });
    });

    it('should apply smoothing on subsequent updates', () => {
      const smoother = new AimSmoother(0.5);
      smoother.update({ x: 0, y: 0 });
      const result = smoother.update({ x: 10, y: 20 });
      expect(result.x).toBe(5);
      expect(result.y).toBe(10);
    });

    it('should maintain smoothing over multiple updates', () => {
      const smoother = new AimSmoother(0.5);
      smoother.update({ x: 0, y: 0 });
      const result1 = smoother.update({ x: 10, y: 10 });
      const result2 = smoother.update({ x: 20, y: 20 });
      expect(result1.x).toBe(5);
      expect(result2.x).toBe(12.5);
    });

    it('should reset internal state', () => {
      const smoother = new AimSmoother(0.5);
      smoother.update({ x: 0, y: 0 });
      smoother.update({ x: 10, y: 10 });
      smoother.reset();
      const result = smoother.update({ x: 5, y: 5 });
      expect(result).toEqual({ x: 5, y: 5 });
    });

    it('should set and get smoothing factor', () => {
      const smoother = new AimSmoother(0.5);
      expect(smoother.getSmoothingFactor()).toBe(0.5);
      smoother.setSmoothingFactor(0.8);
      expect(smoother.getSmoothingFactor()).toBe(0.8);
    });

    it('should clamp smoothing factor on set', () => {
      const smoother = new AimSmoother(0.5);
      smoother.setSmoothingFactor(1.5);
      expect(smoother.getSmoothingFactor()).toBe(1.0);
      smoother.setSmoothingFactor(-0.5);
      expect(smoother.getSmoothingFactor()).toBe(0.0);
    });
  });

  describe('createAimSmoother', () => {
    it('should create smoother with default factor', () => {
      const smoother = createAimSmoother();
      expect(smoother.getSmoothingFactor()).toBe(0.3);
    });

    it('should create smoother with custom factor', () => {
      const smoother = createAimSmoother(0.7);
      expect(smoother.getSmoothingFactor()).toBe(0.7);
    });
  });

  describe('clampFactor', () => {
    it('should not change valid factors', () => {
      expect(clampFactor(0.0)).toBe(0.0);
      expect(clampFactor(0.5)).toBe(0.5);
      expect(clampFactor(1.0)).toBe(1.0);
    });

    it('should clamp to minimum', () => {
      expect(clampFactor(-0.1)).toBe(0.0);
      expect(clampFactor(-1.0)).toBe(0.0);
    });

    it('should clamp to maximum', () => {
      expect(clampFactor(1.5)).toBe(1.0);
      expect(clampFactor(2.0)).toBe(1.0);
    });
  });

  describe('isValidSmoothingFactor', () => {
    it('should accept valid factors', () => {
      expect(isValidSmoothingFactor(0.0)).toBe(true);
      expect(isValidSmoothingFactor(0.5)).toBe(true);
      expect(isValidSmoothingFactor(1.0)).toBe(true);
    });

    it('should reject invalid factors', () => {
      expect(isValidSmoothingFactor(-0.1)).toBe(false);
      expect(isValidSmoothingFactor(1.1)).toBe(false);
      expect(isValidSmoothingFactor(1.5)).toBe(false);
    });
  });

  describe('getRecommendedSmoothing', () => {
    it('should recommend high smoothing for mobile touch', () => {
      const factor = getRecommendedSmoothing(true, true);
      expect(factor).toBe(0.4);
    });

    it('should recommend moderate smoothing for touch', () => {
      const factor = getRecommendedSmoothing(true, false);
      expect(factor).toBe(0.3);
    });

    it('should recommend low smoothing for mouse', () => {
      const factor = getRecommendedSmoothing(false, false);
      expect(factor).toBe(0.2);
    });
  });
});
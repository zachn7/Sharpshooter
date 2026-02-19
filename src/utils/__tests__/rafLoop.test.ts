import { describe, it, expect } from 'vitest';
import { clampDelta, shouldSubstep } from '../rafLoop';

describe('clampDelta', () => {
  it('returns the delta time as-is when within limits', () => {
    expect(clampDelta(16, 16.67)).toBe(16);
    expect(clampDelta(33, 50)).toBe(33);
    expect(clampDelta(50, 50)).toBe(50);
  });
  
  it('clamps to minimum when delta is too small', () => {
    expect(clampDelta(0, 16.67)).toBe(0);
    expect(clampDelta(-10, 16.67)).toBe(0);
  });
  
  it('clamps to maximum when delta is too large', () => {
    expect(clampDelta(100, 50)).toBe(50);
    expect(clampDelta(200, 50)).toBe(50);
  });
  
  it('handles edge cases', () => {
    expect(clampDelta(Infinity, 50)).toBe(50);
    expect(clampDelta(-Infinity, 50)).toBe(0);
    expect(clampDelta(NaN, 50)).toBe(0);
  });
});

describe('shouldSubstep', () => {
  it('returns false when delta is below substep threshold', () => {
    expect(shouldSubstep(16, 33)).toBe(false);
    expect(shouldSubstep(20, 33)).toBe(false);
  });
  
  it('returns true when delta exceeds substep threshold', () => {
    expect(shouldSubstep(50, 33)).toBe(true);
    expect(shouldSubstep(100, 33)).toBe(true);
  });
  
  it('returns false when delta equals threshold', () => {
    expect(shouldSubstep(33, 33)).toBe(false);
  });
});
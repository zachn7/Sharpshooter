import { describe, it, expect } from 'vitest';
import {
  quantizeToClick,
  nextClickValue,
  milsToMeters,
  metersToMils,
  createDefaultTurretState,
  formatTurretState,
  applyTurretOffset,
  resetTurretState,
  type TurretState,
} from '../turret';

describe('quantizeToClick', () => {
  it('quantizes to 0.1 mil clicks', () => {
    expect(quantizeToClick(0.123, 0.1)).toBe(0.1);
    expect(quantizeToClick(0.156, 0.1)).toBe(0.2);
    expect(quantizeToClick(0.950, 0.1)).toBe(0.9); // 0.95 rounds to nearest 0.1
  });

  it('handles negative values', () => {
    expect(quantizeToClick(-0.123, 0.1)).toBe(-0.1);
    expect(quantizeToClick(-0.156, 0.1)).toBe(-0.2);
  });

  it('handles zero', () => {
    expect(quantizeToClick(0, 0.1)).toBe(0);
  });

  it('uses custom click size', () => {
    expect(quantizeToClick(0.25, 0.25)).toBe(0.25);
    expect(quantizeToClick(0.26, 0.25)).toBe(0.25);
    expect(quantizeToClick(0.51, 0.25)).toBe(0.5);
  });
});

describe('nextClickValue', () => {
  it('increments by 0.1 mil', () => {
    expect(nextClickValue(0.0, 1, 0.1)).toBe(0.1);
    expect(nextClickValue(0.1, 1, 0.1)).toBe(0.2);
    expect(nextClickValue(1.5, 1, 0.1)).toBe(1.6);
  });

  it('decrements by 0.1 mil', () => {
    expect(nextClickValue(0.1, -1, 0.1)).toBe(0.0);
    expect(nextClickValue(0.2, -1, 0.1)).toBe(0.1);
    expect(nextClickValue(1.5, -1, 0.1)).toBeCloseTo(1.4, 10);
  });

  it('quantizes unquantized input before stepping', () => {
    expect(nextClickValue(0.15, 1, 0.1)).toBe(0.2); // 0.15 -> 0.1 -> 0.2
    expect(nextClickValue(0.99, 1, 0.1)).toBeCloseTo(1.1, 10); // 0.99 -> 1.0 -> 1.1
  });

  it('crosses zero correctly', () => {
    expect(nextClickValue(0.0, -1, 0.1)).toBe(-0.1);
    expect(nextClickValue(-0.1, 1, 0.1)).toBe(0.0);
  });
});

describe('milsToMeters', () => {
  it('converts 1 MIL at 100m to 0.1m', () => {
    expect(milsToMeters(100, 1)).toBe(0.1);
  });

  it('converts 5 MIL at 100m to 0.5m', () => {
    expect(milsToMeters(100, 5)).toBe(0.5);
  });

  it('converts at different distances', () => {
    expect(milsToMeters(200, 1)).toBe(0.2);
    expect(milsToMeters(500, 1)).toBe(0.5);
    expect(milsToMeters(1000, 1)).toBe(1.0);
  });

  it('handles negative MILs', () => {
    expect(milsToMeters(100, -1)).toBe(-0.1);
    expect(milsToMeters(200, -5)).toBe(-1.0);
  });

  it('handles fractional MILs', () => {
    expect(milsToMeters(100, 0.5)).toBeCloseTo(0.05, 10);
    expect(milsToMeters(100, 0.1)).toBeCloseTo(0.01, 10);
  });
});

describe('metersToMils', () => {
  it('converts 0.1m at 100m to 1 MIL', () => {
    expect(metersToMils(100, 0.1)).toBe(1);
  });

  it('converts at different distances', () => {
    expect(metersToMils(200, 0.2)).toBe(1);
    expect(metersToMils(500, 0.5)).toBe(1);
  });

  it('handles negative meters', () => {
    expect(metersToMils(100, -0.1)).toBe(-1);
  });
});

describe('createDefaultTurretState', () => {
  it('creates zeroed turret state', () => {
    const state = createDefaultTurretState();
    expect(state.elevationMils).toBe(0.0);
    expect(state.windageMils).toBe(0.0);
  });
});

describe('resetTurretState', () => {
  it('resets to zero', () => {
    const reset = resetTurretState();
    expect(reset.elevationMils).toBe(0.0);
    expect(reset.windageMils).toBe(0.0);
  });
});

describe('formatTurretState', () => {
  it('formats zero values', () => {
    const state = createDefaultTurretState();
    expect(formatTurretState(state)).toBe('E: +0.0, W: +0.0');
  });

  it('formats positive values with + sign', () => {
    const state: TurretState = { elevationMils: 2.5, windageMils: 1.0 };
    expect(formatTurretState(state)).toBe('E: +2.5, W: +1.0');
  });

  it('formats negative values', () => {
    const state: TurretState = { elevationMils: -1.5, windageMils: -2.0 };
    expect(formatTurretState(state)).toBe('E: -1.5, W: -2.0');
  });

  it('formats mixed values', () => {
    const state: TurretState = { elevationMils: 3.2, windageMils: -1.1 };
    expect(formatTurretState(state)).toBe('E: +3.2, W: -1.1');
  });
});

describe('applyTurretOffset', () => {
  it('does not change aim when turret is zeroed', () => {
    const turret = createDefaultTurretState();
    const result = applyTurretOffset(0, 0, turret, 100);
    expect(result.aimY_M).toBe(0);
    expect(result.aimZ_M).toBe(0);
  });

  it('applies positive elevation offset', () => {
    const turret: TurretState = { elevationMils: 1.0, windageMils: 0 };
    // 1 MIL at 100m = 0.1m
    const result = applyTurretOffset(0, 0, turret, 100);
    expect(result.aimY_M).toBe(0.1);
    expect(result.aimZ_M).toBe(0);
  });

  it('applies negative elevation offset', () => {
    const turret: TurretState = { elevationMils: -1.0, windageMils: 0 };
    const result = applyTurretOffset(0, 0, turret, 100);
    expect(result.aimY_M).toBe(-0.1);
    expect(result.aimZ_M).toBe(0);
  });

  it('applies positive windage offset', () => {
    const turret: TurretState = { elevationMils: 0, windageMils: 1.0 };
    const result = applyTurretOffset(0, 0, turret, 100);
    expect(result.aimY_M).toBe(0);
    expect(result.aimZ_M).toBe(0.1);
  });

  it('applies negative windage offset', () => {
    const turret: TurretState = { elevationMils: 0, windageMils: -1.0 };
    const result = applyTurretOffset(0, 0, turret, 100);
    expect(result.aimY_M).toBe(0);
    expect(result.aimZ_M).toBe(-0.1);
  });

  it('applies both elevation and windage offsets', () => {
    const turret: TurretState = { elevationMils: 2.0, windageMils: 1.5 };
    const result = applyTurretOffset(0, 0, turret, 100);
    // 2 MIL at 100m = 0.2m, 1.5 MIL at 100m = 0.15m
    expect(result.aimY_M).toBe(0.2);
    expect(result.aimZ_M).toBeCloseTo(0.15, 10);
  });

  it('adds offset to existing aim', () => {
    const turret: TurretState = { elevationMils: 1.0, windageMils: 0.5 };
    const result = applyTurretOffset(0.05, 0.025, turret, 100);
    expect(result.aimY_M).toBeCloseTo(0.15, 10); // 0.05 + 0.1
    expect(result.aimZ_M).toBeCloseTo(0.075, 10); // 0.025 + 0.05
  });

  it('scales with distance', () => {
    const turret: TurretState = { elevationMils: 1.0, windageMils: 0 };
    // At 500m, 1 MIL = 0.5m
    const result = applyTurretOffset(0, 0, turret, 500);
    expect(result.aimY_M).toBe(0.5);
  });
});
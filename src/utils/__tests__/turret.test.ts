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
  computeAdjustmentForOffset,
  quantizeAdjustmentToClicks,
  recommendDialFromOffset,
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

describe('computeAdjustmentForOffset', () => {
  it('computes opposite correction for positive elevation offset', () => {
    // Shot is 0.1m high at 100m (1 MIL offset)
    // Need to lower turret by 1 MIL
    const adjustment = computeAdjustmentForOffset(0.1, 0, 100);
    expect(adjustment.elevationMils).toBe(-1.0);
    expect(Math.abs(adjustment.windageMils)).toBeCloseTo(0, 10);
  });

  it('computes opposite correction for negative elevation offset', () => {
    // Shot is 0.1m low at 100m (-1 MIL offset)
    // Need to raise turret by 1 MIL
    const adjustment = computeAdjustmentForOffset(-0.1, 0, 100);
    expect(adjustment.elevationMils).toBe(1.0);
    expect(Math.abs(adjustment.windageMils)).toBeCloseTo(0, 10);
  });

  it('computes opposite correction for positive windage offset', () => {
    // Shot is 0.1m right at 100m (1 MIL offset)
    // Need to aim left by 1 MIL
    const adjustment = computeAdjustmentForOffset(0, 0.1, 100);
    expect(Math.abs(adjustment.elevationMils)).toBeCloseTo(0, 10);
    expect(adjustment.windageMils).toBe(-1.0);
  });

  it('computes opposite correction for negative windage offset', () => {
    // Shot is 0.1m left at 100m (-1 MIL offset)
    // Need to aim right by 1 MIL
    const adjustment = computeAdjustmentForOffset(0, -0.1, 100);
    expect(Math.abs(adjustment.elevationMils)).toBeCloseTo(0, 10);
    expect(adjustment.windageMils).toBe(1.0);
  });

  it('computes correction for both elevation and windage', () => {
    // Shot is high and right
    const adjustment = computeAdjustmentForOffset(0.15, 0.2, 100);
    // At 100m: 0.15m = 1.5 MIL, 0.2m = 2 MIL
    expect(adjustment.elevationMils).toBeCloseTo(-1.5, 10);
    expect(adjustment.windageMils).toBeCloseTo(-2.0, 10);
  });

  it('scales conversion with distance', () => {
    // Shot is 0.5m high at 500m (1 MIL offset)
    const adjustment = computeAdjustmentForOffset(0.5, 0, 500);
    expect(adjustment.elevationMils).toBe(-1.0);
  });
});

describe('quantizeAdjustmentToClicks', () => {
  it('quantizes adjustment to 0.1 mil clicks', () => {
    expect(quantizeAdjustmentToClicks(0.123)).toBe(0.1);
    expect(quantizeAdjustmentToClicks(0.156)).toBe(0.2);
  });

  it('handles negative adjustments', () => {
    expect(quantizeAdjustmentToClicks(-0.123)).toBe(-0.1);
    expect(quantizeAdjustmentToClicks(-0.156)).toBe(-0.2);
  });

  it('uses custom click size', () => {
    expect(quantizeAdjustmentToClicks(0.26, 0.25)).toBe(0.25);
    expect(quantizeAdjustmentToClicks(0.51, 0.25)).toBe(0.5);
  });
});

describe('recommendDialFromOffset', () => {
  it('computes dial correction for high shot at 500m', () => {
    // At 500m, shot is 0.25m high (0.5 mils offset)
    // Need to aim LOWER (down)
    const rec = recommendDialFromOffset(500, 0.25, 0);
    
    expect(rec.offsetY_M).toBe(0.25);
    expect(rec.offsetY_Mils).toBeCloseTo(0.5, 10);
    
    // Elevation correction: -0.5 mils (down)
    expect(rec.elevDeltaMils).toBeCloseTo(-0.5, 10);
    expect(rec.elevClicks).toBeCloseTo(-5, 10); // 5 clicks DOWN
    
    // No windage needed
    expect(rec.windDeltaMils).toBe(0);
    expect(rec.windClicks).toBe(0);
  });

  it('computes dial correction for left shot at 500m', () => {
    // At 500m, shot is 0.05m left (-0.1 mils offset)
    // Need to aim RIGHT
    const rec = recommendDialFromOffset(500, 0, -0.05);
    
    expect(rec.offsetZ_M).toBe(-0.05);
    expect(rec.offsetZ_Mils).toBeCloseTo(-0.1, 10);
    
    // No elevation needed
    expect(rec.elevDeltaMils).toBe(0);
    expect(rec.elevClicks).toBe(0);
    
    // Windage correction: +0.1 mils (right)
    expect(rec.windDeltaMils).toBeCloseTo(0.1, 10);
    expect(rec.windClicks).toBeCloseTo(1, 10); // 1 click RIGHT
  });

  it('combines elevation and windage corrections', () => {
    // At 600m, shot is 0.15m high, 0.03m left
    // 0.15m at 600m = 0.25 mils (offset)
    // 0.03m at 600m = 0.05 mils (offset)
    const rec = recommendDialFromOffset(600, 0.15, -0.03);
    
    // Elev: aim DOWN (-0.2 mils = -2 clicks, quantized from -0.25 mils)
    expect(rec.elevDeltaMils).toBeCloseTo(-0.2, 10);
    expect(rec.elevClicks).toBe(-2);
    
    // Windage: aim RIGHT (+0.1 mils = +1 click, quantized from +0.05 mils)
    expect(rec.windDeltaMils).toBeCloseTo(0.1, 10);
    expect(rec.windClicks).toBe(1);
  });

  it('quantizes to nearest 0.1 mil click by default', () => {
    // At 500m, shot is 0.26m high (0.52 mils offset)
    // Should quantize -0.52 mils correction to -0.5 mils
    const rec = recommendDialFromOffset(500, 0.26, 0);
    
    expect(rec.elevDeltaMils).toBeCloseTo(-0.5, 10);
    expect(rec.elevClicks).toBeCloseTo(-5, 10); // 5 clicks DOWN
  });

  it('uses custom click size', () => {
    // At 500m, shot is 0.26m high (0.52 mils)
    // With 0.25 mil clicks, -0.52 mils -> -0.5 mils = -2 clicks
    const rec = recommendDialFromOffset(500, 0.26, 0, 0.25);
    
    expect(rec.elevDeltaMils).toBeCloseTo(-0.5, 10);
    expect(rec.elevClicks).toBeCloseTo(-2, 10); // 2 clicks DOWN (at 0.25 mil each)
  });

  it('provides hold recommendations in mils', () => {
    // At 700m, shot is 0.21m high, 0.07m right
    // 0.21m at 700m = 0.3 mils
    // 0.07m at 700m = 0.1 mils
    const rec = recommendDialFromOffset(700, 0.21, 0.07);
    
    // Hold is same as correction (aim lower, aim left)
    expect(rec.holdElevationMils).toBeCloseTo(-0.3, 10);
    expect(rec.holdWindageMils).toBeCloseTo(-0.1, 10);
    
    // But clicks are quantized
    expect(rec.elevClicks).toBeCloseTo(-3, 10);
    expect(rec.windClicks).toBeCloseTo(-1, 10);
  });

  it('handles low and right shots', () => {
    // At 400m, shot is 0.08m low (-0.2 mils), 0.12m right (0.3 mils)
    // Need to aim UP (-0.2 correction) and LEFT (-0.3 correction)
    const rec = recommendDialFromOffset(400, -0.08, 0.12);
    
    // Elev: +0.2 mils UP = +2 clicks
    expect(rec.elevDeltaMils).toBeCloseTo(0.2, 10);
    expect(rec.elevClicks).toBeCloseTo(2, 10);
    
    // Windage: -0.3 mils LEFT = -3 clicks
    expect(rec.windDeltaMils).toBeCloseTo(-0.3, 10);
    expect(rec.windClicks).toBeCloseTo(-3, 10);
  });

  it('handles zero offset (perfect shot)', () => {
    const rec = recommendDialFromOffset(500, 0, 0);
    
    expect(rec.offsetY_M).toBe(0);
    expect(rec.offsetZ_M).toBe(0);
    expect(rec.elevDeltaMils).toBe(0);
    expect(rec.windDeltaMils).toBe(0);
    expect(rec.elevClicks).toBe(0);
    expect(rec.windClicks).toBe(0);
  });

  it('handles wind from left pushing bullets right', () => {
    // Wind from left (positive) pushes bullets right (positive offset)
    // At 500m, shot is 0.15m right (0.3 mils offset)
    // Need to aim LEFT (-0.3 mils)
    const rec = recommendDialFromOffset(500, 0, 0.15);
    
    expect(rec.windDeltaMils).toBeCloseTo(-0.3, 10);
    expect(rec.windClicks).toBeCloseTo(-3, 10); // Dial LEFT 3 clicks
  });
});
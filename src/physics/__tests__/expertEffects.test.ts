import { describe, it, expect } from 'vitest';
import {
  calculateExpertEffects,
  calculateSpinDrift,
  calculateCoriolis,
  type ExpertEffectsParams,
} from '../expertEffects';

describe('calculateSpinDrift', () => {
  it('returns 0 at zero time of flight', () => {
    const params: ExpertEffectsParams = {
      timeOfFlightS: 0,
      headingDegrees: 0,
      latitudeDegrees: 45,
    };
    
    const drift = calculateSpinDrift(params);
    expect(drift).toBe(0);
  });
  
  it('returns positive deflection (rightward)', () => {
    const params: ExpertEffectsParams = {
      timeOfFlightS: 1.0,
      headingDegrees: 0,
      latitudeDegrees: 45,
    };
    
    const drift = calculateSpinDrift(params);
    expect(drift).toBeGreaterThan(0);
  });
  
  it('scales with time of flight squared', () => {
    const baseParams: ExpertEffectsParams = {
      timeOfFlightS: 0.5,
      headingDegrees: 0,
      latitudeDegrees: 45,
    };
    
    const drift1 = calculateSpinDrift({ ...baseParams, timeOfFlightS: 0.5 });
    const drift2 = calculateSpinDrift({ ...baseParams, timeOfFlightS: 1.0 });
    const drift3 = calculateSpinDrift({ ...baseParams, timeOfFlightS: 1.5 });
    
    // Doubling time of flight should roughly quadruple drift (t^2 relationship)
    expect(drift2).toBeGreaterThan(drift1);
    expect(drift3).toBeGreaterThan(drift2);
    
    // Check approximate t^2 scaling
    expect(drift2 / drift1).toBeGreaterThan(3); // Should be ~4x
    expect(drift3 / drift2).toBeGreaterThan(1.5); // Should be ~2.25x
  });
  
  it('clamps to maximum reasonable value', () => {
    const veryLongShot: ExpertEffectsParams = {
      timeOfFlightS: 10, // Extremely long TOF
      headingDegrees: 0,
      latitudeDegrees: 45,
    };
    
    const drift = calculateSpinDrift(veryLongShot);
    expect(drift).toBeLessThanOrEqual(0.25); // Max 0.25m
  });
});

describe('calculateCoriolis', () => {
  it('returns zero horizontal deflection when shooting due East (90°)', () => {
    const params: ExpertEffectsParams = {
      timeOfFlightS: 1.0,
      headingDegrees: 90, // East
      latitudeDegrees: 45,
    };
    
    const coriolis = calculateCoriolis(params);
    expect(coriolis.dY).toBeCloseTo(0, 5); // Horizontal should be ~0
    expect(coriolis.dZ).toBeGreaterThan(0); // Vertical should be positive (up)
  });
  
  it('returns rightward deflection when shooting North in Northern Hemisphere', () => {
    const params: ExpertEffectsParams = {
      timeOfFlightS: 1.0,
      headingDegrees: 0, // North
      latitudeDegrees: 45, // Northern Hemisphere
    };
    
    const coriolis = calculateCoriolis(params);
    expect(coriolis.dY).toBeGreaterThan(0); // Deflects right
  });
  
  it('returns leftward deflection when shooting South in Northern Hemisphere', () => {
    const params: ExpertEffectsParams = {
      timeOfFlightS: 1.0,
      headingDegrees: 180, // South
      latitudeDegrees: 45, // Northern Hemisphere
    };
    
    const coriolis = calculateCoriolis(params);
    expect(coriolis.dY).toBeLessThan(0); // Deflects left
  });
  
  it('returns upward deflection when shooting East', () => {
    const params: ExpertEffectsParams = {
      timeOfFlightS: 1.0,
      headingDegrees: 90, // East
      latitudeDegrees: 45,
    };
    
    const coriolis = calculateCoriolis(params);
    expect(coriolis.dZ).toBeGreaterThan(0); // Deflects up
  });
  
  it('returns downward deflection when shooting West', () => {
    const params: ExpertEffectsParams = {
      timeOfFlightS: 1.0,
      headingDegrees: 270, // West
      latitudeDegrees: 45,
    };
    
    const coriolis = calculateCoriolis(params);
    expect(coriolis.dZ).toBeLessThan(0); // Deflects down
  });
  
  it('scales with time of flight', () => {
    const baseParams: ExpertEffectsParams = {
      timeOfFlightS: 0.5,
      headingDegrees: 0,
      latitudeDegrees: 45,
    };
    
    const coriolis1 = calculateCoriolis({ ...baseParams, timeOfFlightS: 0.5 });
    const coriolis2 = calculateCoriolis({ ...baseParams, timeOfFlightS: 1.0 });
    
    // Should scale roughly linearly with time of flight
    expect(Math.abs(coriolis2.dY)).toBeGreaterThan(Math.abs(coriolis1.dY));
    expect(Math.abs(coriolis2.dY) / Math.abs(coriolis1.dY)).toBeCloseTo(2, 0.5);
  });
  
  it('deflection increases at higher latitudes for North/South shooting', () => {
    const lowLatParams: ExpertEffectsParams = {
      timeOfFlightS: 1.0,
      headingDegrees: 0, // North
      latitudeDegrees: 10, // Near equator
    };
    
    const highLatParams: ExpertEffectsParams = {
      timeOfFlightS: 1.0,
      headingDegrees: 0, // North
      latitudeDegrees: 60, // High latitude
    };
    
    const lowLatCoriolis = calculateCoriolis(lowLatParams);
    const highLatCoriolis = calculateCoriolis(highLatParams);
    
    expect(Math.abs(lowLatCoriolis.dY)).toBeLessThan(Math.abs(highLatCoriolis.dY));
  });
  
  it('clamps to reasonable ranges', () => {
    const longShot: ExpertEffectsParams = {
      timeOfFlightS: 10,
      headingDegrees: 0,
      latitudeDegrees: 45,
    };
    
    const coriolis = calculateCoriolis(longShot);
    expect(Math.abs(coriolis.dY)).toBeLessThanOrEqual(0.2); // Max 0.2m horizontal
    expect(Math.abs(coriolis.dZ)).toBeLessThanOrEqual(0.1); // Max 0.1m vertical
  });
});

describe('calculateExpertEffects', () => {
  it('returns zero deflection when all extras disabled', () => {
    const params: ExpertEffectsParams = {
      timeOfFlightS: 1.0,
      headingDegrees: 0,
      latitudeDegrees: 45,
    };
    
    const result = calculateExpertEffects(params, false, false);
    expect(result.dY_M).toBe(0);
    expect(result.dZ_M).toBe(0);
  });
  
  it('includes only spin drift when enabled', () => {
    const params: ExpertEffectsParams = {
      timeOfFlightS: 1.0,
      headingDegrees: 0,
      latitudeDegrees: 45,
    };
    
    const spinOnly = calculateExpertEffects(params, true, false);
    const none = calculateExpertEffects(params, false, false);
    
    expect(spinOnly.dY_M).toBeGreaterThan(none.dY_M);
    expect(spinOnly.dY_M).toBeGreaterThan(0);
  });
  
  it('includes only Coriolis when enabled', () => {
    const params: ExpertEffectsParams = {
      timeOfFlightS: 1.0,
      headingDegrees: 0, // North - will have horizontal Coriolis
      latitudeDegrees: 45,
    };
    
    const coriolisOnly = calculateExpertEffects(params, false, true);
    const none = calculateExpertEffects(params, false, false);
    
    // Coriolis should have horizontal deflection when shooting North
    expect(Math.abs(coriolisOnly.dY_M)).toBeGreaterThan(Math.abs(none.dY_M));
    expect(coriolisOnly.dZ_M).toBe(none.dZ_M); // No vertical without spin drift
  });
  
  it('combines both effects when both enabled', () => {
    const params: ExpertEffectsParams = {
      timeOfFlightS: 1.0,
      headingDegrees: 0,
      latitudeDegrees: 45,
    };
    
    const both = calculateExpertEffects(params, true, true);
    const spinOnly = calculateExpertEffects(params, true, false);
    
    // Both effects should have at least some deflection
    expect(Math.abs(both.dY_M)).toBeGreaterThan(0);
    expect(Math.abs(both.dZ_M)).toBeGreaterThanOrEqual(0); // Could be 0 or > 0
    expect(Math.abs(spinOnly.dY_M)).toBeGreaterThan(0);
    expect(spinOnly.dZ_M).toBe(0); // Spin drift only affects horizontal
    
    // Both enabled should have same or more deflection than just spin drift
    expect(Math.abs(both.dY_M) + Math.abs(both.dZ_M)).toBeGreaterThanOrEqual(
      Math.abs(spinOnly.dY_M) + Math.abs(spinOnly.dZ_M)
    );
  });
  
  it('monotonically increases with time of flight', () => {
    const params: ExpertEffectsParams = {
      timeOfFlightS: 0.5,
      headingDegrees: 0,
      latitudeDegrees: 45,
    };
    
    const result1 = calculateExpertEffects(
      { ...params, timeOfFlightS: 0.5 },
      true,
      true
    );
    const result2 = calculateExpertEffects(
      { ...params, timeOfFlightS: 1.0 },
      true,
      true
    );
    const result3 = calculateExpertEffects(
      { ...params, timeOfFlightS: 1.5 },
      true,
      true
    );
    
    // Absolute deflection should increase with time of flight
    const abs1 = Math.abs(result1.dY_M) + Math.abs(result1.dZ_M);
    const abs2 = Math.abs(result2.dY_M) + Math.abs(result2.dZ_M);
    const abs3 = Math.abs(result3.dY_M) + Math.abs(result3.dZ_M);
    
    expect(abs2).toBeGreaterThan(abs1);
    expect(abs3).toBeGreaterThan(abs2);
  });
  
  it('toggles off return zero regardless of time of flight', () => {
    const longParams: ExpertEffectsParams = {
      timeOfFlightS: 5.0,
      headingDegrees: 0,
      latitudeDegrees: 45,
    };
    
    const result = calculateExpertEffects(longParams, false, false);
    expect(result.dY_M).toBe(0);
    expect(result.dZ_M).toBe(0);
  });
});
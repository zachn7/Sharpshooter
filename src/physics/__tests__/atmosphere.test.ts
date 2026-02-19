import { describe, it, expect } from 'vitest';
import {
  computeAirDensity,
  formatEnvironmentSummary,
  getDensityIndex,
  DEFAULT_ENVIRONMENT,
  getEnvironmentPreset,
  type AtmosphereParams,
} from '../atmosphere';

describe('atmosphere - computeAirDensity', () => {
  it('computes standard air density at sea level, 15°C', () => {
    const params: AtmosphereParams = {
      temperatureC: 15,
      altitudeM: 0,
    };
    const density = computeAirDensity(params);
    
    // Should be approximately 1.225 kg/m³ at standard conditions
    expect(density).toBeCloseTo(1.225, 3);
  });

  it('returns default environment density', () => {
    const density = computeAirDensity(DEFAULT_ENVIRONMENT);
    
    expect(density).toBeCloseTo(1.225, 3);
  });

  it('density decreases with altitude (monotonic)', () => {
    const seaLevelDensity = computeAirDensity({ temperatureC: 15, altitudeM: 0 });
    const mountainDensity = computeAirDensity({ temperatureC: 15, altitudeM: 2000 });
    const highAltDensity = computeAirDensity({ temperatureC: 15, altitudeM: 4000 });
    
    // Higher altitude = lower density
    expect(mountainDensity).toBeLessThan(seaLevelDensity);
    expect(highAltDensity).toBeLessThan(mountainDensity);
  });

  it('density decreases with temperature (monotonic)', () => {
    const coldDensity = computeAirDensity({ temperatureC: -20, altitudeM: 0 });
    const standardDensity = computeAirDensity({ temperatureC: 15, altitudeM: 0 });
    const hotDensity = computeAirDensity({ temperatureC: 35, altitudeM: 0 });
    
    // Warmer air is less dense
    expect(hotDensity).toBeLessThan(standardDensity);
    expect(standardDensity).toBeLessThan(coldDensity);
  });

  it('combined altitude and temperature effects', () => {
    const seaStd = computeAirDensity({ temperatureC: 15, altitudeM: 0 });
    const mountainHot = computeAirDensity({ temperatureC: 30, altitudeM: 3000 });
    
    // Hot + high altitude = even less dense
    expect(mountainHot).toBeLessThan(seaStd);
    expect(mountainHot).toBeLessThan(1.0); // Should drop below 1.0
  });

  it('arctic conditions (cold, sea level) = dense air', () => {
    const density = computeAirDensity({ temperatureC: -20, altitudeM: 0 });
    
    expect(density).toBeGreaterThan(1.3); // Colder than standard = denser
  });

  it('desert conditions (hot, low altitude) = thin air', () => {
    const density = computeAirDensity({ temperatureC: 40, altitudeM: 500 });
    
    expect(density).toBeLessThan(1.2); // Hotter than standard = less dense
  });

  it('high altitude mountain conditions', () => {
    const density = computeAirDensity({ temperatureC: 0, altitudeM: 3500 });
    
    expect(density).toBeLessThan(0.9); // High altitude = significantly less dense
    expect(density).toBeGreaterThan(0); // Always positive
  });

  it('test mountain summit preset', () => {
    const preset = getEnvironmentPreset('mountain-summit');
    expect(preset).toBeDefined();
    
    const density = computeAirDensity(preset!);
    
    expect(density).toBeLessThan(1.0); // 2500m should be < 1.0
  });

  it('test desert hot preset', () => {
    const preset = getEnvironmentPreset('desert-hot');
    expect(preset).toBeDefined();
    
    const density = computeAirDensity(preset!);
    
    expect(density).toBeLessThan(1.15); // Hot + low altitude
  });

  it('test arctic cold preset', () => {
    const preset = getEnvironmentPreset('arctic-cold');
    expect(preset).toBeDefined();
    
    const density = computeAirDensity(preset!);
    
    expect(density).toBeGreaterThan(1.3); // Cold = denser
  });
});

describe('atmosphere - formatEnvironmentSummary', () => {
  it('formats standard conditions', () => {
    const summary = formatEnvironmentSummary({ temperatureC: 15, altitudeM: 0 });
    expect(summary).toBe('15°C @ 0m');
  });

  it('formats mountain conditions', () => {
    const summary = formatEnvironmentSummary({ temperatureC: 0, altitudeM: 2500 });
    expect(summary).toBe('0°C @ 2500m');
  });

  it('formats desert conditions', () => {
    const summary = formatEnvironmentSummary({ temperatureC: 40, altitudeM: 200 });
    expect(summary).toBe('40°C @ 200m');
  });
});

describe('atmosphere - getDensityIndex', () => {
  it('returns 5 for very dense air (sea level, cold)', () => {
    const index = getDensityIndex({ temperatureC: -20, altitudeM: 0 });
    
    expect(index).toBe(5);
  });

  it('returns 4 for standard air (sea level, 15°C)', () => {
    const index = getDensityIndex({ temperatureC: 15, altitudeM: 0 });
    
    expect(index).toBe(4);
  });

  it('returns 1 for very thin air (high altitude, hot)', () => {
    const index = getDensityIndex({ temperatureC: 35, altitudeM: 4000 });
    
    expect(index).toBe(1);
  });

  it('returns intermediate values for other conditions', () => {
    const idx1 = getDensityIndex({ temperatureC: 15, altitudeM: 1500 });
    const idx2 = getDensityIndex({ temperatureC: 25, altitudeM: 0 });
    
    expect(idx1).toBeGreaterThan(0);
    expect(idx1).toBeLessThan(5);
    expect(idx2).toBeGreaterThan(0);
    expect(idx2).toBeLessThan(5);
  });
});

describe('atmosphere - environment presets', () => {
  it('has sea-level preset', () => {
    const preset = getEnvironmentPreset('sea-level');
    expect(preset).toBeDefined();
    expect(preset!.temperatureC).toBe(15);
    expect(preset!.altitudeM).toBe(0);
  });

  it('has mountain-summit preset', () => {
    const preset = getEnvironmentPreset('mountain-summit');
    expect(preset).toBeDefined();
    expect(preset!.altitudeM).toBe(2500);
  });

  it('has arctic-cold preset', () => {
    const preset = getEnvironmentPreset('arctic-cold');
    expect(preset).toBeDefined();
    expect(preset!.temperatureC).toBe(-20);
  });

  it('has high-altitude preset', () => {
    const preset = getEnvironmentPreset('high-altitude');
    expect(preset).toBeDefined();
    expect(preset!.altitudeM).toBe(3500);
  });

  it('returns undefined for unknown preset', () => {
    const preset = getEnvironmentPreset('unknown-preset');
    expect(preset).toBeUndefined();
  });
});
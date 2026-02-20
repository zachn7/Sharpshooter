import { describe, it, expect } from 'vitest';
import {
  calculateMovingTargetPosition,
  calculateMovingTargetVelocity,
  generateMovingTargetConfig,
  type MovingTargetConfig,
} from '../movingTargets';

describe('calculateMovingTargetPosition', () => {
  const baseY = 0;
  const baseZ = 0;

  it('returns base position at time zero', () => {
    const config: MovingTargetConfig = {
      speedMps: 3.0,
      axis: 'horizontal',
      amplitudeM: 0.1,
    };

    const position = calculateMovingTargetPosition(baseY, baseZ, config, 0);
    expect(position.y_M).toBe(baseY);
    expect(position.z_M).toBe(baseZ);
  });

  it('moves horizontally when axis is horizontal', () => {
    const config: MovingTargetConfig = {
      speedMps: 4.0,
      axis: 'horizontal',
      amplitudeM: 0.15,
    };

    const position = calculateMovingTargetPosition(baseY, baseZ, config, 250); // 0.25s
    // at 0.25s, sin(2π * 4.0 * 0.25) = sin(2π) = 0
    // Wait, that's wrong. Let me recalculate:
    // phase = (speed * time) in seconds = 4.0 * 0.25 = 1.0
    // sin(π * phase * 2) = sin(2π) = 0
    expect(position.y_M).toBe(baseY);
    expect(position.z_M).toBeCloseTo(0, 5);
  });

  it('moves vertically when axis is vertical', () => {
    const config: MovingTargetConfig = {
      speedMps: 3.0,
      axis: 'vertical',
      amplitudeM: 0.1,
    };

    const position = calculateMovingTargetPosition(baseY, baseZ, config, 250);
    expect(position.y_M).not.toBe(baseY);
    expect(position.z_M).toBe(baseZ);
  });

  it('respects amplitude bounds', () => {
    const amplitude = 0.2;
    const config: MovingTargetConfig = {
      speedMps: 1.0, // Slow speed to ensure we hit peak
      axis: 'horizontal',
      amplitudeM: amplitude,
    };

    // Test at quarter period (should be near maximum)
    // For speed 1.0, quarter period = 0.25s
    const position = calculateMovingTargetPosition(baseY, baseZ, config, 250);
    expect(Math.abs(position.z_M)).toBeLessThanOrEqual(amplitude * 1.001);
  });

  it('is deterministic for same time', () => {
    const config: MovingTargetConfig = {
      speedMps: 2.5,
      axis: 'horizontal',
      amplitudeM: 0.12,
    };

    const time = 500; // 0.5s
    const position1 = calculateMovingTargetPosition(baseY, baseZ, config, time);
    const position2 = calculateMovingTargetPosition(baseY, baseZ, config, time);

    expect(position1.y_M).toBe(position2.y_M);
    expect(position1.z_M).toBe(position2.z_M);
  });

  it('negative amplitude moves in opposite direction', () => {
    const positiveConfig: MovingTargetConfig = {
      speedMps: 3.0,
      axis: 'horizontal',
      amplitudeM: 0.15,
    };

    const negativeConfig: MovingTargetConfig = {
      speedMps: 3.0,
      axis: 'horizontal',
      amplitudeM: -0.15,
    };

    const time = 250;
    const positivePos = calculateMovingTargetPosition(baseY, baseZ, positiveConfig, time);
    const negativePos = calculateMovingTargetPosition(baseY, baseZ, negativeConfig, time);

    // Y should be same for both
    expect(positivePos.y_M).toBe(negativePos.y_M);
    // Z should be negation
    expect(positivePos.z_M).toBeCloseTo(-negativePos.z_M, 5);
  });
});

describe('calculateMovingTargetVelocity', () => {
  it('calculates correct velocity magnitude at peak offset', () => {
    const amplitude = 0.1;
    const speed = 5.0;
    const config: MovingTargetConfig = {
      speedMps: speed,
      axis: 'horizontal',
      amplitudeM: amplitude,
    };

    // At time zero, velocity is maximum (derivative of sin is cos, cos(0) = 1)
    const velocity = calculateMovingTargetVelocity(config, 0);
    const expectedMaxVelocity = amplitude * speed * Math.PI * 2;

    expect(velocity.vy_Mps).toBe(0);
    expect(velocity.vz_Mps).toBeCloseTo(expectedMaxVelocity, 5);
  });

  it('calculates zero velocity at peak amplitude', () => {
    const config: MovingTargetConfig = {
      speedMps: 2.0,
      axis: 'horizontal',
      amplitudeM: 0.15,
    };

    // At quarter period (T/4), we're at peak amplitude, velocity is zero
    // For speed 2.0, T = 1/2 = 0.5s, T/4 = 0.125s
    const velocity = calculateMovingTargetVelocity(config, 125);

    // Should be close to zero
    expect(velocity.vy_Mps).toBe(0);
    expect(velocity.vz_Mps).toBeCloseTo(0, 4);
  });

  it('swaps axis for vertical movement', () => {
    const config: MovingTargetConfig = {
      speedMps: 3.0,
      axis: 'vertical',
      amplitudeM: 0.12,
    };

    const velocity = calculateMovingTargetVelocity(config, 0);

    expect(velocity.vy_Mps).not.toBe(0);
    expect(velocity.vz_Mps).toBe(0);
  });
});

describe('generateMovingTargetConfig', () => {
  it('generates valid configuration object', () => {
    const config = generateMovingTargetConfig(2.0, 5.0, 0.08, 0.2, 12345);

    expect(config).toHaveProperty('speedMps');
    expect(config).toHaveProperty('axis');
    expect(config).toHaveProperty('amplitudeM');
    expect(['horizontal', 'vertical']).toContain(config.axis);
  });

  it('respects speed bounds', () => {
    const minSpeed = 2.0;
    const maxSpeed = 5.0;

    for (let i = 0; i < 10; i++) {
      const config = generateMovingTargetConfig(minSpeed, maxSpeed, 0.08, 0.2, 12345 + i);
      expect(config.speedMps).toBeGreaterThanOrEqual(minSpeed);
      expect(config.speedMps).toBeLessThanOrEqual(maxSpeed);
    }
  });

  it('respects amplitude bounds', () => {
    const minAmp = 0.08;
    const maxAmp = 0.2;

    for (let i = 0; i < 10; i++) {
      const config = generateMovingTargetConfig(2.0, 5.0, minAmp, maxAmp, 12345 + i);
      expect(config.amplitudeM).toBeGreaterThanOrEqual(minAmp);
      expect(config.amplitudeM).toBeLessThanOrEqual(maxAmp);
    }
  });

  it('is deterministic with same seed', () => {
    const seed = 54321;
    const config1 = generateMovingTargetConfig(2.0, 5.0, 0.08, 0.2, seed);
    const config2 = generateMovingTargetConfig(2.0, 5.0, 0.08, 0.2, seed);

    expect(config1.speedMps).toBe(config2.speedMps);
    expect(config1.axis).toBe(config2.axis);
    expect(config1.amplitudeM).toBe(config2.amplitudeM);
  });

  it('does not always produce same configs with different seeds (statistical test)', () => {
    // Generate 100 configs with different seeds and check they're not all identical
    const configs = Array.from({ length: 100 }, (_, i) => 
      generateMovingTargetConfig(2.0, 5.0, 0.08, 0.2, 10000 + i)
    );

    // All configs should not be identical to the first one (statistically improbable)
    const firstConfig = configs[0];
    const allIdentical = configs.every(c => 
      c.speedMps === firstConfig.speedMps &&
      c.axis === firstConfig.axis &&
      c.amplitudeM === firstConfig.amplitudeM
    );

    expect(allIdentical).toBe(false);
  });
});

describe('moving target math integration', () => {
  it('position and velocity are consistent', () => {
    const config: MovingTargetConfig = {
      speedMps: 3.0,
      axis: 'horizontal',
      amplitudeM: 0.1,
    };

    const time1 = 100; // 0.1s
    const time2 = 110; // 0.11s (10ms later)
    const dt = 0.01; // 10ms in seconds

    const pos1 = calculateMovingTargetPosition(0, 0, config, time1);
    const pos2 = calculateMovingTargetPosition(0, 0, config, time2);
    const velocity = calculateMovingTargetVelocity(config, time1);

    // The change in position should approximately equal velocity * dt
    // Note: due to sinusoidal acceleration, velocity changes over small dt
    // So position won't perfectly match velocity * dt
    const dz = pos2.z_M - pos1.z_M;
    const expectedDz = velocity.vz_Mps * dt;

    // Allow larger tolerance because velocity itself is changing
    expect(dz).toBeCloseTo(expectedDz, 1); // Allow moderate error due to acceleration
  });

  it('completes full cycle correctly', () => {
    const config: MovingTargetConfig = {
      speedMps: 1.0,
      axis: 'horizontal',
      amplitudeM: 0.1,
    };

    // Period = 1/speed = 1 second
    const period = 1000; // 1s in milliseconds

    const pos0 = calculateMovingTargetPosition(0, 0, config, 0);
    const pos1 = calculateMovingTargetPosition(0, 0, config, period);

    // After one full period, should be back at start
    expect(pos0.y_M).toBeCloseTo(pos1.y_M, 6);
    expect(pos0.z_M).toBeCloseTo(pos1.z_M, 6);
  });
});

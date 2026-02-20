import { describe, it, expect } from 'vitest';
import {
  sampleWindAtDistance,
  sampleWindAtMultipleDistances,
  getWindAtFlagPositions,
  isLayeredWind,
  type WindSamplingContext,
} from '../windLayers';

describe('sampleWindAtDistance', () => {
  it('returns constant wind when no windProfile provided', () => {
    const context: WindSamplingContext = {
      baseWind: 5,
      gust: 2,
      seed: 12345,
    };

    const sample = sampleWindAtDistance(100, context);
    expect(sample.segmentIndex).toBe(-1);
    expect(sample.windSpeed).toBeGreaterThan(5 - 2);
    expect(sample.windSpeed).toBeLessThan(5 + 2);
  });

  it('returns zero wind when no parameters provided', () => {
    const context: WindSamplingContext = {
      seed: 12345,
    };

    const sample = sampleWindAtDistance(100, context);
    expect(sample.segmentIndex).toBe(-1);
    expect(sample.windSpeed).toBe(0);
  });

  it('finds correct segment within range', () => {
    const context: WindSamplingContext = {
      windProfile: [
        { startM: 0, endM: 100, windMps: 3, gustMps: 0 },
        { startM: 100, endM: 200, windMps: 5, gustMps: 0 },
        { startM: 200, endM: 300, windMps: 7, gustMps: 0 },
      ],
      seed: 12345,
    };

    const sample50 = sampleWindAtDistance(50, context);
    expect(sample50.segmentIndex).toBe(0);
    expect(sample50.windSpeed).toBe(3);

    const sample150 = sampleWindAtDistance(150, context);
    expect(sample150.segmentIndex).toBe(1);
    expect(sample150.windSpeed).toBe(5);

    const sample250 = sampleWindAtDistance(250, context);
    expect(sample250.segmentIndex).toBe(2);
    expect(sample250.windSpeed).toBe(7);
  });

  it('applies deterministic gusts per segment', () => {
    const context: WindSamplingContext = {
      windProfile: [
        { startM: 0, endM: 100, windMps: 5, gustMps: 2 },
        { startM: 100, endM: 200, windMps: 5, gustMps: 2 },
        { startM: 200, endM: 300, windMps: 5, gustMps: 2 },
      ],
      seed: 12345,
    };

    const sample1 = sampleWindAtDistance(25, context);
    const sample2 = sampleWindAtDistance(125, context);
    const sample3 = sampleWindAtDistance(225, context);

    // All samples should be within [3, 7] range (5 ± 2)
    expect(sample1.windSpeed).toBeGreaterThanOrEqual(3);
    expect(sample1.windSpeed).toBeLessThanOrEqual(7);
    expect(sample2.windSpeed).toBeGreaterThanOrEqual(3);
    expect(sample2.windSpeed).toBeLessThanOrEqual(7);
    expect(sample3.windSpeed).toBeGreaterThanOrEqual(3);
    expect(sample3.windSpeed).toBeLessThanOrEqual(7);

    // Each segment should have different deterministic gust
    expect(sample1.windSpeed).not.toBe(sample2.windSpeed);
    expect(sample2.windSpeed).not.toBe(sample3.windSpeed);
  });

  it('produces same results for same distance with same seed', () => {
    const context: WindSamplingContext = {
      windProfile: [
        { startM: 0, endM: 100, windMps: 5, gustMps: 1 },
        { startM: 100, endM: 200, windMps: 6, gustMps: 1 },
      ],
      seed: 54321,
    };

    const sample1 = sampleWindAtDistance(50, context);
    const sample2 = sampleWindAtDistance(50, context);

    expect(sample1.windSpeed).toBe(sample2.windSpeed);
    expect(sample1.segmentIndex).toBe(sample2.segmentIndex);
  });

  it('produces different results for same distance with different seeds', () => {
    const context1: WindSamplingContext = {
      windProfile: [
        { startM: 0, endM: 100, windMps: 5, gustMps: 1 },
      ],
      seed: 11111,
    };

    const context2: WindSamplingContext = {
      windProfile: [
        { startM: 0, endM: 100, windMps: 5, gustMps: 1 },
      ],
      seed: 22222,
    };

    const sample1 = sampleWindAtDistance(50, context1);
    const sample2 = sampleWindAtDistance(50, context2);

    expect(sample1.windSpeed).not.toBe(sample2.windSpeed);
  });

  it('extrapolates using last segment beyond profile range', () => {
    const context: WindSamplingContext = {
      windProfile: [
        { startM: 0, endM: 200, windMps: 5, gustMps: 1 },
        { startM: 200, endM: 300, windMps: 7, gustMps: 0 },
      ],
      seed: 12345,
    };

    // Beyond profile end
    const sampleBeyond = sampleWindAtDistance(400, context);
    expect(sampleBeyond.segmentIndex).toBe(1);
    expect(sampleBeyond.windSpeed).toBe(7); // Last segment 0 gust
  });
});

describe('sampleWindAtMultipleDistances', () => {
  it('samples wind at multiple distances', () => {
    const context: WindSamplingContext = {
      windProfile: [
        { startM: 0, endM: 100, windMps: 3, gustMps: 0 },
        { startM: 100, endM: 200, windMps: 5, gustMps: 0 },
        { startM: 200, endM: 300, windMps: 7, gustMps: 0 },
      ],
      seed: 12345,
    };

    const samples = sampleWindAtMultipleDistances([25, 125, 225], context);

    expect(samples).toHaveLength(3);
    expect(samples[0].windSpeed).toBe(3);
    expect(samples[0].segmentIndex).toBe(0);
    expect(samples[1].windSpeed).toBe(5);
    expect(samples[1].segmentIndex).toBe(1);
    expect(samples[2].windSpeed).toBe(7);
    expect(samples[2].segmentIndex).toBe(2);
  });
});

describe('getWindAtFlagPositions', () => {
  it('returns wind samples at 33%, 66%, and 100% of distance', () => {
    const context: WindSamplingContext = {
      windProfile: [
        { startM: 0, endM: 150, windMps: 3, gustMps: 0 },
        { startM: 150, endM: 300, windMps: 6, gustMps: 0 },
        { startM: 300, endM: 450, windMps: 9, gustMps: 0 },
      ],
      seed: 12345,
    };

    const flags = getWindAtFlagPositions(450, context);

    // 450 * 0.33 = ~148.5 (first segment)
    expect(flags.near.segmentIndex).toBe(0);
    expect(flags.near.windSpeed).toBe(3);

    // 450 * 0.66 = ~297 (second segment)
    expect(flags.mid.segmentIndex).toBe(1);
    expect(flags.mid.windSpeed).toBe(6);

    // 450 * 1.0 = 450 (third segment)
    expect(flags.far.segmentIndex).toBe(2);
    expect(flags.far.windSpeed).toBe(9);
  });

  it('works with constant wind (no profile)', () => {
    const context: WindSamplingContext = {
      baseWind: 5,
      gust: 1,
      seed: 12345,
    };

    const flags = getWindAtFlagPositions(300, context);

    expect(flags.near.segmentIndex).toBe(-1);
    expect(flags.mid.segmentIndex).toBe(-1);
    expect(flags.far.segmentIndex).toBe(-1);
  });
});

describe('isLayeredWind', () => {
  it('returns true when windProfile is provided', () => {
    const context: WindSamplingContext = {
      windProfile: [
        { startM: 0, endM: 100, windMps: 5, gustMps: 0 },
      ],
      seed: 12345,
    };

    expect(isLayeredWind(context)).toBe(true);
  });

  it('returns false when windProfile is not provided', () => {
    const context: WindSamplingContext = {
      baseWind: 5,
      gust: 1,
      seed: 12345,
    };

    expect(isLayeredWind(context)).toBe(false);
  });

  it('returns false when windProfile is empty', () => {
    const context: WindSamplingContext = {
      windProfile: [],
      seed: 12345,
    };

    expect(isLayeredWind(context)).toBe(false);
  });
});

describe('edge cases and boundary conditions', () => {
  it('handles zero distance correctly', () => {
    const context: WindSamplingContext = {
      windProfile: [
        { startM: 0, endM: 100, windMps: 5, gustMps: 0 },
      ],
      seed: 12345,
    };

    const sample = sampleWindAtDistance(0, context);
    expect(sample.segmentIndex).toBe(0);
    expect(sample.windSpeed).toBe(5);
  });

  it('handles gust correctly with zero base wind', () => {
    const context: WindSamplingContext = {
      windProfile: [
        { startM: 0, endM: 100, windMps: 0, gustMps: 3 },
      ],
      seed: 12345,
    };

    const sample = sampleWindAtDistance(50, context);
    expect(Math.abs(sample.windSpeed)).toBeLessThanOrEqual(3);
  });
});

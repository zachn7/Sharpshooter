import { describe, it, expect } from 'vitest';
import { checkPlateHit, findHitPlate, type PlateTarget } from '../scoring';

describe('checkPlateHit', () => {
  const plate: PlateTarget = {
    id: 'test-plate',
    centerY_M: 0,
    centerZ_M: 0,
    radiusM: 0.1,
    points: 5,
    label: 'A1',
  };

  it('returns points when impact is within the plate', () => {
    const result = checkPlateHit({ y_M: 0, z_M: 0 }, plate);
    expect(result).toBe(5);
  });

  it('returns points when impact is on the edge', () => {
    const result = checkPlateHit({ y_M: 0.1, z_M: 0 }, plate);
    expect(result).toBe(5);
  });

  it('returns 0 when impact is outside the plate', () => {
    const result = checkPlateHit({ y_M: 0.11, z_M: 0 }, plate);
    expect(result).toBe(0);
  });

  it('returns 0 for distant impact', () => {
    const result = checkPlateHit({ y_M: 1, z_M: 1 }, plate);
    expect(result).toBe(0);
  });

  it('calculates correct distance from center', () => {
    // Impact at (0.06, 0.08) has distance sqrt(0.06^2 + 0.08^2) = 0.1
    const result = checkPlateHit({ y_M: 0.06, z_M: 0.08 }, plate);
    expect(result).toBe(5);
  });

  it('returns different points for different plates', () => {
    const highValuePlate: PlateTarget = {
      id: 'high-value',
      centerY_M: 0,
      centerZ_M: 0,
      radiusM: 0.05,
      points: 10,
    };
    const result = checkPlateHit({ y_M: 0.02, z_M: 0.02 }, highValuePlate);
    expect(result).toBe(10);
  });
});

describe('findHitPlate', () => {
  const plates: PlateTarget[] = [
    { id: 'p1', centerY_M: 0, centerZ_M: -0.2, radiusM: 0.1, points: 5, label: 'A1' },
    { id: 'p2', centerY_M: 0, centerZ_M: 0, radiusM: 0.1, points: 5, label: 'A2' },
    { id: 'p3', centerY_M: 0, centerZ_M: 0.2, radiusM: 0.1, points: 5, label: 'A3' },
    { id: 'p4', centerY_M: 0.15, centerZ_M: 0, radiusM: 0.05, points: 10, label: 'B2' },
  ];

  it('finds the first plate that is hit', () => {
    const result = findHitPlate({ y_M: 0, z_M: 0 }, plates);
    expect(result.plate?.id).toBe('p2');
    expect(result.points).toBe(5);
  });

  it('returns first match when multiple plates could be hit', () => {
    // Impact at center could hit p2, but we check in order
    const result = findHitPlate({ y_M: 0, z_M: 0 }, plates);
    expect(result.plate?.id).toBe('p2');
  });

  it('finds small plate when hit precisely', () => {
    const result = findHitPlate({ y_M: 0.15, z_M: 0 }, plates);
    expect(result.plate?.id).toBe('p4');
    expect(result.points).toBe(10);
  });

  it('returns no hit for missed impact', () => {
    const result = findHitPlate({ y_M: 1, z_M: 1 }, plates);
    expect(result.plate).toBeUndefined();
    expect(result.points).toBe(0);
  });

  it('returns points 0 when no plate is hit', () => {
    const result = findHitPlate({ y_M: 0.5, z_M: 0.5 }, plates);
    expect(result.points).toBe(0);
  });

  it('handles empty plate array', () => {
    const result = findHitPlate({ y_M: 0, z_M: 0 }, []);
    expect(result.plate).toBeUndefined();
    expect(result.points).toBe(0);
  });
});
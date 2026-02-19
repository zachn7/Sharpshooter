import { describe, it, expect } from 'vitest';
import {
  formatWind,
  formatDials,
  formatTimeOfFlight,
  formatImpact,
  shotToRow,
  calculateGroupSize,
  calculateTotals,
  assembleRangeCard,
  generateSummary,
} from '../rangeCard';
import type { ShotTelemetry } from '../../types';

describe('rangeCard utilities', () => {
  describe('formatWind', () => {
    it('should format no wind', () => {
      expect(formatWind(0, 0)).toBe('0 m/s');
    });

    it('should format wind from right (0°)', () => {
      expect(formatWind(5, 0)).toBe('→ 5.0');
    });

    it('should format wind from top (90°)', () => {
      expect(formatWind(5, 90)).toBe('↑ 5.0');
    });

    it('should format wind from left (180°)', () => {
      expect(formatWind(5, 180)).toBe('← 5.0');
    });

    it('should format wind from bottom (270°)', () => {
      expect(formatWind(5, 270)).toBe('↓ 5.0');
    });
  });

  describe('formatDials', () => {
    it('should format dials with zero values', () => {
      expect(formatDials(0, 0)).toBe('0.0 ↑ / 0.0 ←');
    });

    it('should format dials with non-zero values', () => {
      expect(formatDials(2.5, -1.0)).toBe('2.5 ↑ / -1.0 ←');
    });

    it('should format dials with decimal values', () => {
      expect(formatDials(1.7, -0.3)).toBe('1.7 ↑ / -0.3 ←');
    });
  });

  describe('formatTimeOfFlight', () => {
    it('should format short times in milliseconds', () => {
      expect(formatTimeOfFlight(0.5)).toBe('500 ms');
      expect(formatTimeOfFlight(0.123)).toBe('123 ms');
    });

    it('should format longer times in seconds', () => {
      expect(formatTimeOfFlight(1.0)).toBe('1.000 s');
      expect(formatTimeOfFlight(1.234)).toBe('1.234 s');
    });
  });

  describe('formatImpact', () => {
    it('should format positive offsets', () => {
      expect(formatImpact(0.1, 0.2)).toBe('+0.10m +0.20m');
    });

    it('should format negative offsets', () => {
      expect(formatImpact(-0.1, -0.2)).toBe('-0.10m -0.20m');
    });

    it('should format mixed offsets', () => {
      expect(formatImpact(0.1, -0.2)).toBe('+0.10m -0.20m');
      expect(formatImpact(-0.1, 0.2)).toBe('-0.10m +0.20m');
    });
  });

  describe('shotToRow', () => {
    it('should convert shot telemetry to display row', () => {
      const shot: ShotTelemetry = {
        shotNumber: 1,
        windUsedMps: 5,
        windDirectionDeg: 180,
        elevationMils: 2.5,
        windageMils: -1.0,
        timeOfFlightS: 1.234,
        distanceM: 100,
        impactX: -0.1,
        impactY: 0.2,
        score: 8,
      };

      const row = shotToRow(shot);
      expect(row.shotNumber).toBe(1);
      expect(row.windUsed).toBe('← 5.0');
      expect(row.dials).toBe('2.5 ↑ / -1.0 ←');
      expect(row.timeOfFlight).toBe('1.234 s');
      expect(row.impact).toBe('-0.10m +0.20m');
      expect(row.score).toBe(8);
    });
  });

  describe('calculateGroupSize', () => {
    it('should return 0 for less than 2 shots', () => {
      expect(calculateGroupSize([])).toBe(0);
      expect(calculateGroupSize([{ impactX: 0, impactY: 0 } as unknown as ShotTelemetry])).toBe(0);
    });

    it('should calculate group size for 2 shots', () => {
      const shots = [
        { impactX: 0, impactY: 0 } as ShotTelemetry,
        { impactX: 0.1, impactY: 0 } as ShotTelemetry,
      ];
      expect(calculateGroupSize(shots)).toBeCloseTo(0.1, 5);
    });

    it('should calculate group size for multiple shots', () => {
      const shots = [
        { impactX: 0, impactY: 0 } as ShotTelemetry,
        { impactX: 0.1, impactY: 0 } as ShotTelemetry,
        { impactX: 0.05, impactY: 0.08 } as ShotTelemetry,
      ];
      expect(calculateGroupSize(shots)).toBeCloseTo(0.1, 5);
    });
  });

  describe('calculateTotals', () => {
    it('should handle empty shots', () => {
      const totals = calculateTotals([]);
      expect(totals.totalScore).toBe(0);
      expect(totals.avgScore).toBe(0);
      expect(totals.groupSizeMeters).toBe(0);
      expect(totals.bestRing).toBe(0);
      expect(totals.earnedStars).toBe(0);
    });

    it('should calculate basic totals', () => {
      const shots = [
        { score: 10 } as ShotTelemetry,
        { score: 8 } as ShotTelemetry,
        { score: 9 } as ShotTelemetry,
      ];
      const totals = calculateTotals(shots);
      expect(totals.totalScore).toBe(27);
      expect(totals.avgScore).toBe(9);
      expect(totals.bestRing).toBe(10);
      expect(totals.earnedStars).toBe(2);
    });

    it('should calculate stars correctly', () => {
      expect(calculateTotals([{ score: 9.5 } as ShotTelemetry]).earnedStars).toBe(3);
      expect(calculateTotals([{ score: 8.5 } as ShotTelemetry]).earnedStars).toBe(2);
      expect(calculateTotals([{ score: 7.0 } as ShotTelemetry]).earnedStars).toBe(1);
      expect(calculateTotals([{ score: 6.9 } as ShotTelemetry]).earnedStars).toBe(0);
    });
  });

  describe('assembleRangeCard', () => {
    it('should assemble range card from shots', () => {
      const shots: ShotTelemetry[] = [
        {
          shotNumber: 1,
          windUsedMps: 5,
          windDirectionDeg: 90,
          elevationMils: 0,
          windageMils: 0,
          timeOfFlightS: 1.0,
          distanceM: 100,
          impactX: 0,
          impactY: 0,
          score: 10,
        },
      ];

      const rangeCard = assembleRangeCard(
        'level-1',
        'Test Level',
        100,
        'pistol',
        shots,
        Date.now() - 10000,
        Date.now()
      );

      expect(rangeCard.levelId).toBe('level-1');
      expect(rangeCard.levelName).toBe('Test Level');
      expect(rangeCard.distanceM).toBe(100);
      expect(rangeCard.weaponId).toBe('pistol');
      expect(rangeCard.shots).toHaveLength(1);
      expect(rangeCard.timestamps.endedAt - rangeCard.timestamps.startedAt).toBe(10000);
    });
  });

  describe('generateSummary', () => {
    it('should generate summary string', () => {
      const shots = [
        { score: 10 } as ShotTelemetry,
        { score: 8 } as ShotTelemetry,
        { score: 9 } as ShotTelemetry,
      ];
      const totals = calculateTotals(shots);
      const summary = generateSummary(totals, shots);

      expect(summary).toContain('3 shots');
      expect(summary).toContain('Avg: 9.00');
      expect(summary).toContain('Best: 10');
      expect(summary).toContain('⭐⭐'); // 2 stars
    });

    it('should generate 3-star summary', () => {
      const shots = [
        { score: 10 } as ShotTelemetry,
        { score: 10 } as ShotTelemetry,
        { score: 10 } as ShotTelemetry,
      ];
      const totals = calculateTotals(shots);
      const summary = generateSummary(totals, shots);

      expect(summary).toContain('⭐⭐⭐');
    });
  });
});
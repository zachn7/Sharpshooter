/**
 * Range card utilities
 * 
 * Provides functions for assembling, formatting, and analyzing shot telemetry
 * for the range card display.
 */

import type {
  ShotTelemetry,
  RangeCard,
  RangeCardShotRow,
  RangeCardTotals,
} from '../types';

/**
 * Format wind for display
 * @param speedMps - Wind speed in m/s
 * @param directionDeg - Wind direction in degrees (0 = from right)
 */
export function formatWind(speedMps: number, directionDeg: number): string {
  if (speedMps === 0) return '0 m/s';
  
  // Direction: 0 = from right, 90 = from left, 180 = from left, etc.
  // Simplify to cardinal directions
  let direction = '→';
  if (directionDeg > 45 && directionDeg <= 135) direction = '↑'; // Up
  else if (directionDeg > 135 && directionDeg <= 225) direction = '←'; // Left
  else if (directionDeg > 225 && directionDeg <= 315) direction = '↓'; // Down
  
  return `${direction} ${speedMps.toFixed(1)}`;
}

/**
 * Format dials for display
 * @param elevationMils - Elevation in mils
 * @param windageMils - Windage in mils
 */
export function formatDials(elevationMils: number, windageMils: number): string {
  const e = elevationMils.toFixed(1);
  const w = windageMils.toFixed(1);
  return `${e} ↑ / ${w} ←`;
}

/**
 * Format time of flight for display
 * @param seconds - Time in seconds
 */
export function formatTimeOfFlight(seconds: number): string {
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(0)} ms`;
  }
  return `${seconds.toFixed(3)} s`;
}

/**
 * Format impact offset for display
 * @param x - X offset in meters (positive = right)
 * @param y - Y offset in meters (positive = up)
 */
export function formatImpact(x: number, y: number): string {
  const xStr = x >= 0 ? `+${x.toFixed(2)}` : x.toFixed(2);
  const yStr = y >= 0 ? `+${y.toFixed(2)}` : y.toFixed(2);
  return `${xStr}m ${yStr}m`;
}

/**
 * Convert shot telemetry to display row
 */
export function shotToRow(shot: ShotTelemetry): RangeCardShotRow {
  return {
    shotNumber: shot.shotNumber,
    windUsed: formatWind(shot.windUsedMps, shot.windDirectionDeg),
    dials: formatDials(shot.elevationMils, shot.windageMils),
    timeOfFlight: formatTimeOfFlight(shot.timeOfFlightS),
    impact: formatImpact(shot.impactX, shot.impactY),
    score: shot.score,
  };
}

/**
 * Calculate distance between two points
 */
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Calculate group size (max distance between any two shots)
 * @param shots - Array of shot telemetry
 */
export function calculateGroupSize(shots: ShotTelemetry[]): number {
  if (shots.length < 2) return 0;
  
  let maxDist = 0;
  for (let i = 0; i < shots.length; i++) {
    for (let j = i + 1; j < shots.length; j++) {
      const dist = distance(
        shots[i].impactX,
        shots[i].impactY,
        shots[j].impactX,
        shots[j].impactY
      );
      maxDist = Math.max(maxDist, dist);
    }
  }
  return maxDist;
}

/**
 * Calculate range card totals
 * @param shots - Array of shot telemetry
 */
export function calculateTotals(shots: ShotTelemetry[]): RangeCardTotals {
  if (shots.length === 0) {
    return {
      totalScore: 0,
      avgScore: 0,
      groupSizeMeters: 0,
      bestRing: 0,
      earnedStars: 0,
    };
  }

  const totalScore = shots.reduce((sum, s) => sum + s.score, 0);
  const avgScore = totalScore / shots.length;
  const groupSize = calculateGroupSize(shots);
  const bestRing = Math.max(...shots.map(s => s.score));

  // Calculate earned stars based on avg score (similar to game logic)
  let earnedStars = 0;
  if (avgScore >= 9.5) earnedStars = 3;
  else if (avgScore >= 8.5) earnedStars = 2;
  else if (avgScore >= 7.0) earnedStars = 1;

  return {
    totalScore,
    avgScore,
    groupSizeMeters: groupSize,
    bestRing,
    earnedStars,
  };
}

/**
 * Assemble range card from shots
 * @param levelId - Level ID
 * @param levelName - Level name
 * @param distanceM - Level distance in meters
 * @param weaponId - Weapon ID
 * @param shots - Array of shot telemetry
 * @param startedAt - Timestamp when session started
 * @param endedAt - Timestamp when session ended
 */
export function assembleRangeCard(
  levelId: string,
  levelName: string,
  distanceM: number,
  weaponId: string,
  shots: ShotTelemetry[],
  startedAt: number,
  endedAt: number
): RangeCard {
  return {
    levelId,
    levelName,
    distanceM,
    weaponId,
    shots,
    timestamps: {
      startedAt,
      endedAt,
    },
  };
}

/**
 * Generate summary text for range card
 * @param totals - Range card totals
 * @param shots - Array of shot telemetry
 */
export function generateSummary(
  totals: RangeCardTotals,
  shots: ShotTelemetry[]
): string {
  const avg = totals.avgScore.toFixed(2);
  const group = totals.groupSizeMeters.toFixed(3);
  const best = totals.bestRing.toFixed(0);
  const stars = '⭐'.repeat(totals.earnedStars);
  
  return `${shots.length} shots | Avg: ${avg} | Group: ${group}m | Best: ${best} | ${stars}`;
}
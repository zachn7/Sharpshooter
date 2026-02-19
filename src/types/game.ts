/**
 * Game-related types for range card and replay functionality
 */

/**
 * Path point recorded during shot trajectory
 */
export interface PathPoint {
  x: number; // Horizontal position in meters
  y: number; // Vertical position in meters
  t: number; // Time in seconds
}

/**
 * Shot telemetry recorded for range card and replay
 */
export interface ShotTelemetry {
  shotNumber: number; // 1-based shot number in the series
  windUsedMps: number; // Wind speed used for this shot (m/s)
  windDirectionDeg: number; // Wind direction used (degrees)
  elevationMils: number; // Turret elevation setting
  windageMils: number; // Turret windage setting
  timeOfFlightS: number; // Time to target (seconds)
  distanceM: number; // Shot distance (meters)
  impactX: number; // Impact X offset from center (meters)
  impactY: number; // Impact Y offset from center (meters)
  score: number; // Score (0-10)
  path?: PathPoint[]; // Optional recorded path points (max 20 points)
}

/**
 * Range card summary for a shot series
 */
export interface RangeCard {
  levelId: string;
  levelName: string;
  distanceM: number;
  weaponId: string;
  shots: ShotTelemetry[];
  timestamps: {
    startedAt: number;
    endedAt: number;
  };
}

/**
 * Range card shot row for display
 */
export interface RangeCardShotRow {
  shotNumber: number;
  windUsed: string; // Formatted wind string
  dials: string; // Formatted dial string
  timeOfFlight: string; // Formatted time string
  impact: string; // Formatted impact string (e.g., "+0.1 -0.2")
  score: number;
}

/**
 * Range card totals
 */
export interface RangeCardTotals {
  totalScore: number;
  avgScore: number;
  groupSizeMeters: number; // Max distance between any two shots
  bestRing: number; // Highest single-shot score
  earnedStars: number;
}
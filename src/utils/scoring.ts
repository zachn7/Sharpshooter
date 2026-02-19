interface TargetConfig {
  centerX: number;
  centerY: number;
  rings: Array<{ radius: number; score: number }>;
}

interface Impact {
  x: number;
  y: number;
}

// Plate target interface (mirrored from levels.ts)
export interface PlateTarget {
  id: string;
  centerY_M: number;
  centerZ_M: number;
  radiusM: number;
  points: number;
  label?: string;
}

// Impact with depth (for plates mode)
export interface Impact3D {
  y_M: number;
  z_M: number;
}

export function calculateRingScore(impact: Impact, targetConfig: TargetConfig): number {
  const dx = impact.x - targetConfig.centerX;
  const dy = impact.y - targetConfig.centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Check rings from innermost (highest score) to outermost
  for (const ring of targetConfig.rings.sort((a, b) => a.radius - b.radius)) {
    if (distance <= ring.radius) {
      return ring.score;
    }
  }

  // Outside all rings = miss (0 points)
  return 0;
}

export function createStandardTarget(centerX: number, centerY: number): TargetConfig {
  return {
    centerX,
    centerY,
    rings: [
      { radius: 0.05, score: 10 }, // Bullseye
      { radius: 0.1, score: 9 },
      { radius: 0.15, score: 8 },
      { radius: 0.2, score: 7 },
      { radius: 0.25, score: 6 },
      { radius: 0.3, score: 5 },
      { radius: 0.35, score: 4 },
      { radius: 0.4, score: 3 },
      { radius: 0.45, score: 2 },
      { radius: 0.5, score: 1 },
    ],
  };
}

/**
 * Check if a 3D impact hits a plate target
 * @param impact - The impact position in world coordinates (y, z)
 * @param plate - The plate target configuration
 * @returns The points earned (0 if miss, plate.points if hit)
 */
export function checkPlateHit(impact: Impact3D, plate: PlateTarget): number {
  const dy = impact.y_M - plate.centerY_M;
  const dz = impact.z_M - plate.centerZ_M;
  const distance = Math.sqrt(dy * dy + dz * dz);

  if (distance <= plate.radiusM) {
    return plate.points;
  }

  return 0;
}

/**
 * Find the first plate target that was hit by an impact
 * @param impact - The impact position in world coordinates (y, z)
 * @param plates - Array of plate targets
 * @returns The plate that was hit (undefined if miss) and points earned
 */
export function findHitPlate(impact: Impact3D, plates: PlateTarget[]): { plate?: PlateTarget; points: number } {
  for (const plate of plates) {
    const points = checkPlateHit(impact, plate);
    if (points > 0) {
      return { plate, points };
    }
  }
  return { points: 0 };
}

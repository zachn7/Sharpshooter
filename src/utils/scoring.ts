interface TargetConfig {
  centerX: number;
  centerY: number;
  rings: Array<{ radius: number; score: number }>;
}

interface Impact {
  x: number;
  y: number;
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

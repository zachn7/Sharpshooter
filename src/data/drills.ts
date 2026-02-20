/**
 * Training Drills Configuration
 * Deterministic scenario generators for various training modes
 */

export interface DrillScenario {
  id: string;
  seed: number;
  distanceM: number;
  windMps: number;
  gustMps: number;
  env: {
    temperatureC: number;
    altitudeM: number;
  };
  targetMode: 'bullseye' | 'plates';
  maxShots: number;
  timeLimit?: number; // Time limit in seconds (for timed drills)
  plates?: Array<{ id: string; x_M: number; z_M: number; points: number }>;
}

export interface DrillResult {
  drillId: string;
  seed: number;
  score: number;
  completedAt: number;
  shots: Array<{
    score: number;
    elevationMils: number;
    windageMils: number;
  }>;
}

export interface Drill {
  id: string;
  name: string;
  description: string;
  type: 'wind-ladder' | 'holdover-ladder' | 'cold-bore' | 'speed-plates';
  maxShots: number;
  timeLimit?: number;
}

export const DRILLS: Drill[] = [
  {
    id: 'wind-ladder',
    name: 'Wind Ladder',
    description: 'Progressive wind values from 5 m/s to 8 m/s. Test your wind reading and turret dialing skills.',
    type: 'wind-ladder',
    maxShots: 6,
  },
  {
    id: 'holdover-ladder',
    name: 'Holdover Ladder',
    description: 'Engage targets at 50m, 100m, 150m, 200m, and 250m. Practice holdovers and turret adjustments.',
    type: 'holdover-ladder',
    maxShots: 5,
  },
  {
    id: 'cold-bore',
    name: 'Cold Bore',
    description: 'One shot at 300m with unknown conditions. Test your first-shot accuracy under pressure.',
    type: 'cold-bore',
    maxShots: 1,
  },
  {
    id: 'speed-plates',
    name: 'Speed Plates',
    description: 'Hit 5 plates as fast as possible. 30-second time limit.',
    type: 'speed-plates',
    maxShots: 10,
    timeLimit: 30,
  },
];

/**
 * Simple pseudo-random number generator for determinism
 */
function rng(state: number): { value: number; newState: number } {
  const stateInt = Math.floor(state * 2147483647.0) % 2147483647;
  const newState = (stateInt * 16807) % 2147483647;
  return {
    value: (newState - 1) / 2147483646.0, // Normalized 0-1
    newState,
  };
}

/**
 * Generate Wind Ladder drill scenario
 * Progressive wind: 5, 6, 7, 8, 5, 6 m/s from left or right
 */
function generateWindLadderScenario(drillId: string, attemptNumber: number): DrillScenario {
  const seed = stringHash(drillId + attemptNumber);
  let state = rng(seed).newState;

  const windDir = state > 0.5 ? 1 : -1; // 50% chance from left or right

  // Generate 6 shots with progressive wind
  const shots = [];
  for (let i = 0; i < 6; i++) {
    state = rng(state).newState;
    shots.push(windDir * (5 + Math.floor(i / 2))); // 5,5,6,6,7,7 m/s then repeats
  }

  return {
    id: drillId,
    seed,
    distanceM: 150,
    windMps: shots[0],
    gustMps: 0,
    env: {
      temperatureC: 20,
      altitudeM: 500,
    },
    targetMode: 'bullseye',
    maxShots: 6,
    plates: undefined,
  };
}

/**
 * Generate Holdover Ladder drill scenario
 * Multiple distances: 50, 100, 150, 200, 250m with mild wind
 */
function generateHoldoverLadderScenario(drillId: string, attemptNumber: number): DrillScenario {
  const seed = stringHash(drillId + attemptNumber);
  let state = rng(seed).newState;

  // Random but consistent wind direction
  state = rng(state).newState;
  const windDir = state > 0.5 ? 1 : -1;

  // Light crosswind: 3 m/s
  state = rng(state).newState;
  const windMps = windDir * 3;

  return {
    id: drillId,
    seed,
    distanceM: 150, // Default first target
    windMps,
    gustMps: 0.5,
    env: {
      temperatureC: 15,
      altitudeM: 200,
    },
    targetMode: 'bullseye',
    maxShots: 5,
    plates: undefined,
  };
}

/**
 * Generate Cold Bore drill scenario
 * Single shot at 300m with random conditions
 */
function generateColdBoreScenario(drillId: string, attemptNumber: number): DrillScenario {
  const seed = stringHash(drillId + attemptNumber);
  let state = rng(seed).newState;

  // Random wind: -8 to 8 m/s
  state = rng(state).newState;
  const r1 = rng(state);
  state = r1.newState;
  const windMps = Math.round((r1.value * 16 - 8) * 10) / 10;

  // Random gust: 0 to 3 m/s
  const r2 = rng(state);
  state = r2.newState;
  const gustMps = windMps !== 0 ? Math.round(r2.value * 30) / 10 : 0;

  // Random altitude: 0 to 2000m (affects air density)
  const r3 = rng(state);
  state = r3.newState;
  const altitudeM = Math.max(0, Math.floor(Math.abs(r3.value) * 2000));

  return {
    id: drillId,
    seed,
    distanceM: 300,
    windMps,
    gustMps,
    env: {
      temperatureC: 20,
      altitudeM,
    },
    targetMode: 'bullseye',
    maxShots: 1,
    plates: undefined,
  };
}

/**
 * Generate Speed Plates drill scenario
 * 5 plates scattered with 30-second time limit
 */
function generateSpeedPlatesScenario(drillId: string, attemptNumber: number): DrillScenario {
  const seed = stringHash(drillId + attemptNumber);
  let state = rng(seed).newState;

  // Generate 5 plates with deterministic positions
  const plates = [];
  for (let i = 0; i < 5; i++) {
    const r1 = rng(state);
    state = r1.newState;
    const x_M = (r1.value - 0.5) * 0.3; // -0.15 to 0.15 meters from center

    const r2 = rng(state);
    state = r2.newState;
    const z_M = (r2.value - 0.5) * 0.3; // -0.15 to 0.15 meters from center

    plates.push({
      id: `plate-${i}`,
      x_M,
      z_M,
      points: 2,
    });
  }

  // Light wind to add challenge
  state = rng(state).newState;
  const windDir = state > 0.5 ? 1 : -1;
  const windMps = windDir * 2;

  return {
    id: drillId,
    seed,
    distanceM: 100,
    windMps,
    gustMps: 0,
    env: {
      temperatureC: 22,
      altitudeM: 100,
    },
    targetMode: 'plates',
    maxShots: 10,
    timeLimit: 30,
    plates,
  };
}

/**
 * Generate a drill scenario based on drill type and attempt number
 * @param drillId - The drill ID
 * @param attemptNumber - The attempt number for variation (default: 1)
 * @returns Drill scenario configuration
 */
export function generateDrillScenario(drillId: string, attemptNumber = 1): DrillScenario {
  switch (drillId) {
    case 'wind-ladder':
      return generateWindLadderScenario(drillId, attemptNumber);
    case 'holdover-ladder':
      return generateHoldoverLadderScenario(drillId, attemptNumber);
    case 'cold-bore':
      return generateColdBoreScenario(drillId, attemptNumber);
    case 'speed-plates':
      return generateSpeedPlatesScenario(drillId, attemptNumber);
    default:
      throw new Error(`Unknown drill type: ${drillId}`);
  }
}

/**
 * Simple string hash function for seeding
 */
function stringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

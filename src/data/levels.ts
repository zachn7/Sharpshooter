// Level difficulty tiers
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

// Level configuration
export interface Level {
  id: string;
  packId: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  
  // Required weapon type (any unlocked weapon of this type can be used)
  requiredWeaponType: 'pistol' | 'rifle' | 'sniper' | 'shotgun' | 'any';
  
  // Distance parameters
  distanceM: number;           // Target distance in meters
  
  // Environmental parameters
  windMps: number;             // Base crosswind speed (m/s, + = left-to-right)
  gustMps: number;             // Gust variation range (+/-)
  airDensityKgM3: number;      // Air density (default 1.225 at sea level)
  gravityMps2: number;         // Gravity (default 9.80665)
  
  // Target configuration
  targetScale: number;         // Target size multiplier (1.0 = standard)
  
  // Gameplay parameters
  maxShots: number;            // Number of shots allowed
  timeLimitS?: number;         // Optional time limit in seconds
  
  // Star thresholds (cumulative score required)
  starThresholds: {
    one: number;               // 1 star threshold
    two: number;               // 2 star threshold
    three: number;             // 3 star threshold
  };
  
  unlocked: boolean;           // Level locked status
}

// Level pack (collection of related levels)
export interface LevelPack {
  id: string;
  name: string;
  description: string;
  levels: string[];            // Level IDs in this pack
  weaponType: 'pistol' | 'rifle' | 'sniper' | 'shotgun' | 'any';
}

// All level packs
export const LEVEL_PACKS: LevelPack[] = [
  {
    id: 'pistol-basics',
    name: 'Pistol Basics',
    description: 'Learn fundamentals with training pistols',
    levels: ['pistol-calm', 'pistol-windy', 'pistol-gusty'],
    weaponType: 'pistol',
  },
  {
    id: 'pistol-marksman',
    name: 'Pistol Marksman',
    description: 'Advanced challenges for pistols',
    levels: ['pistol-long-range', 'pistol-blizzard'],
    weaponType: 'pistol',
  },
  {
    id: 'rifle-fundamentals',
    name: 'Rifle Fundamentals',
    description: 'Mid-range rifle engagements',
    levels: ['rifle-standard', 'rifle-windy-day'],
    weaponType: 'rifle',
  },
  {
    id: 'sniper-basics',
    name: 'Sniper Basics',
    description: 'Long-range precision shooting',
    levels: ['sniper-calm', 'sniper-windy', 'sniper-gale'],
    weaponType: 'sniper',
  },
  {
    id: 'expert-challenge',
    name: 'Expert Challenge',
    description: 'Extreme conditions for expert marksman',
    levels: ['expert-blizzard', 'expert-hurricane'],
    weaponType: 'any',
  },
];

// All levels
export const LEVELS: Level[] = [
  // ===== PISTOL BASICS =====
  {
    id: 'pistol-calm',
    packId: 'pistol-basics',
    name: 'Calm Day',
    description: 'Perfect conditions for practice. No wind, no stress.',
    difficulty: 'easy',
    requiredWeaponType: 'pistol',
    distanceM: 25,
    windMps: 0,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.0,
    maxShots: 5,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },
  {
    id: 'pistol-windy',
    packId: 'pistol-basics',
    name: 'Windy Day',
    description: 'Light breeze affects your aim. Compensate for drift.',
    difficulty: 'easy',
    requiredWeaponType: 'pistol',
    distanceM: 25,
    windMps: 2,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.0,
    maxShots: 5,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },
  {
    id: 'pistol-gusty',
    packId: 'pistol-basics',
    name: 'Gusty Conditions',
    description: 'Variable winds make each shot unpredictable.',
    difficulty: 'medium',
    requiredWeaponType: 'pistol',
    distanceM: 25,
    windMps: 3,
    gustMps: 1.5,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.0,
    maxShots: 5,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },

  // ===== PISTOL MARKSMAN =====
  {
    id: 'pistol-long-range',
    packId: 'pistol-marksman',
    name: 'Long Range Pistol',
    description: 'Pushing pistol capability to the limit.',
    difficulty: 'hard',
    requiredWeaponType: 'pistol',
    distanceM: 50,
    windMps: 2,
    gustMps: 1,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 0.8,
    maxShots: 5,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },
  {
    id: 'pistol-blizzard',
    packId: 'pistol-marksman',
    name: 'Pistol Blizzard',
    description: 'Extreme winds at long range. Expert pistol challenge.',
    difficulty: 'expert',
    requiredWeaponType: 'pistol',
    distanceM: 50,
    windMps: 8,
    gustMps: 3,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 0.7,
    maxShots: 5,
    starThresholds: { one: 8, two: 18, three: 28 },
    unlocked: true,
  },

  // ===== RIFLE FUNDAMENTALS =====
  {
    id: 'rifle-standard',
    packId: 'rifle-fundamentals',
    name: 'Standard Range',
    description: 'Classic rifle range conditions.',
    difficulty: 'easy',
    requiredWeaponType: 'rifle',
    distanceM: 100,
    windMps: 3,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.0,
    maxShots: 5,
    starThresholds: { one: 15, two: 30, three: 45 },
    unlocked: true,
  },
  {
    id: 'rifle-windy-day',
    packId: 'rifle-fundamentals',
    name: 'Windy Range',
    description: 'Moderate crosswind requires precise compensation.',
    difficulty: 'medium',
    requiredWeaponType: 'rifle',
    distanceM: 100,
    windMps: 5,
    gustMps: 1,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.0,
    maxShots: 5,
    starThresholds: { one: 15, two: 30, three: 45 },
    unlocked: true,
  },

  // ===== SNIPER BASICS =====
  {
    id: 'sniper-calm',
    packId: 'sniper-basics',
    name: 'Sniper Calm',
    description: 'Perfect conditions for precision shooting.',
    difficulty: 'medium',
    requiredWeaponType: 'sniper',
    distanceM: 300,
    windMps: 2,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 0.5,
    maxShots: 3,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },
  {
    id: 'sniper-windy',
    packId: 'sniper-basics',
    name: 'Sniper Windy',
    description: 'Crosswind at long range tests your read.',
    difficulty: 'hard',
    requiredWeaponType: 'sniper',
    distanceM: 300,
    windMps: 8,
    gustMps: 2,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 0.5,
    maxShots: 3,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },
  {
    id: 'sniper-gale',
    packId: 'sniper-basics',
    name: 'Sniper Gale',
    description: 'Strong gusts at extreme range.',
    difficulty: 'expert',
    requiredWeaponType: 'sniper',
    distanceM: 400,
    windMps: 10,
    gustMps: 4,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 0.4,
    maxShots: 3,
    starThresholds: { one: 8, two: 18, three: 28 },
    unlocked: true,
  },

  // ===== EXPERT CHALLENGE =====
  {
    id: 'expert-blizzard',
    packId: 'expert-challenge',
    name: 'Expert Blizzard',
    description: 'Choose your weapon. Extreme conditions await.',
    difficulty: 'expert',
    requiredWeaponType: 'any',
    distanceM: 250,
    windMps: 12,
    gustMps: 6,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 0.6,
    maxShots: 5,
    starThresholds: { one: 15, two: 30, three: 45 },
    unlocked: true,
  },
  {
    id: 'expert-hurricane',
    packId: 'expert-challenge',
    name: 'Hurricane Force',
    description: 'The ultimate test of any marksman.',
    difficulty: 'expert',
    requiredWeaponType: 'any',
    distanceM: 300,
    windMps: 15,
    gustMps: 8,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 0.5,
    maxShots: 5,
    starThresholds: { one: 15, two: 30, three: 45 },
    unlocked: true,
  },
];

// Helper: Get level by ID
export function getLevelById(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

// Helper: Get levels in a pack (without dynamic unlock)
export function getLevelsByPack(packId: string): Level[] {
  return LEVELS.filter((l) => l.packId === packId);
}

// Helper: Get pack by ID
export function getPackById(id: string): LevelPack | undefined {
  return LEVEL_PACKS.find((p) => p.id === id);
}

// Helper: Get levels in a pack with dynamic unlock status
// This function requires getLevelProgress to be passed as a parameter to avoid circular imports
export function getLevelsByPackWithUnlock(
  packId: string,
  allLevelIds: string[],
  getLevelProgress: (levelId: string) => { stars: number; bestScore: number; attempts: number; lastPlayedAt: number } | undefined
): Level[] {
  return getLevelsByPack(packId).map(level => ({
    ...level,
    unlocked: allLevelIds.indexOf(level.id) === 0 || 
              checkPreviousLevelUnlocked(level.id, allLevelIds, getLevelProgress)
  }));
}

// Internal helper to check if previous level is unlocked
function checkPreviousLevelUnlocked(
  levelId: string,
  allLevelIds: string[],
  getLevelProgress: (levelId: string) => { stars: number; bestScore: number; attempts: number; lastPlayedAt: number } | undefined
): boolean {
  const currentIndex = allLevelIds.indexOf(levelId);
  if (currentIndex <= 0) return true;
  
  const previousLevelId = allLevelIds[currentIndex - 1];
  const previousProgress = getLevelProgress(previousLevelId);
  return (previousProgress?.stars ?? 0) >= 1;
}

// Calculate stars earned (0-3) from score
export function calculateStars(score: number, thresholds: { one: number; two: number; three: number }): 0 | 1 | 2 | 3 {
  if (score >= thresholds.three) return 3;
  if (score >= thresholds.two) return 2;
  if (score >= thresholds.one) return 1;
  return 0;
}

// Get level with unlocked status from storage
// This function requires getLevelProgress to be passed as a parameter to avoid circular imports
export function getLevelWithUnlockStatus(
  levelId: string,
  getLevelProgress: (levelId: string) => { stars: number; bestScore: number; attempts: number; lastPlayedAt: number } | undefined
): Level | undefined {
  const level = getLevelById(levelId);
  if (!level) return undefined;
  
  // Get all level IDs to determine index
  const allLevelIds = LEVELS.map(l => l.id);
  
  // Dynamically determine unlock status from storage
  const unlocked = checkPreviousLevelUnlocked(levelId, allLevelIds, getLevelProgress);
  
  return { ...level, unlocked };
}

// Default level for quick play
export const DEFAULT_LEVEL_ID = 'pistol-calm';

// Level difficulty tiers
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

// Environment preset for level
export interface LevelEnvironment {
  temperatureC: number;        // Temperature in Celsius (default 15°C)
  altitudeM: number;           // Altitude in meters (default 0m = sea level)
}

// Target mode type
export type TargetMode = 'bullseye' | 'plates';

// Individual plate target for 'plates' mode
export interface PlateTarget {
  id: string;                 // Unique identifier for the plate
  centerY_M: number;          // Y position in world coordinates
  centerZ_M: number;          // Z position (depth) in world coordinates
  radiusM: number;            // Radius in meters
  points: number;             // Points for hitting this plate
  label?: string;             // Optional label (e.g., "A1", "B2")
  // Moving target parameters
  moving?: {
    speedMps: number;         // Speed in meters per second
    axis: 'horizontal' | 'vertical'; // Movement axis
    amplitudeM: number;       // Movement amplitude in meters (half the total travel distance)
  };
}

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
  env?: LevelEnvironment;      // Optional environment preset
  windMps: number;             // Base crosswind speed (m/s, + = left-to-right)
  windDirectionDeg?: number;   // Wind direction (0-360°, 0=from right, 90=from top)
  gustMps: number;             // Gust variation range (+/-)
  airDensityKgM3: number;      // Air density (default 1.225 at sea level)
  gravityMps2: number;         // Gravity (default 9.80665)
  
  // Advanced sim parameters (for Expert extras)
  headingDegrees?: number;     // Shooting direction (0-360°, 0=North, 90=East) - for Coriolis
  latitudeDegrees?: number;    // Shooting latitude (°, default 45°) - for Coriolis
  
  // Target configuration
  targetMode?: TargetMode;     // Target mode: 'bullseye' or 'plates' (default 'bullseye')
  targets?: PlateTarget[];     // Individual targets for 'plates' mode
  targetScale?: number;        // Target size multiplier for 'bullseye' mode (1.0 = standard, omitted for plates mode)
  
  // Gameplay parameters
  maxShots: number;            // Number of shots allowed
  timerSeconds?: number;       // Optional countdown timer in seconds (after this, firing is blocked)
  
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
    id: 'pistols',
    name: 'Pistols',
    description: 'Comprehensive pistol pack: close-range combat, rapid engagement, and recoil management',
    levels: [
      'pistols-1-cqc', 'pistols-2-wind-adapt', 'pistols-3-rapid-fire',
      'pistols-4-close-wind', 'pistols-5-timed-string', 'pistols-6-switch-draw',
      'pistols-7-gusty-urban', 'pistols-8-pressure-point', 'pistols-9-double-tap',
      'pistols-10-urban-engage'
    ],
    weaponType: 'pistol',
  },
  {
    id: 'rifle-basics',
    name: 'Rifle Basics',
    description: 'Master rifle fundamentals with progressive challenges',
    levels: [
      'rifle-basics-1', 'rifle-basics-2', 'rifle-basics-3',
      'rifle-basics-4', 'rifle-basics-5', 'rifle-basics-6',
      'rifle-basics-7', 'rifle-basics-8', 'rifle-basics-9', 'rifle-basics-10',
      'rifle-basics-plates', 'rifle-basics-timed'
    ],
    weaponType: 'rifle',
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
  {
    id: 'shotguns-pack',
    name: 'Shotguns Pack',
    description: 'Moving targets: clays and plates with drifting motion',
    levels: [
      'shotgun-intro', 'shotgun-clays-1', 'shotgun-clays-2',
      'shotgun-plates-1', 'shotgun-plates-2', 'shotgun-plates-3',
      'shotgun-speed-1', 'shotgun-speed-2', 'shotgun-master'
    ],
    weaponType: 'shotgun',
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
    env: { temperatureC: 15, altitudeM: 0 },
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

  // ===== PISTOLS PACK =-==-===
  {
    id: 'pistols-1-cqc',
    packId: 'pistols',
    name: 'Close Quarters',
    description: 'Master pistol fundamentals at close range with stable conditions.',
    difficulty: 'easy',
    requiredWeaponType: 'pistol',
    distanceM: 25,
    env: { temperatureC: 20, altitudeM: 0 },
    windMps: 0,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.2,
    maxShots: 5,
    starThresholds: { one: 12, two: 24, three: 36 },
    unlocked: true,
  },
  {
    id: 'pistols-2-wind-adapt',
    packId: 'pistols',
    name: 'Wind Adapt',
    description: 'Learn to compensate for light breeze at pistol range.',
    difficulty: 'easy',
    requiredWeaponType: 'pistol',
    distanceM: 25,
    windMps: 2.5,
    gustMps: 0.5,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.15,
    maxShots: 6,
    starThresholds: { one: 15, two: 30, three: 45 },
    unlocked: true,
  },
  {
    id: 'pistols-3-rapid-fire',
    packId: 'pistols',
    name: 'Rapid Fire',
    description: 'Quick engagement with 8 shots. Manage recoil between shots.',
    difficulty: 'medium',
    requiredWeaponType: 'pistol',
    distanceM: 25,
    windMps: 1.5,
    gustMps: 0.5,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.1,
    maxShots: 8,
    starThresholds: { one: 20, two: 40, three: 60 },
    unlocked: true,
  },
  {
    id: 'pistols-4-close-wind',
    packId: 'pistols',
    name: 'Close Wind',
    description: 'Variable gusts require constant adjustment.',
    difficulty: 'medium',
    requiredWeaponType: 'pistol',
    distanceM: 25,
    windMps: 3.5,
    gustMps: 2,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.0,
    maxShots: 7,
    starThresholds: { one: 18, two: 35, three: 52 },
    unlocked: true,
  },
  {
    id: 'pistols-5-timed-string',
    packId: 'pistols',
    name: 'Timed String',
    description: 'Hit 5 plates under time pressure. Speed and precision combined.',
    difficulty: 'medium',
    requiredWeaponType: 'pistol',
    distanceM: 35,
    env: { temperatureC: 18, altitudeM: 200 },
    windMps: 2,
    gustMps: 1,
    airDensityKgM3: 1.19,
    gravityMps2: 9.80665,
    targetMode: 'plates',
    targets: [
      { id: 'p5-1', centerY_M: 0.05, centerZ_M: -0.05, radiusM: 0.04, points: 3 },
      { id: 'p5-2', centerY_M: -0.03, centerZ_M: -0.02, radiusM: 0.04, points: 3 },
      { id: 'p5-3', centerY_M: 0.02, centerZ_M: 0.06, radiusM: 0.04, points: 3 },
      { id: 'p5-4', centerY_M: -0.06, centerZ_M: 0.03, radiusM: 0.04, points: 3 },
      { id: 'p5-5', centerY_M: 0.04, centerZ_M: -0.08, radiusM: 0.04, points: 3 },
    ],
    targetScale: 1.0,
    maxShots: 10,
    timerSeconds: 45,
    starThresholds: { one: 12, two: 21, three: 30 },
    unlocked: true,
  },
  {
    id: 'pistols-6-switch-draw',
    packId: 'pistols',
    name: 'Switch Draw',
    description: 'Rapid target switching. Acquire each plate quickly.',
    difficulty: 'medium',
    requiredWeaponType: 'pistol',
    distanceM: 30,
    windMps: 2,
    gustMps: 1,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetMode: 'plates',
    targets: [
      { id: 'p6-1', centerY_M: 0.08, centerZ_M: -0.04, radiusM: 0.045, points: 2 },
      { id: 'p6-2', centerY_M: -0.07, centerZ_M: 0.05, radiusM: 0.045, points: 2 },
      { id: 'p6-3', centerY_M: 0.02, centerZ_M: 0.08, radiusM: 0.045, points: 2 },
      { id: 'p6-4', centerY_M: -0.05, centerZ_M: -0.06, radiusM: 0.045, points: 2 },
    ],
    targetScale: 1.0,
    maxShots: 8,
    starThresholds: { one: 8, two: 14, three: 20 },
    unlocked: true,
  },
  {
    id: 'pistols-7-gusty-urban',
    packId: 'pistols',
    name: 'Gusty Urban',
    description: 'Urban environment with unpredictable wind gusts.',
    difficulty: 'hard',
    requiredWeaponType: 'pistol',
    distanceM: 30,
    env: { temperatureC: 22, altitudeM: 500 },
    windMps: 5,
    gustMps: 3.5,
    airDensityKgM3: 1.16,
    gravityMps2: 9.80665,
    targetScale: 0.95,
    maxShots: 7,
    starThresholds: { one: 16, two: 30, three: 44 },
    unlocked: true,
  },
  {
    id: 'pistols-8-pressure-point',
    packId: 'pistols',
    name: 'Pressure Point',
    description: 'Longer pistol range with smaller target. High stakes.',
    difficulty: 'hard',
    requiredWeaponType: 'pistol',
    distanceM: 40,
    windMps: 4,
    gustMps: 2,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 0.85,
    maxShots: 6,
    starThresholds: { one: 14, two: 28, three: 42 },
    unlocked: true,
  },
  {
    id: 'pistols-9-double-tap',
    packId: 'pistols',
    name: 'Double Tap',
    description: 'Fast double-tap drills. Manage recoil quickly between shots.',
    difficulty: 'hard',
    requiredWeaponType: 'pistol',
    distanceM: 25,
    windMps: 2.5,
    gustMps: 1.5,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.0,
    maxShots: 10,
    starThresholds: { one: 25, two: 50, three: 75 },
    unlocked: true,
  },
  {
    id: 'pistols-10-urban-engage',
    packId: 'pistols',
    name: 'Urban Engagement',
    description: 'Final exam: timed engagement at extended range with targets.',
    difficulty: 'expert',
    requiredWeaponType: 'pistol',
    distanceM: 50,
    env: { temperatureC: 20, altitudeM: 350 },
    windMps: 6,
    gustMps: 2.5,
    airDensityKgM3: 1.18,
    gravityMps2: 9.80665,
    targetMode: 'plates',
    targets: [
      { id: 'p10-1', centerY_M: 0.1, centerZ_M: 0, radiusM: 0.06, points: 4, label: 'A' },
      { id: 'p10-2', centerY_M: 0, centerZ_M: 0.1, radiusM: 0.06, points: 4, label: 'B' },
      { id: 'p10-3', centerY_M: -0.1, centerZ_M: 0, radiusM: 0.06, points: 4, label: 'C' },
    ],
    targetScale: 0.9,
    maxShots: 9,
    timerSeconds: 60,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },

  // ===== RIFLE BASICS (10 levels with tutorials) =====
  {
    id: 'rifle-basics-1',
    packId: 'rifle-basics',
    name: 'First Shot',
    description: 'Welcome! Perfect conditions to learn rifle shooting.',
    difficulty: 'easy',
    requiredWeaponType: 'rifle',
    distanceM: 50,
    windMps: 0,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.0,
    maxShots: 3,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },
  {
    id: 'rifle-basics-plates',
    packId: 'rifle-basics',
    name: 'Plate Practice',
    description: 'Hit as many plates as you can! Each plate is worth points.',
    difficulty: 'medium',
    requiredWeaponType: 'rifle',
    distanceM: 100,
    targetMode: 'plates',
    targets: [
      { id: 'p1', centerY_M: 0, centerZ_M: -0.2, radiusM: 0.1, points: 5, label: 'A1' },
      { id: 'p2', centerY_M: 0, centerZ_M: 0, radiusM: 0.1, points: 5, label: 'A2' },
      { id: 'p3', centerY_M: 0, centerZ_M: 0.2, radiusM: 0.1, points: 5, label: 'A3' },
      { id: 'p4', centerY_M: 0.15, centerZ_M: -0.2, radiusM: 0.08, points: 8, label: 'B1' },
      { id: 'p5', centerY_M: 0.15, centerZ_M: 0.2, radiusM: 0.08, points: 8, label: 'B3' },
      { id: 'p6', centerY_M: 0.3, centerZ_M: 0, radiusM: 0.06, points: 10, label: 'C2' },
    ],
    windMps: 3,
    gustMps: 1,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.0,
    maxShots: 5,
    starThresholds: { one: 15, two: 25, three: 35 },
    unlocked: true,
  },
  {
    id: 'rifle-basics-timed',
    packId: 'rifle-basics',
    name: 'Speed Shooting',
    description: 'Hit the bullseye as quickly as possible! 10 second time limit.',
    difficulty: 'medium',
    requiredWeaponType: 'rifle',
    distanceM: 100,
    windMps: 2,
    gustMps: 0.5,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.0,
    maxShots: 3,
    timerSeconds: 10,
    starThresholds: { one: 15, two: 25, three: 30 },
    unlocked: true,
  },
  {
    id: 'rifle-basics-2',
    packId: 'rifle-basics',
    name: 'Wind Reading',
    description: 'Learn to read and compensate for light winds.',
    difficulty: 'easy',
    requiredWeaponType: 'rifle',
    distanceM: 50,
    windMps: 2,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.0,
    maxShots: 3,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },
  {
    id: 'rifle-basics-3',
    packId: 'rifle-basics',
    name: 'Mil Reticle',
    description: 'Use the mil reticle for precise aiming at longer range.',
    difficulty: 'easy',
    requiredWeaponType: 'rifle',
    distanceM: 75,
    windMps: 0,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.0,
    maxShots: 3,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },
  {
    id: 'rifle-basics-4',
    packId: 'rifle-basics',
    name: 'Turret Dialing',
    description: 'Adjust your turret to compensate for bullet drop.',
    difficulty: 'medium',
    requiredWeaponType: 'rifle',
    distanceM: 75,
    windMps: 3,
    gustMps: 0.5,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.0,
    maxShots: 3,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },
  {
    id: 'rifle-basics-5',
    packId: 'rifle-basics',
    name: 'Return to Zero',
    description: 'Learn to save and restore your turret settings.',
    difficulty: 'medium',
    requiredWeaponType: 'rifle',
    distanceM: 100,
    windMps: 4,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 1.0,
    maxShots: 3,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },
  {
    id: 'rifle-basics-6',
    packId: 'rifle-basics',
    name: 'Variable Conditions',
    description: 'Combine all skills with light gusts.',
    difficulty: 'medium',
    requiredWeaponType: 'rifle',
    distanceM: 100,
    windMps: 4,
    gustMps: 1,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 0.9,
    maxShots: 3,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },
  {
    id: 'rifle-basics-7',
    packId: 'rifle-basics',
    name: 'Wind Challenge',
    description: 'Moderate wind and gusts test your fundamentals.',
    difficulty: 'medium',
    requiredWeaponType: 'rifle',
    distanceM: 125,
    windMps: 5,
    gustMps: 2,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 0.9,
    maxShots: 3,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },
  {
    id: 'rifle-basics-8',
    packId: 'rifle-basics',
    name: 'Long Range',
    description: 'Extended distance requires precise turret adjustments.',
    difficulty: 'hard',
    requiredWeaponType: 'rifle',
    distanceM: 150,
    windMps: 6,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 0.8,
    maxShots: 3,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },
  {
    id: 'rifle-basics-9',
    packId: 'rifle-basics',
    name: 'Gusty Masters',
    description: 'Variable gusts challenge your wind reading.',
    difficulty: 'hard',
    requiredWeaponType: 'rifle',
    distanceM: 150,
    windMps: 7,
    gustMps: 3,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 0.8,
    maxShots: 3,
    starThresholds: { one: 10, two: 20, three: 30 },
    unlocked: true,
  },
  {
    id: 'rifle-basics-10',
    packId: 'rifle-basics',
    name: 'Rifle Mastery',
    description: 'Final test: combine all rifle skills at long range.',
    difficulty: 'hard',
    requiredWeaponType: 'rifle',
    distanceM: 200,
    windMps: 8,
    gustMps: 3,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetScale: 0.7,
    maxShots: 3,
    starThresholds: { one: 10, two: 20, three: 30 },
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
    env: { temperatureC: 10, altitudeM: 2000 }, // Mountain shooting
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
    env: { temperatureC: -15, altitudeM: 1500 }, // Cold, high altitude
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

  // ===== SHOTGUNS PACK =====
  {
    id: 'shotgun-intro',
    packId: 'shotguns-pack',
    name: 'Shotgun Intro',
    description: 'Learn the basics: stationary clay targets.',
    difficulty: 'easy',
    requiredWeaponType: 'shotgun',
    distanceM: 25,
    env: { temperatureC: 15, altitudeM: 0 },
    windMps: 0,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetMode: 'plates',
    targets: [
      { id: 'clay1', centerY_M: 0, centerZ_M: 0, radiusM: 0.25, points: 10, label: 'Clay 1' },
      { id: 'clay2', centerY_M: 0.15, centerZ_M: 0, radiusM: 0.25, points: 10, label: 'Clay 2' },
      { id: 'clay3', centerY_M: -0.15, centerZ_M: 0, radiusM: 0.25, points: 10, label: 'Clay 3' },
    ],
    maxShots: 5,
    starThresholds: { one: 15, two: 25, three: 30 },
    unlocked: true,
  },
  {
    id: 'shotgun-clays-1',
    packId: 'shotguns-pack',
    name: 'Drifting Clays',
    description: 'Clays move horizontally. Lead your shots!',
    difficulty: 'easy',
    requiredWeaponType: 'shotgun',
    distanceM: 25,
    env: { temperatureC: 15, altitudeM: 0 },
    windMps: 0,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetMode: 'plates',
    targets: [
      { 
        id: 'clay1', 
        centerY_M: 0, 
        centerZ_M: 0, 
        radiusM: 0.25, 
        points: 10, 
        label: 'Clay 1',
        moving: { speedMps: 3.0, axis: 'horizontal', amplitudeM: 0.15 },
      },
      { 
        id: 'clay2', 
        centerY_M: 0.15, 
        centerZ_M: 0, 
        radiusM: 0.25, 
        points: 10, 
        label: 'Clay 2',
        moving: { speedMps: 2.5, axis: 'horizontal', amplitudeM: 0.12 },
      },
    ],
    maxShots: 5,
    starThresholds: { one: 10, two: 18, three: 20 },
    unlocked: true,
  },
  {
    id: 'shotgun-clays-2',
    packId: 'shotguns-pack',
    name: 'Crossfire',
    description: 'Clays move in both directions. Stay focused.',
    difficulty: 'medium',
    requiredWeaponType: 'shotgun',
    distanceM: 30,
    env: { temperatureC: 15, altitudeM: 0 },
    windMps: 0,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetMode: 'plates',
    targets: [
      { 
        id: 'clay-left', 
        centerY_M: 0, 
        centerZ_M: 0, 
        radiusM: 0.23, 
        points: 10, 
        label: 'Left',
        moving: { speedMps: 3.5, axis: 'horizontal', amplitudeM: 0.18 },
      },
      { 
        id: 'clay-right', 
        centerY_M: 0.1, 
        centerZ_M: 0, 
        radiusM: 0.23, 
        points: 10, 
        label: 'Right',
        moving: { speedMps: 3.5, axis: 'horizontal', amplitudeM: -0.18 },
      },
      { 
        id: 'clay-center', 
        centerY_M: -0.1, 
        centerZ_M: 0, 
        radiusM: 0.25, 
        points: 10, 
        moving: { speedMps: 2.0, axis: 'horizontal', amplitudeM: 0.15 },
      },
    ],
    maxShots: 6,
    starThresholds: { one: 15, two: 25, three: 30 },
    unlocked: true,
  },
  {
    id: 'shotgun-plates-1',
    packId: 'shotguns-pack',
    name: 'Plate Rack',
    description: 'Vertical plates sway with wind.',
    difficulty: 'medium',
    requiredWeaponType: 'shotgun',
    distanceM: 25,
    env: { temperatureC: 15, altitudeM: 0 },
    windMps: 0,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetMode: 'plates',
    targets: [
      { 
        id: 'plate1', 
        centerY_M: 0.2, 
        centerZ_M: 0, 
        radiusM: 0.15, 
        points: 10, 
        label: 'A1',
        moving: { speedMps: 2.0, axis: 'vertical', amplitudeM: 0.08 },
      },
      { 
        id: 'plate2', 
        centerY_M: 0.1, 
        centerZ_M: 0, 
        radiusM: 0.15, 
        points: 10, 
        label: 'A2',
        moving: { speedMps: 2.5, axis: 'vertical', amplitudeM: 0.1 },
      },
      { 
        id: 'plate3', 
        centerY_M: 0, 
        centerZ_M: 0, 
        radiusM: 0.15, 
        points: 10, 
        label: 'A3',
        moving: { speedMps: 2.0, axis: 'vertical', amplitudeM: -0.08 },
      },
      { 
        id: 'plate4', 
        centerY_M: -0.1, 
        centerZ_M: 0, 
        radiusM: 0.15, 
        points: 10, 
        label: 'A4',
        moving: { speedMps: 2.5, axis: 'vertical', amplitudeM: -0.1 },
      },
      { 
        id: 'plate5', 
        centerY_M: -0.2, 
        centerZ_M: 0, 
        radiusM: 0.15, 
        points: 10, 
        moving: { speedMps: 2.0, axis: 'vertical', amplitudeM: 0.08 },
      },
    ],
    maxShots: 8,
    starThresholds: { one: 25, two: 40, three: 50 },
    unlocked: true,
  },
  {
    id: 'shotgun-plates-2',
    packId: 'shotguns-pack',
    name: 'Speed Plates',
    description: 'Faster moving plates. Time your shots.',
    difficulty: 'medium',
    requiredWeaponType: 'shotgun',
    distanceM: 30,
    env: { temperatureC: 15, altitudeM: 0 },
    windMps: 0,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetMode: 'plates',
    targets: [
      { 
        id: 'plate1', 
        centerY_M: 0.15, 
        centerZ_M: 0, 
        radiusM: 0.18, 
        points: 15, 
        moving: { speedMps: 4.0, axis: 'horizontal', amplitudeM: 0.12 },
      },
      { 
        id: 'plate2', 
        centerY_M: -0.15, 
        centerZ_M: 0, 
        radiusM: 0.18, 
        points: 15, 
        moving: { speedMps: 4.5, axis: 'horizontal', amplitudeM: -0.15 },
      },
    ],
    maxShots: 6,
    starThresholds: { one: 15, two: 25, three: 30 },
    unlocked: true,
  },
  {
    id: 'shotgun-plates-3',
    packId: 'shotguns-pack',
    name: 'Matrix Plates',
    description: 'Plates in complex patterns. Predict movement.',
    difficulty: 'hard',
    requiredWeaponType: 'shotgun',
    distanceM: 35,
    env: { temperatureC: 15, altitudeM: 0 },
    windMps: 0,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetMode: 'plates',
    targets: [
      { 
        id: 'plate-tl', 
        centerY_M: 0.2, 
        centerZ_M: 0, 
        radiusM: 0.15, 
        points: 20, 
        label: 'TL',
        moving: { speedMps: 3.0, axis: 'horizontal', amplitudeM: 0.1 },
      },
      { 
        id: 'plate-tr', 
        centerY_M: 0.2, 
        centerZ_M: 0, 
        radiusM: 0.15, 
        points: 20, 
        label: 'TR',
        moving: { speedMps: 3.0, axis: 'horizontal', amplitudeM: -0.1 },
      },
      { 
        id: 'plate-bl', 
        centerY_M: -0.2, 
        centerZ_M: 0, 
        radiusM: 0.15, 
        points: 20, 
        label: 'BL',
        moving: { speedMps: 3.5, axis: 'horizontal', amplitudeM: 0.12 },
      },
      { 
        id: 'plate-br', 
        centerY_M: -0.2, 
        centerZ_M: 0, 
        radiusM: 0.15, 
        points: 20, 
        label: 'BR',
        moving: { speedMps: 3.5, axis: 'horizontal', amplitudeM: -0.12 },
      },
    ],
    maxShots: 7,
    starThresholds: { one: 30, two: 50, three: 70 },
    unlocked: true,
  },
  {
    id: 'shotgun-speed-1',
    packId: 'shotguns-pack',
    name: 'Speed Run',
    description: 'Timed clay challenge. Hit them all fast!',
    difficulty: 'medium',
    requiredWeaponType: 'shotgun',
    distanceM: 25,
    env: { temperatureC: 15, altitudeM: 0 },
    windMps: 0,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetMode: 'plates',
    targets: [
      { 
        id: 'clay1', 
        centerY_M: 0, 
        centerZ_M: 0, 
        radiusM: 0.2, 
        points: 10, 
        moving: { speedMps: 2.5, axis: 'horizontal', amplitudeM: 0.1 },
      },
      { 
        id: 'clay2', 
        centerY_M: 0.12, 
        centerZ_M: 0, 
        radiusM: 0.2, 
        points: 10, 
        moving: { speedMps: 3.0, axis: 'horizontal', amplitudeM: -0.12 },
      },
      { 
        id: 'clay3', 
        centerY_M: -0.12, 
        centerZ_M: 0, 
        radiusM: 0.2, 
        points: 10, 
        moving: { speedMps: 2.8, axis: 'horizontal', amplitudeM: 0.11 },
      },
    ],
    maxShots: 5,
    timerSeconds: 15,  // 15-second time limit
    starThresholds: { one: 15, two: 25, three: 30 },
    unlocked: true,
  },
  {
    id: 'shotgun-speed-2',
    packId: 'shotguns-pack',
    name: 'Blitz Clay',
    description: 'Very fast clays. High intensity!',
    difficulty: 'hard',
    requiredWeaponType: 'shotgun',
    distanceM: 25,
    env: { temperatureC: 15, altitudeM: 0 },
    windMps: 0,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetMode: 'plates',
    targets: [
      { 
        id: 'clay1', 
        centerY_M: 0, 
        centerZ_M: 0, 
        radiusM: 0.18, 
        points: 15, 
        moving: { speedMps: 4.5, axis: 'horizontal', amplitudeM: 0.15 },
      },
      { 
        id: 'clay2', 
        centerY_M: 0.15, 
        centerZ_M: 0, 
        radiusM: 0.18, 
        points: 15, 
        moving: { speedMps: 5.0, axis: 'horizontal', amplitudeM: -0.18 },
      },
    ],
    maxShots: 4,
    timerSeconds: 10,  // 10-second time limit
    starThresholds: { one: 15, two: 25, three: 30 },
    unlocked: true,
  },
  {
    id: 'shotgun-master',
    packId: 'shotguns-pack',
    name: 'Shotgun Master',
    description: 'Ultimate test: fast clays with limited shots.',
    difficulty: 'expert',
    requiredWeaponType: 'shotgun',
    distanceM: 30,
    env: { temperatureC: 15, altitudeM: 0 },
    windMps: 0,
    gustMps: 0,
    airDensityKgM3: 1.225,
    gravityMps2: 9.80665,
    targetMode: 'plates',
    targets: [
      { 
        id: 'clay1', 
        centerY_M: 0.2, 
        centerZ_M: 0, 
        radiusM: 0.15, 
        points: 20, 
        label: 'A1',
        moving: { speedMps: 4.0, axis: 'horizontal', amplitudeM: 0.12 },
      },
      { 
        id: 'clay2', 
        centerY_M: 0.12, 
        centerZ_M: 0, 
        radiusM: 0.15, 
        points: 20, 
        label: 'A2',
        moving: { speedMps: 4.5, axis: 'horizontal', amplitudeM: -0.15 },
      },
      { 
        id: 'clay3', 
        centerY_M: 0, 
        centerZ_M: 0, 
        radiusM: 0.15, 
        points: 20, 
        label: 'A3',
        moving: { speedMps: 4.2, axis: 'horizontal', amplitudeM: 0.13 },
      },
      { 
        id: 'clay4', 
        centerY_M: -0.12, 
        centerZ_M: 0, 
        radiusM: 0.15, 
        points: 20, 
        label: 'A4',
        moving: { speedMps: 4.8, axis: 'horizontal', amplitudeM: -0.14 },
      },
    ],
    maxShots: 5,
    timerSeconds: 12,
    starThresholds: { one: 30, two: 50, three: 70 },
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

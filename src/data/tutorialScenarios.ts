// Tutorial scenario generator - creates deterministic game state for lessons
import type { Level } from './levels';
import { AMMO_CATALOG } from './ammo';
import { WEAPONS_CATALOG } from './weapons';

export interface TutorialScenario {
  level: Level;
  weaponId: string;
  ammoId: string;
  seed: number; // Deterministic seed for consistent gameplay
  description: string;
  expectedOutcome: string; // What the lesson teaches
}

/**
 * Generate a deterministic tutorial scenario
 * All parameters are fixed to ensure consistent behavior
 */
export function generateTutorialScenario(tutorialId: string): TutorialScenario {
  const scenarios: Record<string, TutorialScenario> = {
    // Lesson 1: HUD Basics
    'lesson-hud-basics': {
      level: {
        id: 'tutorial-hud-basics',
        packId: 'tutorial',
        name: 'HUD Basics Tutorial',
        description: 'Learn to read the HUD: distance, wind, turret dials',
        distanceM: 400,
        difficulty: 'easy',
        windMps: 3, // 3 m/s from right
        windProfile: undefined,
        windDirectionDeg: 90,
        gustMps: 0,
        env: { temperatureC: 20, altitudeM: 500 },
        airDensityKgM3: 1.225,
        gravityMps2: 9.81,
        targetMode: 'bullseye',
        maxShots: 999, // Unlimited for tutorial
        starThresholds: { one: 10, two: 20, three: 30 },
        requiredWeaponType: 'sniper',
        targetScale: 1.0,
        unlocked: true,
      },
      weaponId: 'remington-700',
      ammoId: '175gr-hpbt',
      seed: 12345,
      description: 'Learn to read the HUD: distance, wind, turret dials',
      expectedOutcome: 'Understand what each HUD element shows',
    },

    // Lesson 2: MILs Explained
    'lesson-mils-explained': {
      level: {
        id: 'tutorial-mils-explained',
        packId: 'tutorial',
        name: 'MILs Explained Tutorial',
        description: 'Learn MIL subtension and how much 1 mil equals',
        distanceM: 600,
        difficulty: 'easy',
        windMps: 0,
        windProfile: undefined,
        windDirectionDeg: 90,
        gustMps: 0,
        env: { temperatureC: 15, altitudeM: 1000 },
        airDensityKgM3: 1.225,
        gravityMps2: 9.81,
        targetMode: 'bullseye',
        maxShots: 999, // Unlimited for tutorial
        starThresholds: { one: 10, two: 20, three: 30 },
        requiredWeaponType: 'sniper',
        targetScale: 1.0,
        unlocked: true,
      },
      weaponId: 'remington-700',
      ammoId: '175gr-hpbt',
      seed: 23456,
      description: 'Learn MIL subtension and how much 1 mil equals',
      expectedOutcome: 'Calculate that 1 mil = 60cm at 600m',
    },

    // Lesson 3: Turret Clicks
    'lesson-turret-clicks': {
      level: {
        id: 'tutorial-turret-clicks',
        packId: 'tutorial',
        name: 'Turret Clicks Tutorial',
        description: 'Learn turret adjustments: 0.1 mil per click',
        distanceM: 500,
        difficulty: 'easy',
        windMps: 0,
        windProfile: undefined,
        windDirectionDeg: 90,
        gustMps: 0,
        env: { temperatureC: 18, altitudeM: 750 },
        airDensityKgM3: 1.225,
        gravityMps2: 9.81,
        targetMode: 'bullseye',
        maxShots: 999, // Unlimited for tutorial
        starThresholds: { one: 10, two: 20, three: 30 },
        requiredWeaponType: 'sniper',
        targetScale: 1.0,
        unlocked: true,
      },
      weaponId: 'remington-700',
      ammoId: '175gr-hpbt',
      seed: 34567,
      description: 'Learn turret adjustments: 0.1 mil per click',
      expectedOutcome: 'Dial correction using turret clicks',
    },

    // Lesson 4: Wind Hold/Dial
    'lesson-wind-hold-dial': {
      level: {
        id: 'tutorial-wind-hold-dial',
        packId: 'tutorial',
        name: 'Wind Hold/Dial Tutorial',
        description: 'Apply wind correction using hold or dial',
        distanceM: 700,
        difficulty: 'medium',
        windMps: 5, // 5 m/s from right
        windProfile: undefined,
        windDirectionDeg: 90,
        gustMps: 0,
        env: { temperatureC: 22, altitudeM: 800 },
        airDensityKgM3: 1.225,
        gravityMps2: 9.81,
        targetMode: 'bullseye',
        maxShots: 999, // Unlimited for tutorial
        starThresholds: { one: 10, two: 20, three: 30 },
        requiredWeaponType: 'sniper',
        targetScale: 1.0,
        unlocked: true,
      },
      weaponId: 'remington-700',
      ammoId: '175gr-hpbt',
      seed: 45678,
      description: 'Apply wind correction using hold or dial',
      expectedOutcome: 'Hit target by accounting for wind',
    },

    // Lesson 5: Zeroing
    'lesson-zeroing': {
      level: {
        id: 'tutorial-zeroing',
        packId: 'tutorial',
        name: 'Zeroing Tutorial',
        description: 'Zero your rifle and return to zero',
        distanceM: 300, // Standard zeroing distance for many rifles
        difficulty: 'easy',
        windMps: 0,
        windProfile: undefined,
        windDirectionDeg: 90,
        gustMps: 0,
        env: { temperatureC: 20, altitudeM: 500 },
        airDensityKgM3: 1.225,
        gravityMps2: 9.81,
        targetMode: 'bullseye',
        maxShots: 999, // Unlimited for tutorial
        starThresholds: { one: 10, two: 20, three: 30 },
        requiredWeaponType: 'sniper',
        targetScale: 1.0,
        unlocked: true,
      },
      weaponId: 'remington-700',
      ammoId: '175gr-hpbt',
      seed: 56789,
      description: 'Zero your rifle and return to zero',
      expectedOutcome: 'Save zero profile, try changes, return to zero',
    },
  };

  const scenario = scenarios[tutorialId];
  if (!scenario) {
    throw new Error(`Unknown tutorial ID: ${tutorialId}`);
  }

  return scenario;
}

/**
 * Get the level object for a tutorial scenario
 */
export function getTutorialLevel(tutorialId: string): Level {
  const scenario = generateTutorialScenario(tutorialId);
  return scenario.level;
}

/**
 * Get the weapon for a tutorial scenario
 */
export function getTutorialWeapon(tutorialId: string) {
  const scenario = generateTutorialScenario(tutorialId);
  return WEAPONS_CATALOG.find((w) => w.id === scenario.weaponId);
}

/**
 * Get the ammo for a tutorial scenario
 */
export function getTutorialAmmo(tutorialId: string) {
  const scenario = generateTutorialScenario(tutorialId);
  return AMMO_CATALOG.find((a) => a.id === scenario.ammoId);
}

/**
 * Get seed for deterministic gameplay
 */
export function getTutorialSeed(tutorialId: string): number {
  const scenario = generateTutorialScenario(tutorialId);
  return scenario.seed;
}

/**
 * Check if a level ID is a tutorial level
 */
export function isTutorialLevel(levelId: string): boolean {
  return levelId.startsWith('tutorial-');
}

export const TUTORIAL_IDS = [
  'lesson-hud-basics',
  'lesson-mils-explained',
  'lesson-turret-clicks',
  'lesson-wind-hold-dial',
  'lesson-zeroing',
] as const;

export type TutorialId = (typeof TUTORIAL_IDS)[number];
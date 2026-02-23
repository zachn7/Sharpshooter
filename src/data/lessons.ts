/**
 * Tutorial lesson definitions and types.
 * Lessons teach game mechanics in a structured, interactive way.
 */

export type LessonStep = {
  id: string;
  title: string;
  body: string;
  highlightTestId?: string; // data-testid of element to highlight
  action?: 'click' | 'close' | 'next'; // Expected user action to proceed
};

export type Lesson = {
  id: string;
  title: string;
  description: string;
  category: string;
  steps: LessonStep[];
  prerequisite?: string; // Optional: lesson that must be completed first
}

export const LESSON_CATEGORIES = [
  'Getting Started',
  'Controls & Aiming',
  'Ballistics',
  'Advanced Tactics',
] as const;

export const LESSONS: Lesson[] = [
  {
    id: 'welcome',
    title: 'Welcome to Sharpshooter',
    description: 'Learn the basics of long-range shooting simulation',
    category: 'Getting Started',
    steps: [
      {
        id: 'welcome-1',
        title: 'Welcome!',
        body: 'Sharpshooter is a ballistics simulation game where you learn to account for wind, distance, and environment to hit targets accurately.',
        action: 'next',
      },
      {
        id: 'welcome-2',
        title: 'Your Goal',
        body: 'Each mission has targets at specific distances. You must compensate for bullet drop and wind to hit the bullseye. Complete levels to earn stars and unlock more challenges.',
        action: 'next',
      },
      {
        id: 'welcome-3',
        title: 'Getting Help',
        body: 'Look for (i) or ? icons throughout the app to learn about game mechanics. The Glossary explains all terms like Range, Wind, MILs, and more.',
        action: 'close',
      },
    ],
  },
  {
    id: 'basics-aiming',
    title: 'Basic Aiming',
    description: 'Learn how to aim at targets and fire shots',
    category: 'Controls & Aiming',
    prerequisite: 'welcome',
    steps: [
      {
        id: 'aiming-1',
        title: 'The Reticle',
        body: 'The crosshair in the center is your reticle. Place it on the target center. At close ranges, simply pointing at the target works. At longer ranges, you need to compensate for drop and wind.',
        action: 'next',
      },
      {
        id: 'aiming-2',
        title: 'Firing',
        body: 'Click the canvas to fire a shot. Your projectile travels to the target and is affected by ballistics. Watch the impact marker to see where your shot landed.',
        action: 'next',
      },
      {
        id: 'aiming-3',
        title: 'Reading the Result',
        body: 'After firing, see your score and where you hit. The impact marker shows your shot position (in MILs from center). Adjust your aim based on where shots land.',
        action: 'close',
      },
    ],
  },
  {
    id: 'turret-adjustments',
    title: 'Turret Adjustments',
    description: 'Use turret clicks to compensate for drop and wind',
    category: 'Controls & Aiming',
    prerequisite: 'basics-aiming',
    steps: [
      {
        id: 'turret-1',
        title: 'What Are Turrets?',
        body: 'Turrets are the dials on your scope. They adjust your point of impact. Elevation turret (up/down) compensates for bullet drop. Windage turret (left/right) compensates for wind.',
        action: 'next',
      },
      {
        id: 'turret-2',
        title: 'Making Adjustments',
        body: 'Click the turret buttons in game to make adjustments. Each click moves your impact point by a specific amount (usually 0.25 MILs). Fire a shot, see where it lands, then adjust.',
        action: 'next',
      },
      {
        id: 'turret-3',
        title: 'Saving Your Zero',
        body: 'Once dialed in for a specific distance, save your zero profile. This stores your turret adjustments so you can return to the same settings later. Use different zeros for different weapons.',
        action: 'close',
      },
    ],
  },
  {
    id: 'wind-reading',
    title: 'Reading Wind',
    description: 'Understand how wind affects your shots',
    category: 'Ballistics',
    prerequisite: 'turret-adjustments',
    steps: [
      {
        id: 'wind-1',
        title: 'Wind Effects',
        body: 'Wind is the crosswind speed in m/s. Positive values push right, negative values push left. Higher wind speeds push your shot more. Gusts create variation in wind speed.',
        action: 'next',
      },
      {
        id: 'wind-2',
        title: 'Reading the Flag',
        body: 'Wind flags show current wind speed and direction. Flags flutter faster at higher wind. The wind arrow shows wind direction (pointing TO where wind blows FROM).',
        action: 'next',
      },
      {
        id: 'wind-3',
        title: 'Adapting to Wind',
        body: 'Account for wind by adjusting your windage turret. If wind blows right, hold left or adjust windage left. Practice reading wind indicators to improve accuracy.',
        action: 'close',
      },
    ],
  },
  {
    id: 'ballistics-basics',
    title: 'Ballistics Basics',
    description: 'Understand how projectile physics work',
    category: 'Ballistics',
    prerequisite: 'wind-reading',
    steps: [
      {
        id: 'ballistics-1',
        title: 'Bullet Drop',
        body: 'Projectiles slow down and fall over distance due to drag (air resistance). At longer ranges, you must aim higher to compensate. The range card shows how much drop to expect.',
        action: 'next',
      },
      {
        id: 'ballistics-2',
        title: 'Distance Matters',
        body: 'Longer distance = more time in air = more drop and wind drift. A 100m shot has minimal effects, but a 500m shot requires significant compensation. Always check your target distance.',
        action: 'next',
      },
      {
        id: 'ballistics-3',
        title: 'Using the Range Card',
        body: 'The range card (toggle in HUD) shows ballistic data for your current distance: drop in MILs, wind drift, and more. Use this to plan your turret adjustments before firing.',
        action: 'close',
      },
    ],
  },
];

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

export function getLessonsByCategory(category: string): Lesson[] {
  return LESSONS.filter((lesson) => lesson.category === category);
}

export function getFirstUncompletedLesson(completedIds: string[]): Lesson | undefined {
  for (const lesson of LESSONS) {
    if (completedIds.includes(lesson.id)) continue;
    if (lesson.prerequisite && !completedIds.includes(lesson.prerequisite)) continue;
    return lesson;
  }
  return undefined;
}

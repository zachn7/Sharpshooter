import type { TutorialId } from './tutorialScenarios';

export interface LessonStep {
  title: string;
  content: string;
  highlightTestIds?: string[]; // Elements to highlight in the UI
  action?: string; // What user should do at this step
  successCondition?: string; // What to check for proceeding to next step
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: string;
  prerequisite?: string; // ID of lesson that must be completed first
  tutorialId?: TutorialId; // Links to game tutorial scenario
  steps: LessonStep[];
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
        title: 'Welcome',
        content:
          'Sharpshooter is a ballistics simulation game where you take long-range shots at targets. Your goal is to adjust your aim and turret dials to hit the target center.',
      },
      {
        title: 'How It Works',
        content:
          "You'll read wind, calculate bullet drop, and adjust your scope's turret dials. Each shot shows you where it landed and how far from center it was.",
      },
      {
        title: 'Ready to Learn',
        content:
          'Start with "HUD Basics" to learn about the heads-up display, then progress through the lessons. Each lesson includes interactive practice!',
      },
    ],
  },

  {
    id: 'hud-basics',
    title: 'HUD Basics',
    description: 'Learn to read distance, wind, and turret dials',
    category: 'Getting Started',
    prerequisite: 'welcome',
    tutorialId: 'lesson-hud-basics',
    steps: [
      {
        title: 'The Distance Display',
        content:
          'The distance display (at the top of the screen) shows how far away the target is, measured in meters. In this lesson, the target is at 400 meters.',
      },
      {
        title: 'The Wind Indicator',
        content:
          'Wind pushes your bullet sideways. The HUD shows wind speed in m/s (meters per second). An arrow shows direction (→ or ←). Try starting a game to see it in action.',
        action: 'Start interactive practice',
      },
      {
        title: 'Turret Dials',
        content:
          'Your scope has two turret dials: Elevation (up/down) and Windage (left/right). Each click adjusts the scope by 0.1 mils. Fire one shot to see how your bullet drops!',
        action: 'Fire a shot to continue',
      },
      {
        title: 'Impact Offset',
        content:
          'After each shot, you will see an offset panel showing how far your shot was from center in mils. Positive values mean "aim needed more", negative means "aimed too far".',
      },
    ],
  },

  {
    id: 'mils-explained',
    title: 'Understanding MILs',
    description: 'Learn what a MIL is and how to use it',
    category: 'Controls & Aiming',
    prerequisite: 'hud-basics',
    tutorialId: 'lesson-mils-explained',
    steps: [
      {
        title: 'What is a MIL?',
        content:
          'A MIL (milliradian) is an angular measurement in your scope. At any distance, 1 mil always equals 1/1000 of that distance.',
      },
      {
        title: 'Calculating MIL to Distance',
        content:
          'At 600 meters, 1 mil equals 60 cm (600 × 0.001 = 0.6 meters). At 1000 meters, 1 mil equals 100 cm (1000 × 0.001 = 1 meter).',
      },
      {
        title: 'Practical Example',
        content:
          'If your shot lands 2 mils low at 600 meters, that is 120 cm (2 × 60 cm) below center. You need to adjust your elevation up 2 mils.',
      },
      {
        title: 'Practice',
        content:
          'Start the game and practice reading the offset in mils. Calculate what correction you would need, then apply it using the turret dials.',
        action: 'Complete practice to continue',
      },
    ],
  },

  {
    id: 'turret-clicks',
    title: 'Turret Clicks',
    description: 'Learn dialing corrections in 0.1 mil increments',
    category: 'Controls & Aiming',
    prerequisite: 'mils-explained',
    tutorialId: 'lesson-turret-clicks',
    steps: [
      {
        title: 'Scope Turret Dials',
        content:
          'Your scope has two dials: Elevation (up/down) and Windage (left/right). The values show your current adjustment in mils.',
      },
      {
        title: '0.1 MIL Per Click',
        content:
          'Each click adjusts the scope by 0.1 mils. At 500 meters, 0.1 mils = 5 cm. So 10 clicks = 1 mil = 50 cm at 500 meters.',
      },
      {
        title: 'Dialing Corrections',
        content:
          'When your shot shows an offset of +1.5 mils, dial your turret 15 clicks in the same direction. This moves your point of aim 1.5 mils toward the correction. The Coach card will show you exactly how many clicks to adjust!',
      },
      {
        title: 'Practice',
        content:
          'Fire a shot, check the Coach card for the recommended dial adjustment, and use the Apply button to auto-correct. Then fire again to see improvement!',
        action: 'Hit the target center to continue',
      },
    ],
  },

  {
    id: 'wind-hold-dial',
    title: 'Wind Hold & Dial',
    description: 'Apply wind corrections using hold-off or dialing',
    category: 'Ballistics',
    prerequisite: 'turret-clicks',
    tutorialId: 'lesson-wind-hold-dial',
    steps: [
      {
        title: 'Wind Effects',
        content:
          'Wind pushes your bullet sideways as it flies to the target. Stronger wind = more deflection. Longer distance = more time for wind to push.',
      },
      {
        title: 'Wind Direction',
        content:
          'Wind is always shown relative to your line of sight. "+5 m/s" means wind pushes from your left to right (tougher!). "-3 m/s" pushes from right to left.',
      },
      {
        title: 'Two Ways to Correct Wind',
        content:
          '1) Dialing: Adjust your windage turret. 2) Hold-off: Aim your crosshair slightly into the wind. The Coach card shows you BOTH the dial adjustment AND the hold correction in mils!',
      },
      {
        title: 'Practice',
        content:
          'In this lesson, you have a 5 m/s wind. Fire a shot, check the Coach card for recommendations, dial the correction or use hold, and hit the target!',
        action: 'Hit the target center to continue',
      },
    ],
  },

  {
    id: 'zeroing',
    title: 'Zeroing Your Rifle',
    description: 'Save and restore your turret settings',
    category: 'Ballistics',
    prerequisite: 'wind-hold-dial',
    tutorialId: 'lesson-zeroing',
    steps: [
      {
        title: 'What is Zeroing?',
        content:
          '"Zeroing" means adjusting your scope so that when your crosshair is on the target center, your bullet hits the center at that specific distance.',
      },
      {
        title: 'Save Zero Profile',
        content:
          'Once you have dialed in your turret for a specific distance/condition, use "Save Zero" to store those settings. You can save multiple zero profiles.',
      },
      {
        title: 'Return to Zero',
        content:
          'Use "Return to Zero" to quickly restore your saved turret settings. This is useful when playing different levels or starting a new session.',
      },
      {
        title: 'Practice',
        content:
          'In this lesson: 1) Dial your turret to hit the target center 2) Save the zero profile 3) Change your turret dials 4) Return to zero 5) Verify your saved settings are restored!',
        action: 'Complete zeroing practice to continue',
      },
    ],
  },
];

/**
 * Get lessons by category
 */
export function getLessonsByCategory(category: string): Lesson[] {
  return LESSONS.filter((lesson) => lesson.category === category);
}

/**
 * Get lesson by ID
 */
export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}
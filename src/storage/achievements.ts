import { type AchievementDefinition, type AchievementType } from './localStore';
import { LEVEL_PACKS } from '../data/levels';

/**
 * Achievement Definitions
 * 
 * Requirements are checked after each level completion and periodically during gameplay.
 * Each achievement has a checkUnlocked function that evaluates current stats.
 */
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // ===== PROGRESS ACHIEVEMENTS =====
  {
    id: 'first-blood',
    title: 'First Blood',
    description: 'Complete your first level (any level)',
    type: 'progress',
    icon: '🎯',
    target: 1,
    checkUnlocked: (stats) => {
      return {
        unlocked: stats.levelsCompleted >= 1,
        progress: stats.levelsCompleted,
      };
    },
  },
  {
    id: 'novice',
    title: 'Novice Shooter',
    description: 'Complete 5 levels',
    type: 'progress',
    icon: '🔫',
    target: 5,
    checkUnlocked: (stats) => {
      return {
        unlocked: stats.levelsCompleted >= 5,
        progress: stats.levelsCompleted,
      };
    },
  },
  {
    id: 'marksman',
    title: 'Certified Marksman',
    description: 'Complete 20 levels',
    type: 'progress',
    icon: '🎖️',
    target: 20,
    checkUnlocked: (stats) => {
      return {
        unlocked: stats.levelsCompleted >= 20,
        progress: stats.levelsCompleted,
      };
    },
  },
  {
    id: 'veteran',
    title: 'Battle Veteran',
    description: 'Complete 50 levels',
    type: 'progress',
    icon: '⭐',
    target: 50,
    checkUnlocked: (stats) => {
      return {
        unlocked: stats.levelsCompleted >= 50,
        progress: stats.levelsCompleted,
      };
    },
  },
  {
    id: 'pack-master',
    title: 'Pack Master',
    description: 'Complete all levels in any pack',
    type: 'progress',
    icon: '📦',
    target: Math.max(...LEVEL_PACKS.map(p => p.levels.length)),
    checkUnlocked: (_stats, levelProgress) => {
      let maxCompletedInPack = 0;
      LEVEL_PACKS.forEach(pack => {
        const completedInPack = pack.levels.filter(
          levelId => levelProgress[levelId]?.stars && levelProgress[levelId].stars > 0
        ).length;
        maxCompletedInPack = Math.max(maxCompletedInPack, completedInPack);
      });
      return {
        unlocked: maxCompletedInPack >= Math.max(...LEVEL_PACKS.map(p => p.levels.length)),
        progress: maxCompletedInPack,
      };
    },
  },
  {
    id: 'streak-3',
    title: 'On Fire',
    description: 'Play 3 days in a row',
    type: 'progress',
    icon: '🔥',
    target: 3,
    checkUnlocked: (stats) => {
      return {
        unlocked: stats.longestStreak >= 3,
        progress: stats.longestStreak,
      };
    },
  },
  {
    id: 'streak-7',
    title: 'Dedicated',
    description: 'Play 7 days in a row',
    type: 'progress',
    icon: '📅',
    target: 7,
    checkUnlocked: (stats) => {
      return {
        unlocked: stats.longestStreak >= 7,
        progress: stats.longestStreak,
      };
    },
  },
  // ===== SKILL ACHIEVEMENTS =====
  {
    id: 'sharpshooter',
    title: 'Sharpshooter',
    description: 'Hit a bullseye (ring 10+)',
    type: 'skill',
    icon: '🎯',
    target: 1,
    checkUnlocked: (stats) => {
      return {
        unlocked: stats.totalBullseyes >= 1,
        progress: stats.totalBullseyes,
      };
    },
  },
  {
    id: 'perfect-center',
    title: 'Perfect Center',
    description: 'Hit the exact center (ring 10)',
    type: 'skill',
    icon: '🎪',
    target: 1,
    checkUnlocked: (stats) => {
      return {
        unlocked: stats.totalCenters >= 1,
        progress: stats.totalCenters,
      };
    },
  },
  {
    id: 'hundred-bullseyes',
    title: 'Hundred Bullseyes',
    description: 'Hit 100 bullseyes total',
    type: 'skill',
    icon: '💯',
    target: 100,
    checkUnlocked: (stats) => {
      return {
        unlocked: stats.totalBullseyes >= 100,
        progress: stats.totalBullseyes,
      };
    },
  },
  {
    id: 'three-star-hero',
    title: 'Three Star Hero',
    description: 'Earn 3 stars on any level',
    type: 'skill',
    icon: '⭐',
    target: 3,
    checkUnlocked: (_stats, levelProgress) => {
      const hasThreeStar = Object.values(levelProgress).some(
        progress => progress.stars === 3
      );
      return {
        unlocked: hasThreeStar,
        progress: hasThreeStar ? 3 : 0,
      };
    },
  },
  {
    id: 'tight-group',
    title: 'Tight Group',
    description: 'Achieve a 0.5 MIL 3-shot group',
    type: 'skill',
    icon: '🎯',
    target: 1,
    checkUnlocked: (stats) => {
      // Default is 999 MIL (unrealistic), so check if it's been set to something smaller
      return {
        unlocked: stats.bestGroupSizeMils < 50,
        progress: stats.bestGroupSizeMils < 50 ? 1 : 0,
      };
    },
  },
  {
    id: 'consistent',
    title: 'Consistent',
    description: 'Fire 1000 shots',
    type: 'skill',
    icon: '🔫',
    target: 1000,
    checkUnlocked: (stats) => {
      return {
        unlocked: stats.totalShotsFired >= 1000,
        progress: stats.totalShotsFired,
      };
    },
  },
  // ===== EXPLORATION ACHIEVEMENTS =====
  {
    id: 'elr-pioneer',
    title: 'ELR Pioneer',
    description: 'Reach 1500m distance',
    type: 'exploration',
    icon: '🏔️',
    target: 1,
    checkUnlocked: (_stats, levelProgress) => {
      // Check if elr-master or elr-extreme level was completed
      const has1500mLevel = ['elr-master', 'elr-extreme'].some(
        levelId => levelProgress[levelId]?.stars && levelProgress[levelId].stars > 0
      );
      return {
        unlocked: has1500mLevel,
        progress: has1500mLevel ? 1 : 0,
      };
    },
  },
  {
    id: 'wind-whisperer',
    title: 'Wind Whisperer',
    description: 'Complete ELR Introduction level',
    type: 'exploration',
    icon: '💨',
    target: 1,
    checkUnlocked: (_stats, levelProgress) => {
      return {
        unlocked: !!levelProgress['elr-intro']?.stars && levelProgress['elr-intro'].stars > 0,
        progress: levelProgress['elr-intro']?.stars ? 1 : 0,
      };
    },
  },
  {
    id: 'daily-hero',
    title: 'Daily Hero',
    description: 'Complete a daily challenge',
    type: 'exploration',
    icon: '📅',
    target: 1,
    checkUnlocked: (stats) => {
      return {
        unlocked: stats.dailyChallengesCompleted >= 1,
        progress: stats.dailyChallengesCompleted,
      };
    },
  },
];

/**
 * Get achievement definition by ID
 */
export function getAchievementDefinition(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find(a => a.id === id);
}

/**
 * Get all achievements of a specific type
 */
export function getAchievementsByType(type: AchievementType): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter(a => a.type === type);
}

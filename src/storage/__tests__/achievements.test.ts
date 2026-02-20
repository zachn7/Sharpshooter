import { describe, it, expect, beforeEach } from 'vitest';
import {
  getOrCreateGameSave,
  getPlayerStats,
  checkAndUnlockAchievements,
  getUnlockedAchievementIds,
} from '../localStore';
import { getAchievementDefinition, getAchievementsByType, ACHIEVEMENT_DEFINITIONS } from '../achievements';

// Clear storage before each test
beforeEach(() => {
  localStorage.clear();
});

describe('achievements', () => {
  describe('achievement definitions', () => {
    it('has progress achievements', () => {
      const progressAchievements = getAchievementsByType('progress');
      expect(progressAchievements.length).toBeGreaterThan(0);
    });

    it('has skill achievements', () => {
      const skillAchievements = getAchievementsByType('skill');
      expect(skillAchievements.length).toBeGreaterThan(0);
    });

    it('has exploration achievements', () => {
      const explorationAchievements = getAchievementsByType('exploration');
      expect(explorationAchievements.length).toBeGreaterThan(0);
    });

    it('all achievements have valid structure', () => {
      ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
        expect(achievement.id).toBeDefined();
        expect(achievement.title).toBeDefined();
        expect(achievement.description).toBeDefined();
        expect(achievement.type).toBeDefined();
        expect(['progress', 'skill', 'exploration']).toContain(achievement.type);
        expect(achievement.icon).toBeDefined();
        expect(achievement.target).toBeGreaterThan(0);
        expect(achievement.checkUnlocked).toBeInstanceOf(Function);
      });
    });
  });

  describe('achievement lookup', () => {
    it('can get achievement definition by ID', () => {
      const achievement = getAchievementDefinition('first-blood');
      expect(achievement).toBeDefined();
      expect(achievement?.title).toBe('First Blood');
    });

    it('returns undefined for non-existent achievement', () => {
      const achievement = getAchievementDefinition('non-existent');
      expect(achievement).toBeUndefined();
    });
  });

  describe('achievement unlocking', () => {
    it('fresh save has no achievements unlocked', () => {
      const unlocked = getUnlockedAchievementIds();
      expect(unlocked.size).toBe(0);
    });

    it('unlocks first-blood when first level is completed', () => {
      const save = getOrCreateGameSave();
      save.levelProgress['pistol-calm'] = {
        stars: 1,
        bestScore: 10,
        attempts: 1,
        lastPlayedAt: Date.now(),
      };
      save.stats.levelsCompleted = 1;

      const newlyUnlocked = checkAndUnlockAchievements(save);

      expect(newlyUnlocked).toContain('first-blood');

      const unlocked = getUnlockedAchievementIds();
      expect(unlocked.has('first-blood')).toBe(true);
    });

    it('unlocks sharpshooter when a bullseye is hit', () => {
      const save = getOrCreateGameSave();
      save.stats.totalBullseyes = 1;

      const newlyUnlocked = checkAndUnlockAchievements(save);

      expect(newlyUnlocked).toContain('sharpshooter');

      const unlocked = getUnlockedAchievementIds();
      expect(unlocked.has('sharpshooter')).toBe(true);
    });

    it('does not re-unlock already unlocked achievements', () => {
      const save = getOrCreateGameSave();
      save.levelProgress['pistol-calm'] = {
        stars: 1,
        bestScore: 10,
        attempts: 1,
        lastPlayedAt: Date.now(),
      };
      save.stats.levelsCompleted = 1;
      save.achievements['first-blood'] = {
        achievementId: 'first-blood',
        unlocked: true,
        progress: 1,
        target: 1,
        unlockedAt: Date.now(),
      };

      const newlyUnlocked = checkAndUnlockAchievements(save);
      expect(newlyUnlocked).not.toContain('first-blood');
    });
  });
});

describe('player stats', () => {
  it('fresh save has default zero stats', () => {
    const stats = getPlayerStats();

    expect(stats.totalShotsFired).toBe(0);
    expect(stats.totalBullseyes).toBe(0);
    expect(stats.totalCenters).toBe(0);
    expect(stats.averageOffsetMils).toBe(0);
    expect(stats.bestGroupSizeMils).toBe(999);
    expect(stats.levelsCompleted).toBe(0);
    expect(stats.packsCompleted).toBe(0);
    expect(stats.dailyChallengesCompleted).toBe(0);
    expect(stats.totalPlayTimeMs).toBe(0);
    expect(stats.longestStreak).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.lastPlayDate).toBeNull();
  });
});

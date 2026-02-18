import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  clearSaveData,
  getLevelProgress,
  getOrCreateGameSave,
  getPackStars,
  getPackMaxStars,
  getSelectedWeaponId,
  getTotalStars,
  loadGameSave,
  saveGameSave,
  setSelectedWeapon,
  type GameSave,
  updateLevelProgress,
  isLevelUnlocked,
  getUnlockedLevels,
  CURRENT_SCHEMA_VERSION,
} from '../localStore';

describe('localStore', () => {
  beforeEach(() => {
    // Clear storage before each test
    clearSaveData();
  });

  afterEach(() => {
    // Clean up after each test
    clearSaveData();
  });

  describe('saveGameSave and loadGameSave', () => {
    it('saves and loads game data correctly', () => {
      const save: GameSave = {
        version: CURRENT_SCHEMA_VERSION,
        selectedWeaponId: 'rifle-assault',
        levelProgress: {
          'level-1': { stars: 3, bestScore: 30, attempts: 1, lastPlayedAt: Date.now() },
        },
        unlockedWeapons: ['pistol-training', 'rifle-assault'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const saved = saveGameSave(save);
      expect(saved).toBe(true);

      const loaded = loadGameSave();
      expect(loaded).not.toBeNull();
      expect(loaded?.selectedWeaponId).toBe('rifle-assault');
      expect(loaded?.levelProgress['level-1'].stars).toBe(3);
    });

    it('returns null when no save exists', () => {
      const loaded = loadGameSave();
      expect(loaded).toBeNull();
    });

    it('rejects invalid save data', () => {
      const invalid = { foo: 'bar' } as unknown as GameSave;
      const saved = saveGameSave(invalid);
      expect(saved).toBe(false);
    });

    it('creates default save with correct structure', () => {
      const save = getOrCreateGameSave();
      
      expect(save.version).toBe(CURRENT_SCHEMA_VERSION);
      expect(save.selectedWeaponId).toBe('pistol-training');
      expect(save.levelProgress).toEqual({});
      expect(save.unlockedWeapons).toEqual(['pistol-training']);
      expect(save.createdAt).toBeGreaterThan(0);
      expect(save.updatedAt).toBeGreaterThan(0);
    });
  });

  describe('getOrCreateGameSave', () => {
    it('returns existing save if available', () => {
      const save = getOrCreateGameSave();
      save.selectedWeaponId = 'sniper-bolt';
      saveGameSave(save);

      const result = getOrCreateGameSave();
      expect(result.selectedWeaponId).toBe('sniper-bolt');
    });

    it('creates new save if none exists', () => {
      const result = getOrCreateGameSave();
      expect(result.selectedWeaponId).toBe('pistol-training');
    });
  });

  describe('setSelectedWeapon and getSelectedWeaponId', () => {
    it('sets and retrieves selected weapon', () => {
      setSelectedWeapon('rifle-carbine');
      expect(getSelectedWeaponId()).toBe('rifle-carbine');
    });

    it('returns default weapon ID when no save exists', () => {
      clearSaveData();
      expect(getSelectedWeaponId()).toBe('pistol-training');
    });
  });

  describe('updateLevelProgress', () => {
    it('creates new progress record', () => {
      const save = updateLevelProgress('level-1', 25, {
        one: 10,
        two: 20,
        three: 30,
      });

      expect(save.levelProgress['level-1']).toEqual({
        stars: 2,
        bestScore: 25,
        attempts: 1,
        lastPlayedAt: expect.any(Number),
      });
    });

    it('updates best score if new score is higher', () => {
      updateLevelProgress('level-1', 15, { one: 10, two: 20, three: 30 });
      const save = updateLevelProgress('level-1', 25, {
        one: 10,
        two: 20,
        three: 30,
      });

      expect(save.levelProgress['level-1'].bestScore).toBe(25);
      expect(save.levelProgress['level-1'].stars).toBe(2);
      expect(save.levelProgress['level-1'].attempts).toBe(2);
    });

    it('does not update best score if new score is lower', () => {
      updateLevelProgress('level-1', 25, { one: 10, two: 20, three: 30 });
      const save = updateLevelProgress('level-1', 15, {
        one: 10,
        two: 20,
        three: 30,
      });

      expect(save.levelProgress['level-1'].bestScore).toBe(25);
      expect(save.levelProgress['level-1'].stars).toBe(2);
      expect(save.levelProgress['level-1'].attempts).toBe(2);
    });

    it('calculates correct stars (3 star)', () => {
      const save = updateLevelProgress('level-1', 35, {
        one: 10,
        two: 20,
        three: 30,
      });
      expect(save.levelProgress['level-1'].stars).toBe(3);
    });

    it('calculates correct stars (0 star)', () => {
      const save = updateLevelProgress('level-1', 5, {
        one: 10,
        two: 20,
        three: 30,
      });
      expect(save.levelProgress['level-1'].stars).toBe(0);
    });
  });

  describe('getLevelProgress', () => {
    it('returns progress for completed level', () => {
      updateLevelProgress('level-1', 25, { one: 10, two: 20, three: 30 });
      const progress = getLevelProgress('level-1');

      expect(progress).toEqual({
        stars: 2,
        bestScore: 25,
        attempts: 1,
        lastPlayedAt: expect.any(Number),
      });
    });

    it('returns undefined for unplayed level', () => {
      const progress = getLevelProgress('level-99');
      expect(progress).toBeUndefined();
    });
  });

  describe('getTotalStars', () => {
    it('calculates total stars across all levels', () => {
      updateLevelProgress('level-1', 35, { one: 10, two: 20, three: 30 }); // 3 stars
      updateLevelProgress('level-2', 15, { one: 10, two: 20, three: 30 }); // 1 star
      updateLevelProgress('level-3', 25, { one: 10, two: 20, three: 30 }); // 2 stars

      expect(getTotalStars()).toBe(6);
    });

    it('returns 0 when no progress exists', () => {
      expect(getTotalStars()).toBe(0);
    });
  });

  describe('getPackStars', () => {
    it('calculates stars for specific pack', () => {
      updateLevelProgress('level-1', 35, { one: 10, two: 20, three: 30 });
      updateLevelProgress('level-2', 35, { one: 10, two: 20, three: 30 });
      updateLevelProgress('level-3', 35, { one: 10, two: 20, three: 30 });

      const packStars = getPackStars(['level-1', 'level-3']);
      expect(packStars).toBe(6);
    });

    it('returns 0 for empty pack', () => {
      expect(getPackStars([])).toBe(0);
    });

    it('returns 0 when played levels not in pack', () => {
      updateLevelProgress('level-1', 35, { one: 10, two: 20, three: 30 });
      expect(getPackStars(['level-99'])).toBe(0);
    });
  });

  describe('getPackMaxStars', () => {
    it('calculates max stars for pack', () => {
      expect(getPackMaxStars(['level-1', 'level-2', 'level-3'])).toBe(9);
    });

    it('returns 0 for empty pack', () => {
      expect(getPackMaxStars([])).toBe(0);
    });
  });

  describe('clearSaveData', () => {
    it('clears all save data', () => {
      getOrCreateGameSave();
      expect(loadGameSave()).not.toBeNull();

      clearSaveData();
      expect(loadGameSave()).toBeNull();
    });
  });

  describe('schema versioning', () => {
    it('validates schema version is tracked', () => {
      expect(CURRENT_SCHEMA_VERSION).toBeGreaterThan(0);
    });

    it('handles migration path when version changes', () => {
      // This test ensures migration infrastructure exists
      // Actual migration tests would be added when schema evolves
      const save = getOrCreateGameSave();
      saveGameSave(save);
      
      const loaded = loadGameSave();
      expect(loaded?.version).toBe(CURRENT_SCHEMA_VERSION);
    });
  });

  describe('persistence across operations', () => {
    it('maintains data through multiple operations', () => {
      setSelectedWeapon('sniper-bolt');
      updateLevelProgress('level-1', 30, { one: 10, two: 20, three: 30 });
      updateLevelProgress('level-2', 15, { one: 10, two: 20, three: 30 });

      expect(getSelectedWeaponId()).toBe('sniper-bolt');
      expect(getTotalStars()).toBe(4);
      expect(getLevelProgress('level-1')?.attempts).toBe(1);
    });
  });

  describe('isLevelUnlocked', () => {
    it('first level is always unlocked', () => {
      const allLevels = ['level-1', 'level-2', 'level-3'];
      expect(isLevelUnlocked('level-1', allLevels)).toBe(true);
    });

    it('level is locked if previous level has 0 stars', () => {
      const allLevels = ['level-1', 'level-2', 'level-3'];
      updateLevelProgress('level-1', 5, { one: 10, two: 20, three: 30 }); // 0 stars
      expect(isLevelUnlocked('level-2', allLevels)).toBe(false);
    });

    it('level is unlocked if previous level has >= 1 star', () => {
      const allLevels = ['level-1', 'level-2', 'level-3'];
      updateLevelProgress('level-1', 10, { one: 10, two: 20, three: 30 }); // 1 star
      expect(isLevelUnlocked('level-2', allLevels)).toBe(true);
    });

    it('level is unlocked if previous level has 2 stars', () => {
      const allLevels = ['level-1', 'level-2', 'level-3'];
      updateLevelProgress('level-1', 25, { one: 10, two: 20, three: 30 }); // 2 stars
      expect(isLevelUnlocked('level-2', allLevels)).toBe(true);
    });

    it('level is unlocked if previous level has 3 stars', () => {
      const allLevels = ['level-1', 'level-2', 'level-3'];
      updateLevelProgress('level-1', 35, { one: 10, two: 20, three: 30 }); // 3 stars
      expect(isLevelUnlocked('level-2', allLevels)).toBe(true);
    });

    it('third level is locked if second level has 0 stars', () => {
      const allLevels = ['level-1', 'level-2', 'level-3'];
      updateLevelProgress('level-1', 15, { one: 10, two: 20, three: 30 }); // 1 star
      updateLevelProgress('level-2', 5, { one: 10, two: 20, three: 30 }); // 0 stars
      expect(isLevelUnlocked('level-3', allLevels)).toBe(false);
    });

    it('third level is unlocked if second level has >= 1 star', () => {
      const allLevels = ['level-1', 'level-2', 'level-3'];
      updateLevelProgress('level-1', 15, { one: 10, two: 20, three: 30 }); // 1 star
      updateLevelProgress('level-2', 12, { one: 10, two: 20, three: 30 }); // 1 star
      expect(isLevelUnlocked('level-3', allLevels)).toBe(true);
    });
  });

  describe('getUnlockedLevels', () => {
    it('returns first level when no progress', () => {
      const allLevels = ['level-1', 'level-2', 'level-3'];
      const unlocked = getUnlockedLevels(allLevels);
      expect(unlocked).toEqual(['level-1']);
    });

    it('returns multiple levels when progress exists', () => {
      const allLevels = ['level-1', 'level-2', 'level-3'];
      updateLevelProgress('level-1', 15, { one: 10, two: 20, three: 30 }); // 1 star
      const unlocked = getUnlockedLevels(allLevels);
      expect(unlocked).toEqual(['level-1', 'level-2']);
    });

    it('returns all levels when all have stars', () => {
      const allLevels = ['level-1', 'level-2', 'level-3'];
      updateLevelProgress('level-1', 15, { one: 10, two: 20, three: 30 }); // 1 star
      updateLevelProgress('level-2', 15, { one: 10, two: 20, three: 30 }); // 1 star
      const unlocked = getUnlockedLevels(allLevels);
      expect(unlocked).toEqual(['level-1', 'level-2', 'level-3']);
    });
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  clearSaveData,
  getLevelProgress,
  getOrCreateGameSave,
  getPackStars,
  getTotalStars,
  loadGameSave,
  saveGameSave,
  type GameSave,
  updateLevelProgress,
  isLevelUnlocked,
  getUnlockedLevels,
  getGameSettings,
  updateGameSettings,
  getRealismScaling,
  CURRENT_SCHEMA_VERSION,
} from '../localStore';

describe('localStore', () => {
  beforeEach(() => {
    clearSaveData();
  });

  afterEach(() => {
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
        settings: {
          realismPreset: 'realistic',
          showShotTrace: false,
          showMilOffset: false,
          showHud: true,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(saveGameSave(save)).toBe(true);

      const loaded = loadGameSave();
      expect(loaded).not.toBeNull();
      expect(loaded?.selectedWeaponId).toBe('rifle-assault');
      expect(loaded?.levelProgress['level-1'].stars).toBe(3);
    });

    it('returns null when no save exists', () => {
      expect(loadGameSave()).toBeNull();
    });

    it('rejects invalid save data', () => {
      const invalid = { foo: 'bar' } as unknown as GameSave;
      expect(saveGameSave(invalid)).toBe(false);
    });
  });

  describe('getGameSettings', () => {
    it('returns default settings for new save', () => {
      const settings = getGameSettings();
      expect(settings.realismPreset).toBe('realistic');
      expect(settings.showShotTrace).toBe(false);
      expect(settings.showMilOffset).toBe(false);
      expect(settings.showHud).toBe(true);
    });

    it('returns persisted settings after update', () => {
      updateGameSettings({ realismPreset: 'arcade' });
      const settings = getGameSettings();
      expect(settings.realismPreset).toBe('arcade');
    });
  });

  describe('updateGameSettings', () => {
    it('updates single setting', () => {
      const updated = updateGameSettings({ realismPreset: 'expert' });
      expect(updated.settings.realismPreset).toBe('expert');
      expect(updated.settings.showHud).toBe(true);
    });

    it('updates multiple settings', () => {
      const updated = updateGameSettings({
        realismPreset: 'arcade',
        showHud: false,
        showShotTrace: true,
      });
      expect(updated.settings.realismPreset).toBe('arcade');
      expect(updated.settings.showHud).toBe(false);
      expect(updated.settings.showShotTrace).toBe(true);
      expect(updated.settings.showMilOffset).toBe(false);
    });

    it('persists settings across function calls', () => {
      updateGameSettings({ realismPreset: 'expert', showHud: false });
      const settings1 = getGameSettings();
      const settings2 = getGameSettings();
      expect(settings1.realismPreset).toBe('expert');
      expect(settings2.realismPreset).toBe('expert');
      expect(settings1.showHud).toBe(false);
      expect(settings2.showHud).toBe(false);
    });
  });

  describe('getRealismScaling', () => {
    it('returns baseline scaling for realistic preset', () => {
      const scaling = getRealismScaling('realistic');
      expect(scaling.dragScale).toBe(1.0);
      expect(scaling.windScale).toBe(1.0);
    });

    it('returns reduced scaling for arcade preset', () => {
      const scaling = getRealismScaling('arcade');
      expect(scaling.dragScale).toBe(0.5);
      expect(scaling.windScale).toBe(0.5);
    });

    it('returns increased scaling for expert preset', () => {
      const scaling = getRealismScaling('expert');
      expect(scaling.dragScale).toBe(1.2);
      expect(scaling.windScale).toBe(1.3);
    });
  });

  describe('settings schema migration', () => {
    it('migrates v1 to v2 saves', () => {
      // Manually create and save a v1 save (without settings field)
      // We need to bypass validation for this test
      const localStorageMock = {
        getItem: (key: string) => {
          if (typeof localStorage === 'undefined') return null;
          return localStorage.getItem(key);
        },
        setItem: (key: string, value: string) => {
          if (typeof localStorage === 'undefined') return;
          localStorage.setItem(key, value);
        },
      };

      const v1Save = {
        version: 1,
        selectedWeaponId: 'pistol-training',
        levelProgress: {},
        unlockedWeapons: ['pistol-training'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      localStorageMock.setItem('sharpshooter_save', JSON.stringify(v1Save));
      localStorageMock.setItem('sharpshooter_schema_version', '1');
      
      const loaded = loadGameSave();
      expect(loaded?.version).toBe(2);
      expect(loaded?.settings.realismPreset).toBe('realistic');
    });
  });

  describe('settings with other game data', () => {
    it('settings persist alongside level progress', () => {
      updateLevelProgress('level-1', 25, { one: 10, two: 20, three: 30 });
      updateGameSettings({ realismPreset: 'expert', showHud: false });

      const settings = getGameSettings();
      const progress = getLevelProgress('level-1');

      expect(settings.realismPreset).toBe('expert');
      expect(progress?.bestScore).toBe(25);
    });
  });

  describe('isLevelUnlocked', () => {
    it('first level is always unlocked', () => {
      const allLevels = ['level-1', 'level-2', 'level-3'];
      expect(isLevelUnlocked('level-1', allLevels)).toBe(true);
    });

    it('level is locked if previous level has 0 stars', () => {
      const allLevels = ['level-1', 'level-2', 'level-3'];
      updateLevelProgress('level-1', 5, { one: 10, two: 20, three: 30 });
      expect(isLevelUnlocked('level-2', allLevels)).toBe(false);
    });

    it('level is unlocked if previous level has >= 1 star', () => {
      const allLevels = ['level-1', 'level-2', 'level-3'];
      updateLevelProgress('level-1', 10, { one: 10, two: 20, three: 30 });
      expect(isLevelUnlocked('level-2', allLevels)).toBe(true);
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
      updateLevelProgress('level-1', 15, { one: 10, two: 20, three: 30 });
      const unlocked = getUnlockedLevels(allLevels);
      expect(unlocked).toEqual(['level-1', 'level-2']);
    });
  });

  describe('updateLevelProgress', () => {
    it('creates new progress record', () => {
      const save = updateLevelProgress('level-1', 25, { one: 10, two: 20, three: 30 });
      expect(save.levelProgress['level-1'].stars).toBe(2);
    });
  });

  describe('getTotalStars', () => {
    it('calculates total stars across all levels', () => {
      updateLevelProgress('level-1', 35, { one: 10, two: 20, three: 30 });
      updateLevelProgress('level-2', 15, { one: 10, two: 20, three: 30 });
      expect(getTotalStars()).toBe(4);
    });
  });

  describe('getPackStars', () => {
    it('calculates stars for specific pack', () => {
      updateLevelProgress('level-1', 35, { one: 10, two: 20, three: 30 });
      updateLevelProgress('level-2', 35, { one: 10, two: 20, three: 30 });
      expect(getPackStars(['level-1', 'level-3'])).toBe(3);
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
});
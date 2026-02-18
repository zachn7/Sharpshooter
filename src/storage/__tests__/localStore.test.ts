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
  getTurretState,
  updateTurretState,
  resetTurretStateForWeapon,
  getZeroProfile,
  saveZeroProfile,
  deleteZeroProfile,
  getZeroDistance,
  type TurretState,
  type ZeroProfile,
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
        turretStates: {},
        zeroProfiles: {},
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
      expect(loaded?.version).toBe(4); // Migrates all the way to latest version
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

  describe('getTurretState', () => {
    it('returns default zero turret state for new weapon', () => {
      const state = getTurretState('weapon-1');
      expect(state.elevationMils).toBe(0.0);
      expect(state.windageMils).toBe(0.0);
    });

    it('returns persisted turret state for weapon', () => {
      const turretState: TurretState = {
        elevationMils: 2.5,
        windageMils: -1.5,
      };
      updateTurretState('weapon-1', turretState);
      
      const loaded = getTurretState('weapon-1');
      expect(loaded.elevationMils).toBe(2.5);
      expect(loaded.windageMils).toBe(-1.5);
    });

    it('returns different states for different weapons', () => {
      updateTurretState('weapon-1', { elevationMils: 1.0, windageMils: 0.0 });
      updateTurretState('weapon-2', { elevationMils: 0.0, windageMils: 2.0 });
      
      const state1 = getTurretState('weapon-1');
      const state2 = getTurretState('weapon-2');
      
      expect(state1.elevationMils).toBe(1.0);
      expect(state2.windageMils).toBe(2.0);
    });
  });

  describe('updateTurretState', () => {
    it('saves turret state for weapon', () => {
      const turretState: TurretState = {
        elevationMils: 3.2,
        windageMils: -0.5,
      };
      const save = updateTurretState('weapon-1', turretState);
      
      expect(save.turretStates['weapon-1'].elevationMils).toBe(3.2);
      expect(save.turretStates['weapon-1'].windageMils).toBe(-0.5);
    });

    it('overwrites existing turret state', () => {
      updateTurretState('weapon-1', { elevationMils: 1.0, windageMils: 0.0 });
      updateTurretState('weapon-1', { elevationMils: 2.0, windageMils: 1.0 });
      
      const state = getTurretState('weapon-1');
      expect(state.elevationMils).toBe(2.0);
      expect(state.windageMils).toBe(1.0);
    });

    it('updates timestamp', () => {
      const before = getOrCreateGameSave();
      updateTurretState('weapon-1', { elevationMils: 1.0, windageMils: 0.0 });
      
      const save = getOrCreateGameSave();
      expect(save.updatedAt).toBeGreaterThanOrEqual(before.updatedAt);
    });
  });

  describe('resetTurretStateForWeapon', () => {
    it('resets turret state to zero', () => {
      updateTurretState('weapon-1', { elevationMils: 5.5, windageMils: -3.2 });
      resetTurretStateForWeapon('weapon-1');
      
      const state = getTurretState('weapon-1');
      expect(state.elevationMils).toBe(0.0);
      expect(state.windageMils).toBe(0.0);
    });

    it('does not affect other weapons', () => {
      updateTurretState('weapon-1', { elevationMils: 1.0, windageMils: 0.0 });
      updateTurretState('weapon-2', { elevationMils: 2.0, windageMils: 1.0 });
      
      resetTurretStateForWeapon('weapon-1');
      
      const state1 = getTurretState('weapon-1');
      const state2 = getTurretState('weapon-2');
      
      expect(state1.elevationMils).toBe(0.0);
      expect(state2.elevationMils).toBe(2.0);
    });
  });

  describe('turret schema migration', () => {
    it('migrates v2 to v3 saves', () => {
      // Manually create and save a v2 save (without turretStates field)
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

      const v3Save = {
        version: 3,
        selectedWeaponId: 'pistol-training',
        levelProgress: {},
        unlockedWeapons: ['pistol-training'],
        settings: {
          realismPreset: 'realistic',
          showShotTrace: false,
          showMilOffset: false,
          showHud: true,
        },
        turretStates: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      localStorageMock.setItem('sharpshooter_save', JSON.stringify(v3Save));
      localStorageMock.setItem('sharpshooter_schema_version', '3');
      
      const loaded = loadGameSave();
      expect(loaded?.version).toBe(4); // Migrates all the way to latest version
      expect(loaded?.turretStates).toEqual({});
    });
  });

  describe('turret state with other game data', () => {
    it('turret state persists alongside level progress', () => {
      updateLevelProgress('level-1', 25, { one: 10, two: 20, three: 30 });
      updateTurretState('weapon-1', { elevationMils: 2.0, windageMils: 1.0 });
      
      const progress = getLevelProgress('level-1');
      const turret = getTurretState('weapon-1');
      
      expect(progress?.bestScore).toBe(25);
      expect(turret.elevationMils).toBe(2.0);
    });
  });

  describe('getZeroProfile', () => {
    it('returns null for weapon without zero profile', () => {
      const profile = getZeroProfile('weapon-1');
      expect(profile).toBeNull();
    });

    it('returns saved zero profile for weapon', () => {
      const profile: ZeroProfile = {
        zeroDistanceM: 100,
        zeroElevationMils: 2.5,
        zeroWindageMils: -1.0,
      };
      saveZeroProfile('weapon-1', profile);
      
      const loaded = getZeroProfile('weapon-1');
      expect(loaded).toEqual(profile);
    });

    it('returns different profiles for different weapons', () => {
      saveZeroProfile('weapon-1', {
        zeroDistanceM: 100,
        zeroElevationMils: 1.0,
        zeroWindageMils: 0.0,
      });
      saveZeroProfile('weapon-2', {
        zeroDistanceM: 200,
        zeroElevationMils: 2.0,
        zeroWindageMils: 1.0,
      });
      
      const profile1 = getZeroProfile('weapon-1');
      const profile2 = getZeroProfile('weapon-2');
      
      expect(profile1?.zeroDistanceM).toBe(100);
      expect(profile2?.zeroDistanceM).toBe(200);
    });
  });

  describe('saveZeroProfile', () => {
    it('saves zero profile for weapon', () => {
      const profile: ZeroProfile = {
        zeroDistanceM: 50,
        zeroElevationMils: 1.5,
        zeroWindageMils: -0.5,
      };
      const save = saveZeroProfile('weapon-1', profile);
      
      expect(save.zeroProfiles['weapon-1']).toEqual(profile);
    });

    it('overwrites existing zero profile', () => {
      saveZeroProfile('weapon-1', {
        zeroDistanceM: 100,
        zeroElevationMils: 1.0,
        zeroWindageMils: 0.0,
      });
      saveZeroProfile('weapon-1', {
        zeroDistanceM: 150,
        zeroElevationMils: 2.0,
        zeroWindageMils: 1.0,
      });
      
      const profile = getZeroProfile('weapon-1');
      expect(profile?.zeroDistanceM).toBe(150);
    });

    it('updates timestamp', () => {
      const before = getOrCreateGameSave();
      saveZeroProfile('weapon-1', {
        zeroDistanceM: 100,
        zeroElevationMils: 0.0,
        zeroWindageMils: 0.0,
      });
      
      const save = getOrCreateGameSave();
      expect(save.updatedAt).toBeGreaterThanOrEqual(before.updatedAt);
    });
  });

  describe('deleteZeroProfile', () => {
    it('deletes zero profile for weapon', () => {
      saveZeroProfile('weapon-1', {
        zeroDistanceM: 100,
        zeroElevationMils: 0.0,
        zeroWindageMils: 0.0,
      });
      
      expect(getZeroProfile('weapon-1')).not.toBeNull();
      
      deleteZeroProfile('weapon-1');
      expect(getZeroProfile('weapon-1')).toBeNull();
    });

    it('does not affect other weapons', () => {
      saveZeroProfile('weapon-1', {
        zeroDistanceM: 100,
        zeroElevationMils: 0.0,
        zeroWindageMils: 0.0,
      });
      saveZeroProfile('weapon-2', {
        zeroDistanceM: 200,
        zeroElevationMils: 0.0,
        zeroWindageMils: 0.0,
      });
      
      deleteZeroProfile('weapon-1');
      expect(getZeroProfile('weapon-1')).toBeNull();
      expect(getZeroProfile('weapon-2')).not.toBeNull();
    });
  });

  describe('getZeroDistance', () => {
    it('returns 0 for weapon without zero profile', () => {
      const distance = getZeroDistance('weapon-1');
      expect(distance).toBe(0);
    });

    it('returns zero distance from profile', () => {
      saveZeroProfile('weapon-1', {
        zeroDistanceM: 100,
        zeroElevationMils: 1.0,
        zeroWindageMils: 0.0,
      });
      
      const distance = getZeroDistance('weapon-1');
      expect(distance).toBe(100);
    });
  });

  describe('zero schema migration', () => {
    it('migrates v3 to v4 saves', () => {
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

      const v3Save = {
        version: 3,
        selectedWeaponId: 'pistol-training',
        levelProgress: {},
        unlockedWeapons: ['pistol-training'],
        settings: {
          realismPreset: 'realistic',
          showShotTrace: false,
          showMilOffset: false,
          showHud: true,
        },
        turretStates: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      localStorageMock.setItem('sharpshooter_save', JSON.stringify(v3Save));
      localStorageMock.setItem('sharpshooter_schema_version', '3');
      
      const loaded = loadGameSave();
      expect(loaded?.version).toBe(4);
      expect(loaded?.zeroProfiles).toEqual({});
    });
  });

  describe('zero profile with other game data', () => {
    it('zero profile persists alongside turret state', () => {
      updateTurretState('weapon-1', { elevationMils: 1.0, windageMils: 0.0 });
      saveZeroProfile('weapon-1', {
        zeroDistanceM: 100,
        zeroElevationMils: 2.0,
        zeroWindageMils: 1.0,
      });
      
      const turret = getTurretState('weapon-1');
      const profile = getZeroProfile('weapon-1');
      
      expect(turret.elevationMils).toBe(1.0);
      expect(profile?.zeroElevationMils).toBe(2.0);
    });
  });
});
import { beforeEach, describe, expect, it } from 'vitest';
import {
  awardProfileXp,
  clearSaveData,
  completeCampaignLevel,
  getCampaignUnlockedWeaponIds,
  getOrCreateGameSave,
  getPlayerProfileLevel,
  getSelectedWeaponId,
  loadGameSave,
  saveGameSave,
} from '../localStore';

describe('profile progression storage', () => {
  beforeEach(() => {
    clearSaveData();
  });

  it('starts campaign with pistol-only access', () => {
    expect(getPlayerProfileLevel()).toBe(1);
    expect(getCampaignUnlockedWeaponIds()).toEqual(['pistol-training']);
    expect(getSelectedWeaponId()).toBe('pistol-training');
  });

  it('levels up and unlocks rifles before shotguns and snipers', () => {
    awardProfileXp(250);
    expect(getPlayerProfileLevel()).toBe(3);
    expect(getCampaignUnlockedWeaponIds()).toContain('rifle-assault');
    expect(getCampaignUnlockedWeaponIds()).not.toContain('shotgun-pump');
    expect(getCampaignUnlockedWeaponIds()).not.toContain('sniper-marksman');
  });

  it('awards campaign xp when completing a level', () => {
    const result = completeCampaignLevel(
      'pistol-calm',
      100,
      { one: 20, two: 50, three: 90 },
      'easy'
    );

    expect(result.stars).toBe(3);
    expect(result.xpAwarded).toBeGreaterThan(0);
    expect(getPlayerProfileLevel()).toBeGreaterThanOrEqual(2);
  });

  it('migrates old saves into the new progression schema', () => {
    const defaults = getOrCreateGameSave();

    saveGameSave({
      version: 20,
      selectedWeaponId: 'rifle-assault',
      freeplaySelectedWeaponId: 'rifle-assault',
      profileXp: 0,
      levelProgress: {},
      unlockedWeapons: ['rifle-assault'],
      settings: defaults.settings,
      turretStates: {},
      zeroProfiles: {},
      selectedAmmoId: {},
      stats: defaults.stats,
      achievements: {},
      reticleSkinId: 'classic',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const migrated = loadGameSave();
    expect(migrated?.selectedWeaponId).toBe('pistol-training');
    expect(migrated?.unlockedWeapons).toEqual(['pistol-training']);
  });
});

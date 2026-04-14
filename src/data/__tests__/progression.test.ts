import { describe, expect, it } from 'vitest';
import {
  calculateCampaignXpReward,
  getCampaignUnlockedWeaponIdsForLevel,
  getPackUnlockLevel,
  getProfileLevel,
  getProfileProgress,
} from '../progression';

describe('progression helpers', () => {
  it('levels up on a gentle early-game curve', () => {
    expect(getProfileLevel(0)).toBe(1);
    expect(getProfileLevel(100)).toBe(2);
    expect(getProfileLevel(225)).toBe(3);
  });

  it('reports progress within the current level band', () => {
    expect(getProfileProgress(150)).toMatchObject({
      level: 2,
      currentLevelXp: 50,
      nextLevelXp: 125,
    });
  });

  it('unlocks families in the intended order', () => {
    expect(getCampaignUnlockedWeaponIdsForLevel(1)).toEqual(['pistol-training']);
    expect(getCampaignUnlockedWeaponIdsForLevel(3)).toContain('rifle-assault');
    expect(getCampaignUnlockedWeaponIdsForLevel(6)).toContain('shotgun-pump');
    expect(getCampaignUnlockedWeaponIdsForLevel(8)).toContain('sniper-marksman');
  });

  it('applies pack gates and rewards campaign clears', () => {
    expect(getPackUnlockLevel('pistol-basics')).toBe(1);
    expect(getPackUnlockLevel('shotguns-pack')).toBe(6);
    expect(
      calculateCampaignXpReward({
        difficulty: 'medium',
        stars: 3,
        firstClear: true,
        improvedStars: 3,
      })
    ).toBeGreaterThan(150);
  });
});

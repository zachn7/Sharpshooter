import { describe, expect, it } from 'vitest';
import {
  BASIC_PACK_IDS,
  STARTER_WEAPON_IDS,
  getRecommendedWeaponTypeForDistance,
  getTutorialLoadoutForDistance,
} from '../engagements';

describe('engagement profiles', () => {
  it('recommends sniper loadouts for long tutorial distances', () => {
    expect(getRecommendedWeaponTypeForDistance(400)).toBe('sniper');
    expect(getRecommendedWeaponTypeForDistance(700)).toBe('sniper');
  });

  it('returns valid tutorial loadouts that exist in starter progression', () => {
    const closeLoadout = getTutorialLoadoutForDistance(25);
    const longLoadout = getTutorialLoadoutForDistance(400);

    expect(closeLoadout.weaponId).toBeTruthy();
    expect(closeLoadout.ammoId).toBeTruthy();
    expect(longLoadout.weaponId).toBe('sniper-bolt');
    expect(longLoadout.ammoId).toBe('sniper-match');
  });

  it('defines starter progression for all four core weapon families', () => {
    expect(STARTER_WEAPON_IDS.length).toBe(4);
    expect(new Set(STARTER_WEAPON_IDS).size).toBe(4);
    expect(BASIC_PACK_IDS.length).toBe(4);
  });
});

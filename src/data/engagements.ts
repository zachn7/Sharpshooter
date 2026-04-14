import type { WeaponType } from './weapons';

export interface WeaponEngagementProfile {
  type: WeaponType;
  label: string;
  minDistanceM: number;
  recommendedMinM: number;
  recommendedMaxM: number;
  maxDistanceM: number;
  tutorialWeaponId: string;
  tutorialAmmoId: string;
  starterWeaponId: string;
  basicPackId: string;
  progressionPacks: string[];
}

export const WEAPON_ENGAGEMENT_PROFILES: Record<WeaponType, WeaponEngagementProfile> = {
  pistol: {
    type: 'pistol',
    label: 'Pistol',
    minDistanceM: 5,
    recommendedMinM: 10,
    recommendedMaxM: 50,
    maxDistanceM: 75,
    tutorialWeaponId: 'pistol-eclipse',
    tutorialAmmoId: 'pistol-match',
    starterWeaponId: 'pistol-training',
    basicPackId: 'pistol-basics',
    progressionPacks: ['pistol-basics', 'pistols', 'pistol-marksman'],
  },
  rifle: {
    type: 'rifle',
    label: 'Rifle',
    minDistanceM: 40,
    recommendedMinM: 50,
    recommendedMaxM: 250,
    maxDistanceM: 400,
    tutorialWeaponId: 'rifle-assault',
    tutorialAmmoId: 'rifle-match',
    starterWeaponId: 'rifle-assault',
    basicPackId: 'rifle-basics',
    progressionPacks: ['rifle-basics', 'rifle-fundamentals'],
  },
  shotgun: {
    type: 'shotgun',
    label: 'Shotgun',
    minDistanceM: 5,
    recommendedMinM: 10,
    recommendedMaxM: 35,
    maxDistanceM: 60,
    tutorialWeaponId: 'shotgun-semi',
    tutorialAmmoId: 'shotgun-match',
    starterWeaponId: 'shotgun-pump',
    basicPackId: 'shotguns-pack',
    progressionPacks: ['shotguns-pack'],
  },
  sniper: {
    type: 'sniper',
    label: 'Sniper',
    minDistanceM: 200,
    recommendedMinM: 250,
    recommendedMaxM: 1200,
    maxDistanceM: 1800,
    tutorialWeaponId: 'sniper-bolt',
    tutorialAmmoId: 'sniper-match',
    starterWeaponId: 'sniper-bolt',
    basicPackId: 'sniper-basics',
    progressionPacks: ['sniper-basics', 'elr-pack'],
  },
};

export const STARTER_WEAPON_IDS = Object.values(WEAPON_ENGAGEMENT_PROFILES).map(
  (profile) => profile.starterWeaponId
);

export const BASIC_PACK_IDS = Object.values(WEAPON_ENGAGEMENT_PROFILES).map(
  (profile) => profile.basicPackId
);

export function getRecommendedWeaponTypeForDistance(distanceM: number): WeaponType {
  if (distanceM >= WEAPON_ENGAGEMENT_PROFILES.sniper.recommendedMinM) {
    return 'sniper';
  }
  if (distanceM >= WEAPON_ENGAGEMENT_PROFILES.rifle.recommendedMinM) {
    return 'rifle';
  }
  if (distanceM <= WEAPON_ENGAGEMENT_PROFILES.shotgun.recommendedMaxM) {
    return 'shotgun';
  }
  return 'pistol';
}

export function getTutorialLoadoutForDistance(distanceM: number) {
  const weaponType = getRecommendedWeaponTypeForDistance(distanceM);
  const profile = WEAPON_ENGAGEMENT_PROFILES[weaponType];

  return {
    weaponType,
    weaponId: profile.tutorialWeaponId,
    ammoId: profile.tutorialAmmoId,
  };
}

export function isPackUnlockedByDefault(packId: string): boolean {
  return BASIC_PACK_IDS.includes(packId);
}

export function getPreviousPackInProgression(packId: string): string | null {
  for (const profile of Object.values(WEAPON_ENGAGEMENT_PROFILES)) {
    const index = profile.progressionPacks.indexOf(packId);
    if (index > 0) {
      return profile.progressionPacks[index - 1];
    }
  }

  return null;
}

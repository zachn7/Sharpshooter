import type { WeaponType } from './weapons';

export type GameModeAccess = 'campaign' | 'freeplay' | 'tutorial';

export interface ProfileProgress {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressToNext: number;
}

export interface CampaignXpRewardInput {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  stars: 0 | 1 | 2 | 3;
  firstClear: boolean;
  improvedStars: number;
}

const XP_PER_LEVEL_BASE = 100;
const XP_PER_LEVEL_STEP = 25;

const PACK_UNLOCK_LEVELS: Record<string, number> = {
  'pistol-basics': 1,
  pistols: 2,
  'rifle-basics': 3,
  'pistol-marksman': 4,
  'rifle-fundamentals': 5,
  'shotguns-pack': 6,
  'sniper-basics': 8,
  'expert-challenge': 10,
  'elr-pack': 12,
};

const WEAPON_UNLOCK_LEVELS: Record<string, number> = {
  'pistol-training': 1,
  'pistol-competition': 2,
  'pistol-viper': 3,
  'rifle-assault': 3,
  'pistol-phantom': 4,
  'rifle-carbine': 4,
  'pistol-eclipse': 5,
  'rifle-battle': 5,
  'shotgun-pump': 6,
  'pistol-magnum': 6,
  'shotgun-semi': 7,
  'dmr-precision': 7,
  'sniper-marksman': 8,
  'shotgun-skeet': 8,
  'sniper-bolt': 9,
  'dmr-heavy-magnum': 10,
  'sniper-heavy': 11,
  'elr-sniper': 12,
};

const WEAPON_TYPE_UNLOCK_LEVELS: Record<WeaponType, number> = {
  pistol: 1,
  rifle: 3,
  shotgun: 6,
  sniper: 8,
};

export const CAMPAIGN_STARTER_WEAPON_IDS = ['pistol-training'];

export function getXpRequiredForLevel(level: number): number {
  if (level <= 1) {
    return 0;
  }

  let totalXp = 0;
  for (let currentLevel = 1; currentLevel < level; currentLevel += 1) {
    totalXp += XP_PER_LEVEL_BASE + (currentLevel - 1) * XP_PER_LEVEL_STEP;
  }

  return totalXp;
}

export function getProfileLevel(totalXp: number): number {
  let level = 1;
  while (totalXp >= getXpRequiredForLevel(level + 1)) {
    level += 1;
  }
  return level;
}

export function getProfileProgress(totalXp: number): ProfileProgress {
  const level = getProfileLevel(totalXp);
  const currentLevelFloor = getXpRequiredForLevel(level);
  const nextLevelFloor = getXpRequiredForLevel(level + 1);
  const currentLevelXp = totalXp - currentLevelFloor;
  const nextLevelXp = nextLevelFloor - currentLevelFloor;

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progressToNext: nextLevelXp === 0 ? 1 : currentLevelXp / nextLevelXp,
  };
}

export function getPackUnlockLevel(packId: string): number {
  return PACK_UNLOCK_LEVELS[packId] ?? 1;
}

export function getWeaponUnlockLevel(weaponId: string): number {
  return WEAPON_UNLOCK_LEVELS[weaponId] ?? 1;
}

export function getWeaponTypeUnlockLevel(weaponType: WeaponType): number {
  return WEAPON_TYPE_UNLOCK_LEVELS[weaponType];
}

export function getCampaignUnlockedWeaponIdsForLevel(profileLevel: number): string[] {
  return Object.entries(WEAPON_UNLOCK_LEVELS)
    .filter(([, unlockLevel]) => profileLevel >= unlockLevel)
    .map(([weaponId]) => weaponId)
    .sort((left, right) => getWeaponUnlockLevel(left) - getWeaponUnlockLevel(right));
}

export function isWeaponTypeUnlockedForCampaign(weaponType: WeaponType, profileLevel: number): boolean {
  return profileLevel >= getWeaponTypeUnlockLevel(weaponType);
}

export function calculateCampaignXpReward({
  difficulty,
  stars,
  firstClear,
  improvedStars,
}: CampaignXpRewardInput): number {
  const difficultyBase: Record<CampaignXpRewardInput['difficulty'], number> = {
    easy: 55,
    medium: 70,
    hard: 90,
    expert: 115,
  };

  const firstClearBonus = firstClear ? 35 : 0;
  const improvementBonus = Math.max(0, improvedStars) * 18;
  const starsBonus = stars * 22;
  const masteryBonus = stars === 3 ? 15 : 0;

  return difficultyBase[difficulty] + firstClearBonus + improvementBonus + starsBonus + masteryBonus;
}

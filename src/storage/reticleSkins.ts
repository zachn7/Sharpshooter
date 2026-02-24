import { type ReticleSkin } from './localStore';

/**
 * Cosmetic Reticle Skins
 * 
 * Each skin has a unique colorway and may require a pack completion or achievement to unlock.
 * Skins are purely visual - no gameplay advantage.
 */
export const RETICLE_SKINS: ReticleSkin[] = [
  {
    id: 'classic',
    name: 'Classic Red',
    description: 'Standard red reticle. Time-tested for precision.',
    achievementId: null, // Always unlocked
    colorPrimary: '#e53935', // Bright red
    colorSecondary: '#ffcdd2', // Light red
    thickness: 0, // Use setting
  },
  // Pistols Pack skins
  {
    id: 'tactical-green',
    name: 'Tactical Green',
    description: 'Military-inspired green reticle.',
    achievementId: 'novice', // Complete 5 levels
    colorPrimary: '#4caf50', // Army green
    colorSecondary: '#c8e6c9', // Light green
    thickness: 0,
  },
  {
    id: 'navy-blue',
    name: 'Navy Blue',
    description: 'Professional blue reticle. Clean and calculated.',
    achievementId: 'novice', // Complete 5 levels
    colorPrimary: '#1976d2', // Navy blue
    colorSecondary: '#bbdefb', // Light blue
    thickness: 0,
  },
  {
    id: 'golden-eye',
    name: 'Golden Eye',
    description: 'Luxurious gold reticle. For the discerning marksman.',
    achievementId: 'marksman', // Complete 20 levels
    colorPrimary: '#ffa000', // Amber gold
    colorSecondary: '#ffe0b2', // Light gold
    thickness: 0,
  },
  {
    id: 'cyber-pink',
    name: 'Cyber Pink',
    description: 'Futuristic pink reticle. Stand out on the digital battlefield.',
    achievementId: 'pack-master', // Complete all levels in a pack
    colorPrimary: '#e91e63', // Hot pink
    colorSecondary: '#f8bbd0', // Light pink
    thickness: 0,
  },
  {
    id: 'stealth-gray',
    name: 'Stealth Gray',
    description: 'Subdued gray reticle. Low visibility for discreet operations.',
    achievementId: 'elr-pioneer', // Reach 1500m
    colorPrimary: '#616161', // Cool gray
    colorSecondary: '#bdbdbd', // Light gray
    thickness: 0,
  },
  {
    id: 'hunter-orange',
    name: 'Hunter Orange',
    description: 'High-visibility orange reticle. Perfect for tracking.',
    achievementId: 'daily-hero', // Complete daily challenge
    colorPrimary: '#ff9800', // Safety orange
    colorSecondary: '#ffcc80', // Light orange
    thickness: 0,
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Regal purple reticle. Command respect with your precision.',
    achievementId: 'veteran', // Complete 50 levels
    colorPrimary: '#7b1fa2', // Royal purple
    colorSecondary: '#e1bee7', // Light purple
    thickness: 0,
  },
  {
    id: 'tactical-thick',
    name: 'Tactical Thick',
    description: 'Thick-lined reticle for easy visibility at long range.',
    achievementId: 'tight-group', // 0.5 MIL group
    colorPrimary: '#e53935', // Red
    colorSecondary: '#ffcdd2', // Light red
    thickness: 4, // Override thickness
  },
  {
    id: 'precision-thin',
    name: 'Precision Thin',
    description: 'Ultra-thin red reticle for maximum precision.',
    achievementId: 'hundred-bullseyes', // 100 bullseyes
    colorPrimary: '#e53935', // Red
    colorSecondary: '#ffcdd2', // Light red
    thickness: 1, // Ultra thin
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    description: 'Celebrate success with a rainbow reticle!',
    achievementId: 'streak-7', // 7-day streak
    colorPrimary: '#e53935', // Red (cycles through in rendering)
    colorSecondary: '#ffeb3b', // Yellow
    thickness: 0,
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    description: 'Legendary orange and gold reticle. Rise from the challenge.',
    achievementId: 'consistent', // 1000 shots
    colorPrimary: '#ff5722', // Deep orange
    colorSecondary: '#ffd700', // Gold
    thickness: 0,
  },
];

/**
 * Get reticle skin by ID
 */
export function getReticleSkin(id: string): ReticleSkin | undefined {
  return RETICLE_SKINS.find(s => s.id === id);
}

/**
 * Get all unlocked reticle skins based on achievements
 */
export function getUnlockedReticleSkins(unlockedAchievementIds: Set<string>): ReticleSkin[] {
  return RETICLE_SKINS.filter(
    skin => skin.achievementId === null || unlockedAchievementIds.has(skin.achievementId)
  );
}

/**
 * Check if a reticle skin is unlocked
 */
export function isReticleSkinUnlocked(skinId: string, unlockedAchievementIds: Set<string>): boolean {
  const skin = getReticleSkin(skinId);
  if (!skin) return false;
  return skin.achievementId === null || unlockedAchievementIds.has(skin.achievementId);
}

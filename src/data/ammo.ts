// Ammo variant types
export type AmmoType = 'budget' | 'match' | 'heavy' | 'light';

// Ammo variant with gameplay modifiers
export interface AmmoVariant {
  id: string;                  // Unique ammo ID (e.g., 'pistol-budget')
  weaponType: string;          // Weapon type ('pistol', 'rifle', 'sniper', 'shotgun')
  name: string;                // Display name (e.g., 'Budget FMJ')
  description: string;         // Short description
  // Gameplay modifiers (scales applied to weapon params)
  muzzleVelocityScale: number; // Multiplier for muzzle velocity
  dragScale: number;           // Multiplier for drag factor (BC proxy)
  dispersionScale: number;     // Multiplier for weapon precision (MOA)
  recoilScale: number;         // Multiplier for recoil impulse
}

// Ammo variants catalog - organized by weapon type
export const AMMO_CATALOG: AmmoVariant[] = [
  // Pistol ammo
  {
    id: 'pistol-budget',
    weaponType: 'pistol',
    name: 'Budget FMJ',
    description: 'Cheap full metal jacket. Lower velocity, more dispersion.',
    muzzleVelocityScale: 0.95,
    dragScale: 1.1,
    dispersionScale: 1.3,
    recoilScale: 0.9,
  },
  {
    id: 'pistol-match',
    weaponType: 'pistol',
    name: 'Match Grade',
    description: 'Premium competition ammo. Precision tuned for accuracy.',
    muzzleVelocityScale: 1.0,
    dragScale: 0.95,
    dispersionScale: 0.7,
    recoilScale: 1.0,
  },
  {
    id: 'pistol-heavy',
    weaponType: 'pistol',
    name: 'Heavy Subsonic',
    description: 'Slower heavy bullet. Less drop, more drag.',
    muzzleVelocityScale: 0.85,
    dragScale: 1.2,
    dispersionScale: 0.9,
    recoilScale: 1.2,
  },
  {
    id: 'pistol-light',
    weaponType: 'pistol',
    name: 'Light +P',
    description: 'High-velocity light bullet. More recoil, flatter trajectory.',
    muzzleVelocityScale: 1.08,
    dragScale: 0.92,
    dispersionScale: 1.1,
    recoilScale: 1.15,
  },

  // Rifle ammo
  {
    id: 'rifle-budget',
    weaponType: 'rifle',
    name: 'Budget Ball',
    description: 'Standard military surplus. Consistent but not precise.',
    muzzleVelocityScale: 0.97,
    dragScale: 1.05,
    dispersionScale: 1.2,
    recoilScale: 0.95,
  },
  {
    id: 'rifle-match',
    weaponType: 'rifle',
    name: 'Match Grade 5.56',
    description: 'Precision match ammo. Optimized for accuracy.',
    muzzleVelocityScale: 1.0,
    dragScale: 0.94,
    dispersionScale: 0.65,
    recoilScale: 1.0,
  },
  {
    id: 'rifle-heavy',
    weaponType: 'rifle',
    name: 'Heavy Barrier',
    description: 'Penetrator round. Heavy bullet, retains energy.',
    muzzleVelocityScale: 0.9,
    dragScale: 0.85,
    dispersionScale: 0.9,
    recoilScale: 1.25,
  },
  {
    id: 'rifle-light',
    weaponType: 'rifle',
    name: 'Light Varmit',
    description: 'High-velocity varmit round. Flat trajectory, light.',
    muzzleVelocityScale: 1.05,
    dragScale: 0.93,
    dispersionScale: 0.8,
    recoilScale: 0.9,
  },

  // Sniper ammo
  {
    id: 'sniper-budget',
    weaponType: 'sniper',
    name: 'Military Ball',
    description: 'Standard sniper load. Good, but not match-grade.',
    muzzleVelocityScale: 0.98,
    dragScale: 1.02,
    dispersionScale: 1.15,
    recoilScale: 1.0,
  },
  {
    id: 'sniper-match',
    weaponType: 'sniper',
    name: 'Match .308',
    description: 'Premium match grade. Exceptional consistency.',
    muzzleVelocityScale: 1.0,
    dragScale: 0.9,
    dispersionScale: 0.5,
    recoilScale: 1.0,
  },
  {
    id: 'sniper-heavy',
    weaponType: 'sniper',
    name: '.338 Lapua',
    description: 'Heavy magnum round. Massive energy, flat trajectory.',
    muzzleVelocityScale: 1.05,
    dragScale: 0.75,
    dispersionScale: 0.6,
    recoilScale: 1.3,
  },
  {
    id: 'sniper-light',
    weaponType: 'sniper',
    name: 'Light Match',
    description: 'Light match load. Higher velocity, less energy.',
    muzzleVelocityScale: 1.03,
    dragScale: 0.88,
    dispersionScale: 0.55,
    recoilScale: 0.95,
  },

  // Shotgun ammo
  {
    id: 'shotgun-budget',
    weaponType: 'shotgun',
    name: 'Target Slugs',
    description: 'Basic target slugs. Moderate accuracy.',
    muzzleVelocityScale: 0.95,
    dragScale: 1.1,
    dispersionScale: 1.25,
    recoilScale: 0.9,
  },
  {
    id: 'shotgun-match',
    weaponType: 'shotgun',
    name: 'Brenneke Slug',
    description: 'Premium slug load. Better stability.',
    muzzleVelocityScale: 1.0,
    dragScale: 0.95,
    dispersionScale: 0.7,
    recoilScale: 1.0,
  },
  {
    id: 'shotgun-heavy',
    weaponType: 'shotgun',
    name: 'Heavy Foster',
    description: 'Heavy foster slug. High momentum.',
    muzzleVelocityScale: 0.85,
    dragScale: 0.85,
    dispersionScale: 0.8,
    recoilScale: 1.3,
  },
  {
    id: 'shotgun-light',
    weaponType: 'shotgun',
    name: 'Light Sabot',
    description: 'Sabot slug. High velocity, light projectile.',
    muzzleVelocityScale: 1.1,
    dragScale: 0.9,
    dispersionScale: 0.75,
    recoilScale: 0.85,
  },
];

// Get ammo by ID
export function getAmmoById(id: string): AmmoVariant | undefined {
  return AMMO_CATALOG.find((a) => a.id === id);
}

// Get ammo variants for a specific weapon type
export function getAmmoByWeaponType(weaponType: string): AmmoVariant[] {
  return AMMO_CATALOG.filter((a) => a.weaponType === weaponType);
}

// Default ammo ID per weapon type
export const DEFAULT_AMMO_IDS: Record<string, string> = {
  pistol: 'pistol-match',
  rifle: 'rifle-match',
  sniper: 'sniper-match',
  shotgun: 'shotgun-match',
};

// Get default ammo for weapon type
export function getDefaultAmmoId(weaponType: string): string {
  return DEFAULT_AMMO_IDS[weaponType] || 'match';
}
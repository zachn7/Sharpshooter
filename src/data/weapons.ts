// Weapon types for categorization
export type WeaponType = 'pistol' | 'rifle' | 'sniper' | 'shotgun';

// Optic types for aim assistance
export type OpticType = 'iron-sights' | 'red-dot' | 'scope-4x' | 'scope-8x' | 'scope-12x';

// Weapon gameplay parameters
export interface WeaponParams {
  muzzleVelocityMps: number;    // Muzzle velocity in m/s
  massKg: number;                // Projectile mass in kg
  diameterM: number;             // Projectile diameter in m
  dragFactor: number;            // Gameplay-tunable drag coefficient (combined with air density)
  defaultOptic: OpticType;       // Default optic type
  recoilRecoveryMs: number;      // Time to recover from recoil (for future use)
}

// Weapon entry in catalog
export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  description: string;
  params: WeaponParams;
  unlocked: boolean;             // Can be locked/unlocked via progression
}

// Weapons catalog - organized by type
export const WEAPONS_CATALOG: Weapon[] = [
  // Pistols
  {
    id: 'pistol-training',
    name: 'Training Pistol M9',
    type: 'pistol',
    description: 'Standard training sidearm. Low velocity, minimal drop.',
    params: {
      muzzleVelocityMps: 350,
      massKg: 0.010,
      diameterM: 0.009,
      dragFactor: 0.00003,
      defaultOptic: 'iron-sights',
      recoilRecoveryMs: 200,
    },
    unlocked: true,
  },
  {
    id: 'pistol-competition',
    name: 'Competition 9mm',
    type: 'pistol',
    description: 'High-performance competition pistol with balanced recoil.',
    params: {
      muzzleVelocityMps: 400,
      massKg: 0.008,
      diameterM: 0.009,
      dragFactor: 0.000025,
      defaultOptic: 'red-dot',
      recoilRecoveryMs: 150,
    },
    unlocked: true,
  },
  {
    id: 'pistol-magnum',
    name: 'Magnum .44',
    type: 'pistol',
    description: 'Heavy-hitting revolver with significant recoil and drop.',
    params: {
      muzzleVelocityMps: 450,
      massKg: 0.016,
      diameterM: 0.011,
      dragFactor: 0.000035,
      defaultOptic: 'iron-sights',
      recoilRecoveryMs: 300,
    },
    unlocked: true,
  },

  // Rifles
  {
    id: 'rifle-carbine',
    name: 'Carbine AR-15',
    type: 'rifle',
    description: 'Versatile carbine good for mid-range engagements.',
    params: {
      muzzleVelocityMps: 800,
      massKg: 0.004,
      diameterM: 0.0057,
      dragFactor: 0.00002,
      defaultOptic: 'red-dot',
      recoilRecoveryMs: 100,
    },
    unlocked: true,
  },
  {
    id: 'rifle-assault',
    name: 'Assault Rifle M4',
    type: 'rifle',
    description: 'Military-grade assault rifle with high velocity.',
    params: {
      muzzleVelocityMps: 900,
      massKg: 0.004,
      diameterM: 0.0057,
      dragFactor: 0.000018,
      defaultOptic: 'scope-4x',
      recoilRecoveryMs: 80,
    },
    unlocked: true,
  },
  {
    id: 'rifle-battle',
    name: 'Battle Rifle G3',
    type: 'rifle',
    description: 'Powerful full-size rifle with substantial recoil.',
    params: {
      muzzleVelocityMps: 850,
      massKg: 0.008,
      diameterM: 0.0076,
      dragFactor: 0.00002,
      defaultOptic: 'scope-4x',
      recoilRecoveryMs: 150,
    },
    unlocked: true,
  },

  // Sniper Rifles
  {
    id: 'sniper-marksman',
    name: 'Marksman Rifle SVD',
    type: 'sniper',
    description: 'Designated marksman rifle with optic pre-attached.',
    params: {
      muzzleVelocityMps: 830,
      massKg: 0.0096,
      diameterM: 0.0076,
      dragFactor: 0.000019,
      defaultOptic: 'scope-8x',
      recoilRecoveryMs: 200,
    },
    unlocked: true,
  },
  {
    id: 'sniper-bolt',
    name: 'Bolt Action M24',
    type: 'sniper',
    description: 'Classic bolt-action sniper rifle. High precision.',
    params: {
      muzzleVelocityMps: 790,
      massKg: 0.0109,
      diameterM: 0.0078,
      dragFactor: 0.000018,
      defaultOptic: 'scope-12x',
      recoilRecoveryMs: 250,
    },
    unlocked: true,
  },
  {
    id: 'sniper-heavy',
    name: 'Heavy Sniper .50',
    type: 'sniper',
    description: 'Anti-materiel rifle. Massive power, extreme drop.',
    params: {
      muzzleVelocityMps: 850,
      massKg: 0.045,
      diameterM: 0.0127,
      dragFactor: 0.000015,
      defaultOptic: 'scope-12x',
      recoilRecoveryMs: 400,
    },
    unlocked: true,
  },

  // Shotguns (for close-range fun)
  {
    id: 'shotgun-pump',
    name: 'Pump Action 12G',
    type: 'shotgun',
    description: 'Close-range shotgun with wide spread.',
    params: {
      muzzleVelocityMps: 400,
      massKg: 0.035,  // Heavier slug
      diameterM: 0.0185,
      dragFactor: 0.00008,
      defaultOptic: 'iron-sights',
      recoilRecoveryMs: 350,
    },
    unlocked: true,
  },
];

// Helper: Get weapon by ID
export function getWeaponById(id: string): Weapon | undefined {
  return WEAPONS_CATALOG.find((w) => w.id === id);
}

// Helper: Get weapons by type
export function getWeaponsByType(type: WeaponType): Weapon[] {
  return WEAPONS_CATALOG.filter((w) => w.type === type);
}

// Helper: Get all unlocked weapons
export function getUnlockedWeapons(): Weapon[] {
  return WEAPONS_CATALOG.filter((w) => w.unlocked);
}

// Default weapon for new players
export const DEFAULT_WEAPON_ID = 'pistol-training';

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
  precisionMoaAt100: number;     // 3-shot group precision at 100 yards in MOA (lower = more accurate)
  // Shotgun-specific parameters
  pelletCount?: number;          // Number of pellets for shotgun (default: 12)
  spreadMils?: number;           // Base spread diameter in MILs for shotgun (default: 25)
  choke?: 'cylinder' | 'improved-cylinder' | 'modified' | 'improved-modified' | 'full'; // Shotgun choke (default: cylinder)
  recoilScale?: number;         // Recoil intensity multiplier for shotguns (default: 1.0)
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
      precisionMoaAt100: 3.0,
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
      precisionMoaAt100: 1.5,
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
      precisionMoaAt100: 4.0,
    },
    unlocked: true,
  },
  {
    id: 'pistol-viper',
    name: 'Viper VX-9',
    type: 'pistol',
    description: 'Compact tactical pistol optimized for close-range engagement. Fast recoil recovery.',
    params: {
      muzzleVelocityMps: 380,
      massKg: 0.009,
      diameterM: 0.009,
      dragFactor: 0.000028,
      defaultOptic: 'red-dot',
      recoilRecoveryMs: 120,
      precisionMoaAt100: 2.5,
    },
    unlocked: true,
  },
  {
    id: 'pistol-phantom',
    name: 'Phantom P-45',
    type: 'pistol',
    description: 'Full-size service pistol with strong recoil and stable platform for follow-up shots.',
    params: {
      muzzleVelocityMps: 320,
      massKg: 0.012,
      diameterM: 0.011,
      dragFactor: 0.000032,
      defaultOptic: 'red-dot',
      recoilRecoveryMs: 250,
      precisionMoaAt100: 2.0,
    },
    unlocked: true,
  },
  {
    id: 'pistol-eclipse',
    name: 'Eclipse E-22',
    type: 'pistol',
    description: 'Match-grade precision pistol with exceptional accuracy and minimal drag.',
    params: {
      muzzleVelocityMps: 420,
      massKg: 0.0075,
      diameterM: 0.0055,
      dragFactor: 0.000018,
      defaultOptic: 'red-dot',
      recoilRecoveryMs: 180,
      precisionMoaAt100: 0.8,
    },
    unlocked: true,
  },

  // Rifles,
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
      precisionMoaAt100: 2.5,
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
      precisionMoaAt100: 2.0,
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
      precisionMoaAt100: 2.5,
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
      precisionMoaAt100: 1.5,
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
      precisionMoaAt100: 1.0,
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
      precisionMoaAt100: 1.5,
    },
    unlocked: true,
  },

  // ELR (Extended Long Range) Rifles
  {
    id: 'dmr-precision',
    name: 'Precision DMR MK-II',
    type: 'rifle',
    description: 'Designated marksman rifle. High velocity, tight groups.',
    params: {
      muzzleVelocityMps: 940,
      massKg: 0.0097,
      diameterM: 0.0076,
      dragFactor: 0.000016,
      defaultOptic: 'scope-8x',
      recoilRecoveryMs: 180,
      precisionMoaAt100: 0.75,  // Very tight for DMR
    },
    unlocked: true,
  },
  {
    id: 'elr-sniper',
    name: 'ELR Sniper Horizon',
    type: 'sniper',
    description: 'Supreme long-range rifle. Built for 1500m+ engagements.',
    params: {
      muzzleVelocityMps: 1020,
      massKg: 0.0105,
      diameterM: 0.0080,
      dragFactor: 0.000014,  // Very low drag for long range
      defaultOptic: 'scope-12x',
      recoilRecoveryMs: 280,
      precisionMoaAt100: 0.6,  // Extremely tight
    },
    unlocked: true,
  },
  {
    id: 'dmr-heavy-magnum',
    name: 'Magnum DMR Tyrant',
    type: 'rifle',
    description: 'Heavy magnum cartridge. Resists wind at extreme ranges.',
    params: {
      muzzleVelocityMps: 880,
      massKg: 0.0125,
      diameterM: 0.0085,
      dragFactor: 0.000017,
      defaultOptic: 'scope-12x',
      recoilRecoveryMs: 320,
      precisionMoaAt100: 0.9,
    },
    unlocked: true,
  },

  // Shotguns (for close-range fun)
  {
    id: 'shotgun-pump',
    name: 'Pump Action 12G',
    type: 'shotgun',
    description: 'Classic pump action with wide spread. Great for moving targets.',
    params: {
      muzzleVelocityMps: 400,
      massKg: 0.035,
      diameterM: 0.0185,
      dragFactor: 0.00008,
      defaultOptic: 'iron-sights',
      recoilRecoveryMs: 350,
      precisionMoaAt100: 10.0,
      pelletCount: 12,
      spreadMils: 28,
      choke: 'cylinder',
      recoilScale: 1.0,
    },
    unlocked: true,
  },
  {
    id: 'shotgun-semi',
    name: 'Semi-Auto 12G',
    type: 'shotgun',
    description: 'Fast semi-auto with tighter pattern and manageable recoil.',
    params: {
      muzzleVelocityMps: 420,
      massKg: 0.032,
      diameterM: 0.0185,
      dragFactor: 0.000075,
      defaultOptic: 'iron-sights',
      recoilRecoveryMs: 200,  // Faster recovery for rapid shooting
      precisionMoaAt100: 9.0,
      pelletCount: 10,
      spreadMils: 22,
      choke: 'improved-cylinder',
      recoilScale: 0.85,
    },
    unlocked: true,
  },
  {
    id: 'shotgun-skeet',
    name: 'Skeet Master 20G',
    description: 'Lightweight 20-gauge with tight pattern. Ideal for clays.',
    type: 'shotgun',
    params: {
      muzzleVelocityMps: 380,
      massKg: 0.025,  // Lighter pellets, less recoil
      diameterM: 0.015,  // Smaller diameter
      dragFactor: 0.00007,
      defaultOptic: 'iron-sights',
      recoilRecoveryMs: 150,
      precisionMoaAt100: 8.0,
      pelletCount: 8,
      spreadMils: 18,
      choke: 'modified',
      recoilScale: 0.65,  // Much lower recoil
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

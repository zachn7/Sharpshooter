/**
 * Cosmetic Unlock System
 * 
 * Manages Reticle skins and other visual-only cosmetics.
 * Cosmetics are unlocked by completing level packs.
 * Purely visual, no gameplay advantage.
 */

export type ReticleType = 
  | 'default'          // Simple crosshair
  | 'tactical'         // Tactical cross with dots
  | 'bullseye'         // Bullseye circle
  | 'target'           // Target ring system
  | 'sniperscope'      // Sniper scope reticle
  | 'competition'      // Competition style
  | 'hunting'          // Hunting style
  | 'military'         // Military style
  | 'tactical-dots'    // Tactical dot system
  | 'crosshair'        // Simple cross
  | 'circle'           // Circle only
  | 'duplex'           // Duplex style
  | 'bdc'             // BDC (Bullet Drop Compensator) style
  | 'holo'            // Holographic style
  | 'acog'            // ACOG style
  | 'red-dot';        // Simple red dot

export interface ReticleSkin {
  id: string;
  name: string;
  description: string;
  type: ReticleType;
  // Unlock requirements
  requiredPackId?: string;  // Pack ID that must be completed to unlock
  minLevelId?: string;      // Specific level that must be completed (alternative to packId)
  // Visual properties (for rendering)
  colors?: {
    primary: string;        // Main color
    secondary?: string;     // Accent color
  };
  lineWidth?: number;      // Line thickness scale
  size?: number;            // Size scale
}

export interface CosmeticUnlocks {
  // Map of cosmetic ID to unlocked status
  reticleSkins: Record<string, boolean>;
  selectedReticleId: string; // Currently selected reticle
}

// All reticle skins
export const RETICLE_SKINS: ReticleSkin[] = [
  // Default (always available)
  {
    id: 'reticle-default',
    name: 'Default',
    description: 'Simple crosshair reticle',
    type: 'default',
    colors: { primary: '#ffffff', secondary: '#000000' },
  },
  {
    id: 'reticle-crosshair',
    name: 'Crosshair',
    description: 'Classic crosshair',
    type: 'crosshair',
    colors: { primary: '#ff0000', secondary: '#000000' },
  },
  
  // Pistols Pack cosmetics
  {
    id: 'reticle-tactical',
    name: 'Tactical Cross',
    description: 'Tactical crosshair with aiming dots',
    type: 'tactical',
    requiredPackId: 'pistols',
    colors: { primary: '#ffff00', secondary: '#ffffff' },
    lineWidth: 1.2,
  },
  
  // Rifle Basics cosmetics
  {
    id: 'reticle-target',
    name: 'Target Rings',
    description: 'Target-style ring reticle',
    type: 'target',
    requiredPackId: 'rifle-basics',
    colors: { primary: '#00ff00', secondary: '#006600' },
  },
  {
    id: 'reticle-acog',
    name: 'ACOG Style',
    description: 'ACOG-style tactical reticle',
    type: 'acog',
    requiredPackId: 'rifle-basics',
    colors: { primary: '#ff6600', secondary: '#000000' },
  },
  {
    id: 'reticle-holo',
    name: 'Holographic',
    description: 'Holographic red dot style',
    type: 'holo',
    requiredPackId: 'rifle-basics',
    colors: { primary: '#ff3333', secondary: '#990000' },
  },
  
  // Shotguns Pack cosmetics
  {
    id: 'reticle-bullseye',
    name: 'Bullseye',
    description: 'Bullseye circle reticle',
    type: 'bullseye',
    requiredPackId: 'shotguns-pack',
    colors: { primary: '#ff1493', secondary: '#ffffff' },
  },
  {
    id: 'reticle-circle',
    name: 'Circle',
    description: 'Simple circle reticle',
    type: 'circle',
    requiredPackId: 'shotguns-pack',
    colors: { primary: '#00ccff', secondary: '#000000' },
  },
  {
    id: 'reticle-red-dot',
    name: 'Red Dot',
    description: 'Simple red dot reticle',
    type: 'red-dot',
    requiredPackId: 'shotguns-pack',
    colors: { primary: '#ff0000', secondary: '#000000' },
  },
  
  // ELR Pack cosmetics
  {
    id: 'reticle-sniperscope',
    name: 'Sniper Scope',
    description: 'Full sniper scope reticle',
    type: 'sniperscope',
    requiredPackId: 'elr-pack',
    colors: { primary: '#ff0000', secondary: '#660000' },
    lineWidth: 1.5,
    size: 1.2,
  },
  {
    id: 'reticle-competition',
    name: 'Competition',
    description: 'Competition-style precision reticle',
    type: 'competition',
    requiredPackId: 'elr-pack',
    colors: { primary: '#ffffff', secondary: '#000000' },
    lineWidth: 0.8,
  },
  {
    id: 'reticle-bdc',
    name: 'Bullet Drop Compensator',
    description: 'BDC reticle with drop markers',
    type: 'bdc',
    requiredPackId: 'elr-pack',
    colors: { primary: '#ffcc00', secondary: '#000000' },
  },
];

/**
 * Get a reticle skin by ID
 */
export function getReticleSkin(id: string): ReticleSkin | undefined {
  return RETICLE_SKINS.find((skin) => skin.id === id);
}

/**
 * Check if a reticle skin is unlocked based on completed packs
 * @param skinId - Reticle skin ID
 * @param completedPackIds - Array of pack IDs that have been completed
 */
export function isReticleSkinUnlocked(
  skinId: string,
  completedPackIds: string[]
): boolean {
  const skin = getReticleSkin(skinId);
  if (!skin) return false;

  // No requirements = always unlocked
  if (!skin.requiredPackId && !skin.minLevelId) return true;

  // Check pack requirement
  if (skin.requiredPackId) {
    return completedPackIds.includes(skin.requiredPackId);
  }

  // TODO: Add minLevelId support if needed
  return true;
}

/**
 * Get all available reticle skins with unlock status
 * @param completedPackIds - Array of pack IDs that have been completed
 */
export function getAvailableReticleSkins(completedPackIds: string[]): Array<
  ReticleSkin & { unlocked: boolean }
> {
  return RETICLE_SKINS.map((skin) => ({
    ...skin,
    unlocked: isReticleSkinUnlocked(skin.id, completedPackIds),
  }));
}

/**
 * Get reticle skins by pack ID (cosmetics in a pack)
 * @param packId - Pack ID
 */
export function getReticleSkinsByPack(packId: string): ReticleSkin[] {
  return RETICLE_SKINS.filter((skin) => skin.requiredPackId === packId);
}

/**
 * Check if a pack has any cosmetics
 * @param packId - Pack ID
 */
export function packHasCosmetics(packId: string): boolean {
  return getReticleSkinsByPack(packId).length > 0;
}

/**
 * Default cosmetic unlocks for new players
 */
export const DEFAULT_COSMETIC_UNLOCKS: CosmeticUnlocks = {
  reticleSkins: {
    'reticle-default': true,
  },
  selectedReticleId: 'reticle-default',
};

import { getAmmoByWeaponType } from '../data/ammo';
import type { Weapon } from '../data/weapons';
import type { AmmoVariant } from '../data/ammo';
import type { RealismPreset } from '../storage';

/**
 * Final aggregated shot parameters
 * Combines weapon base params + ammo modifiers + realism preset scaling
 */
export interface FinalShotParams {
  // Velocity parameters
  muzzleVelocityMps: number;
  
  // Drag parameters (BC proxy)
  dragFactor: number;
  
  // Precision parameters
  dispersionGroupSizeM: number;  // 3-shot group size in meters at 100 yards
  
  // Recoil parameters
  recoilImpulseMils: number;   // Max recoil displacement in MILs
  
  // Metadata
  weapon: Weapon;
  ammo: AmmoVariant | null;
}

/**
 * Compute final shot parameters by aggregating weapon + ammo + settings
 * 
 * @param weapon - Base weapon configuration
 * @param ammo - Ammo variant (optional, falls back to match grade)
 * @param realismPreset - Realism preset for global scaling
 * @returns Aggregated shot parameters
 */
export function computeFinalShotParams(
  weapon: Weapon,
  ammo: AmmoVariant | null,
  realismPreset: RealismPreset
): FinalShotParams {
  // If no ammo provided, try to find match grade for this weapon type
  const effectiveAmmo = ammo || getAmmoByName(weapon.type, 'Match Grade');
  
  // Apply realism preset scaling to drag
  const dragPresetScale = getRealismDragScale(realismPreset);
  
  // Aggregate muzzle velocity
  const muzzleVelocityMps = weapon.params.muzzleVelocityMps * 
    (effectiveAmmo?.muzzleVelocityScale || 1.0);
  
  // Aggregate drag factor (weapon * ammo * realism preset)
  const dragFactor = weapon.params.dragFactor * 
    (effectiveAmmo?.dragScale || 1.0) * 
    dragPresetScale;
  
  // Aggregate precision (weapon MOA * ammo scale)
  const precisionMoaAt100 = weapon.params.precisionMoaAt100 * 
    (effectiveAmmo?.dispersionScale || 1.0);
  
  // Convert MOA to group size in meters at 100 yards (91.44 meters)
  const dispersionGroupSizeM = (precisionMoaAt100 / 60) * 91.44;
  
  // Compute recoil impulse (weapon-specific, scaled by ammo)
  const recoilImpulseMils = computeBaseRecoil(weapon.type, realismPreset) * 
    (effectiveAmmo?.recoilScale || 1.0);
  
  return {
    muzzleVelocityMps,
    dragFactor,
    dispersionGroupSizeM,
    recoilImpulseMils,
    weapon,
    ammo: effectiveAmmo || null,
  };
}

/**
 * Get realism preset drag scaling factor
 */
function getRealismDragScale(preset: RealismPreset): number {
  switch (preset) {
    case 'arcade':
      return 0.5;
    case 'expert':
      return 1.2;
    case 'realistic':
    default:
      return 1.0;
  }
}

/**
 * Compute base recoil impulse for weapon type and preset
 * Values in MILs at target (visual displacement)
 */
function computeBaseRecoil(weaponType: string, preset: RealismPreset): number {
  const baseRecoil: Record<string, number> = {
    pistol: 2.0,
    rifle: 3.0,
    sniper: 4.0,
    shotgun: 5.0,
  };
  
  const presetScale: Record<RealismPreset, number> = {
    arcade: 0.5,
    realistic: 1.0,
    expert: 1.3,
  };
  
  return (baseRecoil[weaponType] || 2.0) * presetScale[preset];
}

/**
 * Helper to find ammo by name within weapon type
 * Used for fallback to match grade
 */
function getAmmoByName(weaponType: string, name: string): AmmoVariant | null {
  const ammos = getAmmoByWeaponType(weaponType);
  return ammos.find(a => a.name.includes(name)) || ammos[0] || null;
}

/**
 * Format ammo summary for UI display
 * Shows velocity and dispersion effects
 */
export function formatAmmoSummary(ammo: AmmoVariant): string {
  const velocityEffect = ammo.muzzleVelocityScale > 1.0 ? '+' :
    ammo.muzzleVelocityScale < 1.0 ? '−' : '=';
  const dispersionEffect = ammo.dispersionScale < 1.0 ? '↑' :
    ammo.dispersionScale > 1.0 ? '↓' : '=';
  
  return `Vel: ${velocityEffect} ${Math.round(ammo.muzzleVelocityScale * 100)}%, Dispersion: ${dispersionEffect}`;
}
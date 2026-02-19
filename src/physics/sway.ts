/**
 * Aim stability (sway) and recoil recovery modeling
 * 
 * Implements reticle sway (continuous hand movement) and recoil kick
 * with exponential decay, scaled by realism preset and weapon class.
 */

import type { RealismPreset } from '../storage';
import type { WeaponType } from '../data/weapons';

export interface SwayOffset {
  y: number; // Vertical sway (up positive)
  z: number; // Horizontal sway (right positive)
}

export interface RecoilState {
  offsetY: number; // Vertical recoil offset (up positive)
  offsetZ: number; // Horizontal recoil offset (right positive)
  decayRate: number; // How fast recoil recovers (per second)
}

/**
 * Sway multiplier by weapon type
 * Smaller weapons sway more, heavy weapons are more stable
 */
const SWAY_MULTIPLIERS: Record<WeaponType, number> = {
  pistol: 1.2,     // Pistols are hard to hold steady
  rifle: 1.0,      // Standard rifles
  sniper: 0.6,     // Sniper rifles are heavy and stable
  shotgun: 1.5,    // Shotguns have significant sway
};

/**
 * Base sway amplitude by realism preset (in MILs at the target)
 */
const BASE_SWAY_AMPLITUDE: Record<RealismPreset, number> = {
  arcade: 0.1,      // Minimal sway, easy aiming
  realistic: 0.3,   // Realistic hand movement
  expert: 0.6,      // Challenging sway
};

/**
 * Sway frequency by realism preset (Hz - oscillations per second)
 */
const SWAY_FREQUENCY: Record<RealismPreset, number> = {
  arcade: 0.3,      // Slow, gentle sway
  realistic: 0.5,   // Natural breathing/hand movement
  expert: 0.8,      // Fast, jittery movement
};

/**
 * Sway complexity - multiple sine wave frequencies
 * Different axes use different frequencies for more natural movement
 */
const SWAY_FREQ_MULTIPLIERS = {
  y: [1.0, 2.3, 0.7],  // Vertical frequencies
  z: [1.7, 0.9, 3.1],  // Horizontal frequencies
} as const;

/**
 * Calculate current sway offset at given time
 * Uses multiple sine waves with different frequencies for natural movement
 * 
 * @param timeS - Time in seconds (e.g., from performance.now())
 * @param preset - Realism preset
 * @param weaponType - Weapon type
 * @param magnification - Current optic magnification (higher mag = more visible sway)
 * @returns { y, z } sway offsets in MILs at target distance
 */
export function calculateSwayOffset(
  timeS: number,
  preset: RealismPreset,
  weaponType: WeaponType,
  magnification: number = 1
): SwayOffset {
  const baseAmplitude = BASE_SWAY_AMPLITUDE[preset];
  const weaponMultiplier = SWAY_MULTIPLIERS[weaponType];
  const baseFreq = SWAY_FREQUENCY[preset];
  
  // Scale amplitude by magnification (high mag makes small movements appear larger)
  const effectiveAmplitude = baseAmplitude * weaponMultiplier * Math.sqrt(magnification);
  
  // Calculate vertical sway using 3 different sine waves
  let y = 0;
  for (let i = 0; i < SWAY_FREQ_MULTIPLIERS.y.length; i++) {
    const freq = baseFreq * SWAY_FREQ_MULTIPLIERS.y[i];
    y += Math.sin(2 * Math.PI * freq * timeS) * (1 / SWAY_FREQ_MULTIPLIERS.y.length);
  }
  y *= effectiveAmplitude;
  
  // Calculate horizontal sway using 3 different sine waves
  let z = 0;
  for (let i = 0; i < SWAY_FREQ_MULTIPLIERS.z.length; i++) {
    const freq = baseFreq * SWAY_FREQ_MULTIPLIERS.z[i];
    z += Math.sin(2 * Math.PI * freq * timeS + i) * (1 / SWAY_FREQ_MULTIPLIERS.z.length);
  }
  z *= effectiveAmplitude;
  
  return { y, z };
}

/**
 * Calculate initial recoil impulse after firing
 * Returns the offset and decay rate
 * 
 * @param preset - Realism preset
 * @param weaponType - Weapon type
 * @param customAmplitudeMils - Optional custom amplitude (from ammo modifiers)
 * @returns Recoil state with initial offset and decay rate
 */
export function calculateRecoilImpulse(
  preset: RealismPreset,
  weaponType: WeaponType,
  customAmplitudeMils?: number
): RecoilState {
  // Base recoil amplitude in MILs
  const RECOIL_AMPLITUDE: Record<RealismPreset, Record<WeaponType, number>> = {
    arcade: {
      pistol: 0.5,
      rifle: 0.8,
      sniper: 1.0,
      shotgun: 2.0,
    },
    realistic: {
      pistol: 1.5,
      rifle: 2.0,
      sniper: 2.5,
      shotgun: 4.0,
    },
    expert: {
      pistol: 3.0,
      rifle: 4.0,
      sniper: 5.0,
      shotgun: 8.0,
    },
  };
  
  // Recoil decay rate (per second, higher = faster recovery)
  const RECOIL_DECAY_RATE: Record<RealismPreset, number> = {
    arcade: 8.0,   // Quick recovery
    realistic: 4.0, // Moderate recovery
    expert: 2.0,    // Slow recovery
  };
  
  let amplitude = RECOIL_AMPLITUDE[preset][weaponType];
  const decayRate = RECOIL_DECAY_RATE[preset];
  
  // Apply custom amplitude from ammo modifiers if provided
  if (customAmplitudeMils !== undefined) {
    amplitude = customAmplitudeMils;
  }
  
  // Recoil kicks up and mostly upward (vertical component larger)
  return {
    offsetY: amplitude,           // Main vertical kick
    offsetZ: amplitude * 0.3,     // Smaller horizontal drift
    decayRate,
  };
}

/**
 * Update recoil offset with exponential decay over time
 * 
 * @param state - Current recoil state
 * @param dtS - Time delta in seconds since last update
 * @returns Updated recoil offsets
 */
export function updateRecoilDecay(state: RecoilState, dtS: number): SwayOffset {
  // Exponential decay: new = old * e^(-decayRate * dt)
  const decayFactor = Math.exp(-state.decayRate * dtS);
  
  return {
    y: state.offsetY * decayFactor,
    z: state.offsetZ * decayFactor,
  };
}

/**
 * Combine sway and recoil offsets
 * 
 * @param sway - Current sway offset
 * @param recoil - Current recoil offset
 * @returns Combined offset
 */
export function combineOffsets(sway: SwayOffset, recoil: SwayOffset): SwayOffset {
  return {
    y: sway.y + recoil.y,
    z: sway.z + recoil.z,
  };
}

/**
 * Check if test mode is enabled via URL parameter or environment
 * Used to disable sway/recoil for deterministic E2E testing
 * 
 * @param urlParams - URLSearchParams object
 * @returns true if test mode is active
 */
export function isTestModeEnabled(urlParams: URLSearchParams): boolean {
  // Check URL parameter first
  const testMode = urlParams.get('testMode');
  if (testMode === '1' || testMode === 'true') {
    return true;
  }
  
  // Check environment variable (for testing environments)
  if (import.meta.env?.VITE_TEST_MODE === '1' || import.meta.env?.VITE_TEST_MODE === 'true') {
    return true;
  }
  
  return false;
}

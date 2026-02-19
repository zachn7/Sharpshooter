/**
 * Expert Sim Extras - Spin Drift and Coriolis Effects
 * 
 * These are simplified approximations for gameplay purposes.
 * They are NOT intended for real-world ballistics calculations.
 * 
 * All effects are clearly labeled as simulation extras ("sim extras") in the UI
 * to prevent users from treating them as accurate real-world guidance.
 */

/**
 * Result of expert effects calculation
 */
export interface ExpertEffectsResult {
  dY_M: number;  // Horizontal deflection in meters (positive = right)
  dZ_M: number;  // Vertical deflection in meters (positive = up)
}

/**
 * Parameters for expert effects calculation
 */
export interface ExpertEffectsParams {
  timeOfFlightS: number;    // Time of flight in seconds
  headingDegrees: number;   // Shooting direction (0-360°, 0=North, 90=East)
  latitudeDegrees: number;  // Shooting latitude in degrees (default 45°)
}

/**
 * Calculate spin drift effect
 * 
 * Spin drift is the slight rightward curve caused by the bullet's rotation.
 * Right-handed rifling causes bullets to drift to the right as they travel.
 * 
 * Simplified approximation: Drift scales with time-of-flight squared.
 * 
 * Formula: dY ≈ k_spin * t^2
 * where k_spin depends on bullet velocity, rifling twist rate, etc.
 * 
 * For gameplay, we use a simplified coefficient that gives noticeable but
 * reasonable deflection at long ranges.
 * 
 * @param params - Expert effects parameters
 * @returns Horizontal drift in meters (positive = right)
 */
export function calculateSpinDrift(params: ExpertEffectsParams): number {
  const { timeOfFlightS } = params;
  
  // Simplified spin drift coefficient
  // This is a gameplay approximation, not a real physics model
  // Adjusted to give ~0.1m (4 mils) drift at 300m with ~1s TOF
  const K_SPIN = 0.12; // meters per second squared (gameplay coefficient)
  
  // Spin drift increases with time of flight squared
  const drift = K_SPIN * timeOfFlightS * timeOfFlightS;
  
  // Clamp to reasonable gameplay range (max 0.25m = ~10 mil at 100m)
  return Math.min(drift, 0.25);
}

/**
 * Calculate Coriolis effect
 * 
 * The Coriolis effect arises from Earth's rotation. It causes apparent
 * deflections in moving objects viewed from a rotating reference frame.
 * 
 * For shooting, there are two components:
 * 1. Horizontal Coriolis: Deflection depends on shooting direction and latitude
 * 2. Vertical Coriolis (Eötvös): Deflection depends on heading and latitude
 * 
 * Simplified approximations (gameplay coefficients):
 * - Horizontal: dY ≈ k_coriolis_h * TOF * cos(latitude) * sin(heading)
 * - Vertical: dZ ≈ k_coriolis_v * TOF * cos(heading) * cos(latitude)
 * 
 * @param params - Expert effects parameters
 * @returns deflections in meters (dY horizontal, dZ vertical)
 */
export function calculateCoriolis(params: ExpertEffectsParams): { dY: number; dZ: number } {
  const { timeOfFlightS, headingDegrees, latitudeDegrees } = params;
  
  // Convert to radians
  const headingRad = (headingDegrees * Math.PI) / 180;
  const latRad = (latitudeDegrees * Math.PI) / 180;
  
  // Simplified Coriolis coefficients for gameplay
  // These are tuned for noticeable but playable effects
  const K_CORIOLIS_H = 0.03; // Horizontal coefficient
  const K_CORIOLIS_V = 0.015; // Vertical coefficient
  
  // Horizontal Coriolis: depends on heading (north-south component) and latitude
  // For north-south shooting, effect is proportional to sin(latitude)
  // Shooting North (0°): deflection to right (positive) in Northern Hemisphere
  // Shooting South (180°): deflection to left (negative) in Northern Hemisphere
  // cos(heading) gives -1 for South, +1 for North, 0 for East/West
  const horizontalCoriolis = K_CORIOLIS_H * timeOfFlightS * Math.sin(latRad) * Math.cos(headingRad);
  
  // Vertical Coriolis (Eötvös effect): depends on heading (east-west component) and latitude
  // Effect is proportional to cos(latitude)
  // Shooting East (90°): deflection up (positive)
  // Shooting West (270°): deflection down (negative)
  // sin(heading) gives +1 for East, -1 for West, 0 for North/South
  const verticalCoriolis = K_CORIOLIS_V * timeOfFlightS * Math.sin(headingRad) * Math.cos(latRad);
  
  // Clamp to reasonable gameplay ranges
  return {
    dY: Math.max(Math.min(horizontalCoriolis, 0.2), -0.2),
    dZ: Math.max(Math.min(verticalCoriolis, 0.1), -0.1),
  };
}

/**
 * Calculate all expert effects (spin drift + Coriolis)
 * 
 * Combines spin drift and Coriolis into a single result.
 * 
 * @param params - Expert effects parameters
 * @param spinDriftEnabled - Whether spin drift is enabled
 * @param coriolisEnabled - Whether Coriolis is enabled
 * @returns Combined deflections in meters
 */
export function calculateExpertEffects(
  params: ExpertEffectsParams,
  spinDriftEnabled: boolean = false,
  coriolisEnabled: boolean = false
): ExpertEffectsResult {
  // Start with no deflection
  let dY_M = 0; // Horizontal
  let dZ_M = 0; // Vertical
  
  // Add spin drift (horizontal right)
  if (spinDriftEnabled) {
    dY_M += calculateSpinDrift(params);
  }
  
  // Add Coriolis (both horizontal and vertical)
  if (coriolisEnabled) {
    const coriolis = calculateCoriolis(params);
    dY_M += coriolis.dY;
    dZ_M += coriolis.dZ;
  }
  
  return { dY_M, dZ_M };
}

/**
 * Check if any expert extras are enabled
 */
export function hasExpertExtras(): boolean {
  try {
    const settings = window?.localStorage?.getItem('sharpshooter_save');
    if (!settings) return false;
    
    const save = JSON.parse(settings);
    return (
      save.settings?.expertSpinDriftEnabled ||
      save.settings?.expertCoriolisEnabled
    );
  } catch {
    return false;
  }
}

/**
 * Get description of enabled expert extras for display
 */
export function getExpertExtrasDescription(): string[] {
  const extras: string[] = [];
  
  try {
    const settings = window?.localStorage?.getItem('sharpshooter_save');
    if (!settings) return extras;
    
    const save = JSON.parse(settings);
    
    if (save.settings?.expertSpinDriftEnabled) {
      extras.push('Spin Drift');
    }
    
    if (save.settings?.expertCoriolisEnabled) {
      extras.push('Coriolis');
    }
  } catch {
    // Ignore errors
  }
  
  return extras;
}
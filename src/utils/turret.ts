/**
 * Turret dialing utilities
 * 
 * Turrets are adjusted in MIL clicks (typically 0.1 MIL per click)
 * Sign convention:
 * - Elevation: Positive = Up (impact higher), Negative = Down (impact lower)
 * - Windage: Positive = Right (impact right), Negative = Left (impact left)
 * 
 * At distance D meters, X MILs = D * 0.001 * X meters of adjustment
 */

/**
 * Quantize a value to a specific click size
 * @param value - The value to quantize
 * @param clickSize - The click size in MILs (default 0.1)
 * @returns Quantized value
 */
export function quantizeToClick(value: number, clickSize: number = 0.1): number {
  return Math.round(value / clickSize) * clickSize;
}

/**
 * Get the next click value in a direction
 * @param currentValue - Current dial value in MILs
 * @param direction - Direction to adjust (+1 or -1)
 * @param clickSize - The click size in MILs (default 0.1)
 * @returns Next click value
 */
export function nextClickValue(
  currentValue: number,
  direction: 1 | -1,
  clickSize: number = 0.1
): number {
  const quantized = quantizeToClick(currentValue, clickSize);
  const newValue = quantized + (direction * clickSize);
  return quantizeToClick(newValue, clickSize);
}

/**
 * Convert MILs to meters at a given distance
 * @param distanceM - Target distance in meters
 * @param mils - MIL value to convert
 * @returns Equivalent size in meters
 */
export function milsToMeters(distanceM: number, mils: number): number {
  return distanceM * 0.001 * mils;
}

/**
 * Convert meters to MILs at a given distance
 * @param distanceM - Target distance in meters
 * @param meters - Size in meters to convert
 * @returns Equivalent MIL value
 */
export function metersToMils(distanceM: number, meters: number): number {
  return meters / (distanceM * 0.001);
}

/**
 * Turret dial state
 */
export interface TurretState {
  elevationMils: number; // Positive = up, Negative = down
  windageMils: number;   // Positive = right, Negative = left
}

/**
 * Create default turret state
 */
export function createDefaultTurretState(): TurretState {
  return {
    elevationMils: 0.0,
    windageMils: 0.0,
  };
}

/**
 * Format turret values for display
 * @param state - Turret state
 * @returns Formatted string like "E: +0.0, W: -2.1"
 */
export function formatTurretState(state: TurretState): string {
  const elevationSign = state.elevationMils >= 0 ? '+' : '';
  const windageSign = state.windageMils >= 0 ? '+' : '';
  return `E: ${elevationSign}${state.elevationMils.toFixed(1)}, W: ${windageSign}${state.windageMils.toFixed(1)}`;
}

/**
 * Apply turret offset to aim values
 * @param aimY_M - Vertical aim in meters (relative to target center)
 * @param aimZ_M - Horizontal aim in meters (relative to target center)
 * @param turret - Turret state
 * @param distanceM - Target distance in meters
 * @returns Adjusted aim values
 */
export function applyTurretOffset(
  aimY_M: number,
  aimZ_M: number,
  turret: TurretState,
  distanceM: number
): { aimY_M: number; aimZ_M: number } {
  // Elevation adjusts vertical aim (Y axis)
  // Positive elevation = aim higher (positive Y offset)
  const elevationOffsetM = milsToMeters(distanceM, turret.elevationMils);
  const adjustedY = aimY_M + elevationOffsetM;

  // Windage adjusts horizontal aim (Z axis)
  // Positive windage = aim right (positive Z offset)
  const windageOffsetM = milsToMeters(distanceM, turret.windageMils);
  const adjustedZ = aimZ_M + windageOffsetM;

  return {
    aimY_M: adjustedY,
    aimZ_M: adjustedZ,
  };
}
/**
 * Reset turret state to zero
 */
export function resetTurretState(): TurretState {
  return createDefaultTurretState();
}

/**
 * Compute turret adjustment needed to correct an impact offset
 * @param offsetYMeters - Vertical offset from target center in meters (positive = impact high)
 * @param offsetZMeters - Horizontal offset from target center in meters (positive = impact right)
 * @param distanceM - Target distance in meters
 * @returns Turret adjustment in mils to correct the shot
 * 
 * Note: If shot is high (positive Y offset), we need to aim LOWER (negative elevation adjustment)
 * If shot is right (positive Z offset), we need to aim LEFT (negative windage adjustment)
 */
export function computeAdjustmentForOffset(
  offsetYMeters: number,
  offsetZMeters: number,
  distanceM: number
): TurretState {
  // Convert offset meters to mils first
  const elevationMils = metersToMils(distanceM, offsetYMeters);
  const windageMils = metersToMils(distanceM, offsetZMeters);

  // Apply correction: opposite direction of offset
  // Shot high (positive offset) → aim lower (negative adjustment)
  // Shot right (positive offset) → aim left (negative adjustment)
  return {
    elevationMils: -elevationMils,
    windageMils: -windageMils,
  };
}

/**
 * Quantize adjustment to specific click steps
 * @param adjustment - Adjustment in mils
 * @param clickSize - Click size in mils (default 0.1)
 * @returns Quantized adjustment in mils
 */
export function quantizeAdjustmentToClicks(
  adjustment: number,
  clickSize: number = 0.1
): number {
  return quantizeToClick(adjustment, clickSize);
}

/**
 * Result type for dial recommendation from shot offset
 */
export interface DialRecommendation {
  /**
   * Current impact offset in meters
   * - offsetY_M: positive = shot high (above target center)
   * - offsetZ_M: positive = shot right (to the right of target center)
   */
  offsetY_M: number;
  offsetZ_M: number;
  
  /**
   * Current impact offset in mils at target distance
   */
  offsetY_Mils: number;
  offsetZ_Mils: number;
  
  /**
   * Recommended elevation correction in mils
   * - Positive: aim HIGHER (dial UP)
   * - Negative: aim LOWER (dial DOWN)
   */
  elevDeltaMils: number;
  
  /**
   * Recommended windage correction in mils
   * - Positive: aim RIGHT (dial RIGHT)
   * - Negative: aim LEFT (dial LEFT)
   */
  windDeltaMils: number;
  
  /**
   * Recommended number of clicks on elevation turret
   * - Positive: dial UP (add clicks)
   * - Negative: dial DOWN (remove clicks)
   */
  elevClicks: number;
  
  /**
   * Recommended number of clicks on windage turret
   * - Positive: dial RIGHT (add clicks)
   * - Negative: dial LEFT (remove clicks)
   */
  windClicks: number;
  
  /**
   * Recommended hold in mils (same as correction values)
   * - Positive hold: move point-of-aim UP/RIGHT on reticle
   * - Negative hold: move point-of-aim DOWN/LEFT on reticle
   */
  holdElevationMils: number;
  holdWindageMils: number;
}

/**
 * Compute recommended dial/hold correction from shot offset
 * This is a pure function used by the Tutorial Coach overlay
 * 
 * @param distanceM - Target distance in meters
 * @param offsetY_M - Vertical offset from target center in meters (positive = shot high)
 * @param offsetZ_M - Horizontal offset from target center in meters (positive = shot right)
 * @param clickSizeMils - Click size in mils (default 0.1)
 * @returns Dial recommendation with quantized clicks and hold values
 * 
 * Example:
 * - At 500m, shot 0.25m high, 0.05m left
 * - Offset: +0.25m (high), -0.05m (left)
 * - Correction: aim LOWER (-0.5 mils), aim RIGHT (+0.1 mils)
 * - Elevation: -5 clicks DOWN (to compensate for high shot)
 * - Windage: +1 click RIGHT (to compensate for left shot)
 */
export function recommendDialFromOffset(
  distanceM: number,
  offsetY_M: number,
  offsetZ_M: number,
  clickSizeMils: number = 0.1
): DialRecommendation {
  // Convert offset to mils
  const offsetY_Mils = metersToMils(distanceM, offsetY_M);
  const offsetZ_Mils = metersToMils(distanceM, offsetZ_M);
  
  // Compute correction: opposite direction of offset
  // If shot is high (positive Y), aim lower (negative elevation)
  // If shot is left (negative Z), aim right (positive windage)
  const elevDeltaMils = -offsetY_Mils;
  const windDeltaMils = -offsetZ_Mils;
  
  // Quantize to clicks
  const quantizedElev = quantizeToClick(elevDeltaMils, clickSizeMils);
  const quantizedWind = quantizeToClick(windDeltaMils, clickSizeMils);
  const elevClicks = quantizedElev / clickSizeMils;
  const windClicks = quantizedWind / clickSizeMils;
  
  // Convert -0 to 0 to avoid -0 issues
  const elevClicksNormalized = elevClicks === 0 ? 0 : elevClicks;
  const windClicksNormalized = windClicks === 0 ? 0 : windClicks;
  
  // Normalize quantized values too
  const normalizedQuantizedElev = Object.is(quantizedElev, -0) ? 0 : quantizedElev;
  const normalizedQuantizedWind = Object.is(quantizedWind, -0) ? 0 : quantizedWind;
  
  // Hold recommendation (same as correction, mils from reticle center)
  const holdElevationMils = Object.is(elevDeltaMils, -0) ? 0 : elevDeltaMils;
  const holdWindageMils = Object.is(windDeltaMils, -0) ? 0 : windDeltaMils;
  
  return {
    offsetY_M,
    offsetZ_M,
    offsetY_Mils,
    offsetZ_Mils,
    elevDeltaMils: normalizedQuantizedElev,
    windDeltaMils: normalizedQuantizedWind,
    elevClicks: elevClicksNormalized,
    windClicks: windClicksNormalized,
    holdElevationMils,
    holdWindageMils,
  };
}
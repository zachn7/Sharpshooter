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
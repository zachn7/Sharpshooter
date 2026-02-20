/**
 * MIL (milliradian) reticle utilities
 * 1 MIL = 1 milliradian = 0.001 radians
 * 
 * MIL subtension at distance D (meters):
 * - 1 MIL subtends (D * 0.001) meters at distance D
 * - At 100m, 1 MIL = 0.1m (10cm)
 * - At 500m, 1 MIL = 0.5m (50cm)
 * 
 * MIL to MOA conversion (display-only, for readouts):
 * - 1 MIL ≈ 3.438 MOA
 * - 1 MOA ≈ 0.291 MIL
 */

/**
 * Conversion factor: MILs to MOA
 * 1 MIL = 3.43774677... MOA, rounded to 3.438 for display
 */
export const MIL_TO_MOA = 3.438;

/**
 * Conversion factor: MOA to MIL
 * 1 MOA = 0.290888... MIL, rounded to 0.291 for display
 */
export const MOA_TO_MIL = 0.291;

/**
 * Convert MILs to MOA (display-only)
 * @param mils - MIL value to convert
 * @returns Equivalent value in MOA
 */
export function milsToMoa(mils: number): number {
  return mils * MIL_TO_MOA;
}

/**
 * Convert MOA to MILs (display-only)
 * @param moa - MOA value to convert
 * @returns Equivalent value in MILs
 */
export function moaToMils(moa: number): number {
  return moa * MOA_TO_MIL;
}

/**
 * Convert MILs to meters at a given distance
 * @param distanceM - Target distance in meters
 * @param mils - MIL value to convert
 * @returns Equivalent size in meters
 */
export function milToMeters(distanceM: number, mils: number): number {
  return distanceM * 0.001 * mils;
}

/**
 * Convert meters to MILs at a given distance
 * @param distanceM - Target distance in meters
 * @param meters - Size in meters to convert
 * @returns Equivalent MIL value
 */
export function metersToMil(distanceM: number, meters: number): number {
  return meters / (distanceM * 0.001);
}

/**
 * Convert meters to pixels based on zoom level and canvas configuration
 * @param meters - Size in meters
 * @param pixelsPerMeter - How many pixels represent 1 meter at the target plane
 * @param magnification - Zoom level (1x, 4x, etc.)
 * @returns Equivalent size in pixels
 */
export function metersToPixels(
  meters: number,
  pixelsPerMeter: number,
  magnification: number
): number {
  return meters * pixelsPerMeter * magnification;
}

/**
 * Convert MILs to pixels at a given distance
 * Combines milToMeters and metersToPixels
 * @param distanceM - Target distance in meters
 * @param mils - MIL value to convert
 * @param pixelsPerMeter - How many pixels represent 1 meter at the target plane
 * @param magnification - Zoom level
 * @returns Equivalent size in pixels
 */
export function milsToPixels(
  distanceM: number,
  mils: number,
  pixelsPerMeter: number,
  magnification: number
): number {
  const meters = milToMeters(distanceM, mils);
  return metersToPixels(meters, pixelsPerMeter, magnification);
}

/**
 * Calculate pixels per meter based on world-to-canvas mapping
 * @param worldWidth - World width in meters
 * @param canvasWidth - Canvas width in pixels
 * @returns Pixels per meter at the target plane
 */
export function getPixelsPerMeter(worldWidth: number, canvasWidth: number): number {
  return canvasWidth / worldWidth;
}

/**
 * Calculate reticle spacing in pixels for given MIL spacing
 * @param distanceM - Target distance in meters
 * @param milSpacing - MIL spacing (e.g., 1 for major ticks, 0.5 for minor)
 * @param worldWidth - World width in meters
 * @param canvasWidth - Canvas width in pixels
 * @param magnification - Zoom level
 * @returns Pixel spacing for reticle ticks
 */
export function getMilSpacingPixels(
  distanceM: number,
  milSpacing: number,
  worldWidth: number,
  canvasWidth: number,
  magnification: number
): number {
  const pixelsPerMeter = getPixelsPerMeter(worldWidth, canvasWidth);
  return milsToPixels(distanceM, milSpacing, pixelsPerMeter, magnification);
}

/**
 * Fixed magnification levels for reticle
 */
export const MAGNIFICATION_LEVELS = [1, 4, 8] as const;
export type MagnificationLevel = typeof MAGNIFICATION_LEVELS[number];

/**
 * Get next magnification level (cycles back to beginning)
 */
export function getNextMagnification(current: MagnificationLevel): MagnificationLevel {
  const currentIndex = MAGNIFICATION_LEVELS.indexOf(current);
  const nextIndex = (currentIndex + 1) % MAGNIFICATION_LEVELS.length;
  return MAGNIFICATION_LEVELS[nextIndex];
}
/**
 * Frame-rate independent game loop utilities
 * 
 * Provides utilities for clamping delta-time and determining when
 * to use substeps for stability in game physics/updates.
 */

/**
 * Default maximum delta time (ms)
 * 
 * Clamps delta to this value to prevent large physics jumps after
 * tab switching or system lag (e.g., 50ms = 20fps minimum).
 */
export const DEFAULT_MAX_DELTA_MS = 50;

/**
 * Default substep threshold (ms)
 * 
 * When delta exceeds this, consider substepping updates for stability.
 * This is typically 2x the expected delta for 60fps (33ms = ~30fps).
 */
export const DEFAULT_SUBSTEP_THRESHOLD_MS = 33;

/**
 * Clamp delta time to reasonable limits
 * 
 * Prevents extremely large deltas (e.g., after tab switch) from causing
 * physics explosions, while also handling negative or zero deltas.
 *
 * @param dtMs - Raw delta time in milliseconds
 * @param maxDtMs - Maximum allowed delta (default: 50ms)
 * @returns Clamped delta time (0 to maxDtMs)
 *
 * @example
 * clampDelta(200, 50) // Returns 50 (clamped from 200ms)
 * clampDelta(16, 50)  // Returns 16 (within limits)
 * clampDelta(-10, 50) // Returns 0 (negative clamped to 0)
 */
export function clampDelta(dtMs: number, maxDtMs: number = DEFAULT_MAX_DELTA_MS): number {
  // Handle NaN and negative values
  if (Number.isNaN(dtMs) || dtMs < 0) {
    return 0;
  }
  
  // Handle Infinity by clamping to maximum
  if (!Number.isFinite(dtMs)) {
    return maxDtMs;
  }
  
  // Clamp to maximum
  return Math.min(dtMs, maxDtMs);
}

/**
 * Check if a delta time should use substepping
 * 
 * Substepping splits a large frame update into multiple smaller updates
 * for better physics stability. Useful when the frame rate drops below
 * a threshold (e.g., when tabbed out or on slow devices).
 *
 * @param dtMs - Delta time in milliseconds
 * @param thresholdMs - Threshold for substepping (default: 33ms)
 * @returns True if substepping should be used
 *
 * @example
 * shouldSubstep(16, 33) // Returns false (60fps, no substep needed)
 * shouldSubstep(50, 33) // Returns true (20fps, substep recommended)
 */
export function shouldSubstep(dtMs: number, thresholdMs: number = DEFAULT_SUBSTEP_THRESHOLD_MS): boolean {
  return dtMs > thresholdMs;
}

/**
 * Calculate substep count and size for delta time
 * 
 * When substepping is needed, this calculates how many steps to use
 * and the delta for each step. The number of steps is rounded up to
 * ensure the total time accounted for covers the full delta.
 *
 * @param dtMs - Delta time in milliseconds
 * @param maxStepMs - Maximum delta per step (default: 20ms)
 * @returns Object with stepCount and stepDtMs
 *
 * @example
 * calculateSubsteps(50, 20) // { stepCount: 3, stepDtMs: 16.67 }
 * calculateSubsteps(80, 20) // { stepCount: 4, stepDtMs: 20 }
 * calculateSubsteps(16, 20) // { stepCount: 1, stepDtMs: 16 }
 */
export function calculateSubsteps(
  dtMs: number,
  maxStepMs: number = 20
): { stepCount: number; stepDtMs: number } {
  // If delta is within single-step limit, don't substep
  if (dtMs <= maxStepMs) {
    return { stepCount: 1, stepDtMs: dtMs };
  }
  
  // Calculate number of steps (rounded up)
  const stepCount = Math.ceil(dtMs / maxStepMs);
  const stepDtMs = dtMs / stepCount;
  
  return { stepCount, stepDtMs };
}

/**
 * Timing metrics for game loop
 */
export interface GameLoopMetrics {
  /** Delta time for this frame (clamped, in milliseconds) */
  deltaMs: number;
  /** Delta time for this frame as a fraction of a second */
  deltaS: number;
  /** Total time since loop started (in milliseconds) */
  totalTimeMs: number;
  /** Current timestamp from requestAnimationFrame */
  timestampMs: number;
}
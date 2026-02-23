/**
 * Aim smoothing utilities.
 * 
 * Smooths pointer input using exponential moving average (EMA) to reduce jitter
 * and create a more controlled aiming feel. Useful for touch devices or when
 * precision is desired over responsiveness.
 */

// Default smoothing factor (0 = no smoothing, 1 = no change from previous)
const DEFAULT_SMOOTHING = 0.3;

// Maximum smoothing factor (very slow response)
const MAX_SMOOTHING = 1.0;

// Minimum smoothing factor (very responsive)
const MIN_SMOOTHING = 0.0;

/**
 * Apply exponential moving average smoothing to a value.
 * 
 * Formula: smoothed = previous + (current - previous) * factor
 * 
 * @param current The current value (new input)
 * @param previous The previously smoothed value
 * @param factor Smoothing factor (0-1). Lower = smoother, Higher = more responsive.
 *                0 = no change (previous), 1 = no smoothing (instant current)
 * @returns The smoothed value
 */
export function smoothValue(
  current: number,
  previous: number,
  factor: number = DEFAULT_SMOOTHING
): number {
  return previous + (current - previous) * factor;
}

/**
 * Apply smoothing to a 2D point.
 * 
 * @param current The current position {x, y}
 * @param previous The previously smoothed position {x, y}
 * @param factor Smoothing factor (0-1)
 * @returns The smoothed position {x, y}
 */
export function smoothPoint(
  current: { x: number; y: number },
  previous: { x: number; y: number },
  factor: number = DEFAULT_SMOOTHING
): { x: number; y: number } {
  return {
    x: smoothValue(current.x, previous.x, factor),
    y: smoothValue(current.y, previous.y, factor),
  };
}

/**
 * Clamps a value between min and max.
 */
export function clampFactor(factor: number): number {
  return Math.min(Math.max(factor, MIN_SMOOTHING), MAX_SMOOTHING);
}

/**
 * Smoothed reticle position manager.
 * Tracks the last smoothed position and applies smoothing on each update.
 */
export class AimSmoother {
  private lastPosition: { x: number; y: number } | null = null;
  private smoothingFactor: number;

  constructor(factor: number = DEFAULT_SMOOTHING) {
    this.smoothingFactor = clampFactor(factor);
  }

  /**
   * Update the smoothing factor.
   */
  setSmoothingFactor(factor: number): void {
    this.smoothingFactor = clampFactor(factor);
  }

  /**
   * Get the current smoothing factor.
   */
  getSmoothingFactor(): number {
    return this.smoothingFactor;
  }

  /**
   * Apply smoothing to a new position.
   * 
   * @param current The current position {x, y}
   * @returns The smoothed position {x, y}
   */
  update(current: { x: number; y: number }): { x: number; y: number } {
    if (this.lastPosition === null) {
      // First update, just use current
      this.lastPosition = { ...current };
      return current;
    }

    const smoothed = smoothPoint(current, this.lastPosition, this.smoothingFactor);
    this.lastPosition = smoothed;
    return smoothed;
  }

  /**
   * Reset the smoother (clears last position).
   */
  reset(): void {
    this.lastPosition = null;
  }
}

/**
 * Create an aim smoother with the given factor.
 */
export function createAimSmoother(factor: number = DEFAULT_SMOOTHING): AimSmoother {
  return new AimSmoother(factor);
}

/**
 * Validate a smoothing factor.
 * 
 * @returns true if factor is valid (between MIN_SMOOTHING and MAX_SMOOTHING)
 */
export function isValidSmoothingFactor(factor: number): boolean {
  return factor >= MIN_SMOOTHING && factor <= MAX_SMOOTHING;
}

/**
 * Get the recommended smoothing factor for a device/input type.
 */
export function getRecommendedSmoothing(isTouch: boolean, isMobile: boolean): number {
  if (isMobile && isTouch) {
    return 0.4; // More smoothing for touch on mobile
  }
  if (isTouch) {
    return 0.3; // Moderate smoothing for touch
  }
  return 0.2; // Less smoothing for mouse
}
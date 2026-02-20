/**
 * Press-and-hold repeat handler with ramp-up
 * Provides smooth repeat behavior for mobile controls
 */

export interface PressHoldConfig {
  /** Callback to fire on each repeat */
  onRepeat: () => void;
  /** Initial delay before first repeat (ms) */
  initialDelay: number;
  /** Delay between subsequent repeats (ms) */
  repeatDelay: number;
  /** Optional ramp-up to faster repeat (ms, duration to reach max speed) */
  rampUpDuration?: number;
  /** Minimum repeat delay after ramp-up (ms) */
  minRepeatDelay?: number;
  /** Debug callback for testing */
  onRepeatCount?: (count: number) => void;
}

export interface PressHoldHandler {
  /** Start repeating */
  start: () => void;
  /** Stop repeating */
  stop: () => void;
  /** Get current repeat count */
  getRepeatCount: () => number;
  /** Check if currently repeating */
  isRepeating: () => boolean;
  /**
   * Dispose of event listeners (if using attachPressHold)
   * Only available when attached via attachPressHold
   */
  dispose?: () => void;
}

/**
 * Create a press-and-hold repeat handler with optional ramp-up
 * @param config - Configuration for repeat behavior
 * @returns Handler object with start/stop methods
 */
export function createPressHoldHandler(config: PressHoldConfig): PressHoldHandler {
  const {
    onRepeat,
    initialDelay,
    repeatDelay,
    rampUpDuration,
    minRepeatDelay = repeatDelay,
    onRepeatCount,
  } = config;

  let timeoutId: number | null = null;
  let repeatCount = 0;
  let startTime: number | null = null;
  let active = false;

  const getDelay = (_currentCount: number): number => {
    if (!rampUpDuration || !startTime) {
      return repeatDelay;
    }

    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / rampUpDuration, 1);
    
    // Linear ramp from repeatDelay to minRepeatDelay
    const currentDelay = repeatDelay - (progress * (repeatDelay - minRepeatDelay));
    return Math.max(currentDelay, minRepeatDelay);
  };

  const executeRepeat = () => {
    repeatCount++;
    onRepeatCount?.(repeatCount);
    onRepeat();

    if (active) {
      const delay = getDelay(repeatCount);
      timeoutId = window.setTimeout(executeRepeat, delay);
    }
  };

  return {
    start: () => {
      if (active) return;
      
      active = true;
      repeatCount = 0;
      startTime = Date.now();
      
      // Wait for initial delay, then start repeating
      timeoutId = window.setTimeout(() => {
        if (active) {
          executeRepeat();
        }
      }, initialDelay);
    },
    
    stop: () => {
      active = false;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      startTime = null;
    },
    
    getRepeatCount: () => repeatCount,
    
    isRepeating: () => active,
  };
}

/**
 * Helper to attach press-and-hold to a DOM element
 * @param element - DOM element to attach to
 * @param config - PressHold configuration
 * @returns Handler object for manual control with dispose method
 */
export function attachPressHold(
  element: HTMLElement | null,
  config: PressHoldConfig
): PressHoldHandler | null {
  if (!element) return null;

  const handler = createPressHoldHandler(config);
  let lastPointerId = 0;

  const onPointerDown = (e: PointerEvent) => {
    lastPointerId = e.pointerId;
    if (e.pointerType === 'mouse' && e.button !== 0) return; // Only left mouse button
    element.setPointerCapture(e.pointerId);
    handler.start();
  };

  const onPointerUp = () => {
    handler.stop();
    try {
      element.releasePointerCapture(lastPointerId);
    } catch {
      // Ignore errors if capture was already released
    }
  };

  const onPointerLeave = () => {
    handler.stop();
  };

  const onPointerCancel = (e: PointerEvent) => {
    handler.stop();
    try {
      element.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore errors if capture was already released
    }
  };

  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('pointerup', onPointerUp);
  element.addEventListener('pointerleave', onPointerLeave);
  element.addEventListener('pointercancel', onPointerCancel);
  const preventContextMenu = (e: Event) => e.preventDefault();
  element.addEventListener('contextmenu', preventContextMenu); // Prevent context menu on long press

  // Return handler with dispose method
  return {
    ...handler,
    dispose: () => {
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('pointerleave', onPointerLeave);
      element.removeEventListener('pointercancel', onPointerCancel);
      element.removeEventListener('contextmenu', preventContextMenu);
      handler.stop();
    },
  };
}

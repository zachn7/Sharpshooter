/**
 * Visual effects hooks and state management
 * 
 * Provides hooks for muzzle flash, screen shake, and other transient effects.
 * All effects are time-based and respect accessibility settings.
 */

/**
 * Muzzle flash configuration
 */
export interface MuzzleFlashConfig {
  position: { x: number; y: number }; // World coordinates
  life: number; // Remaining life in seconds
  maxLife: number; // Total lifetime in seconds
}

/**
 * Screen shake configuration
 */
export interface ScreenShakeConfig {
  offsetX: number; // Current X offset in meters
  offsetY: number; // Current Y offset in meters
  intensity: number; // Shake intensity (meters)
  decay: number; // Decay per second
  life: number; // Remaining life in seconds
}

/**
 * VFX state
 */
export interface VFXState {
  muzzleFlash: MuzzleFlashConfig | null;
  screenShake: ScreenShakeConfig | null;
}

/**
 * VFX accessibility settings
 */
export interface VFXAccessibilitySettings {
  reducedMotion: boolean; // Disable trails, flash, screen shake
  reducedFlash: boolean; // Disable muzzle flash specifically
}

/**
 * Default VFX accessibility settings
 */
export const DEFAULT_VFX_SETTINGS: VFXAccessibilitySettings = {
  reducedMotion: false,
  reducedFlash: false,
};

/**
 * Detect system reduced motion preference
 */
export function detectReducedMotionPref(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Get default VFX settings based on system preferences
 */
export function getDefaultVFXSettings(): VFXAccessibilitySettings {
  return {
    reducedMotion: detectReducedMotionPref(),
    reducedFlash: false, // Default to enabled flash
  };
}

/**
 * VFX manager
 */
export class VFXManager {
  private state: VFXState = {
    muzzleFlash: null,
    screenShake: null,
  };
  private settings: VFXAccessibilitySettings = DEFAULT_VFX_SETTINGS;
  private currentShakeOffset = { x: 0, y: 0 };

  constructor(settings?: VFXAccessibilitySettings) {
    this.settings = settings || DEFAULT_VFX_SETTINGS;
  }

  /**
   * Update VFX state
   * @param dtS - Delta time in seconds
   * @returns Current camera shake offset (x, y in meters)
   */
  update(dtS: number): { x: number; y: number } {
    // Update muzzle flash
    if (this.state.muzzleFlash) {
      this.state.muzzleFlash.life -= dtS;
      if (this.state.muzzleFlash.life <= 0) {
        this.state.muzzleFlash = null;
      }
    }

    // Update screen shake
    if (this.state.screenShake) {
      this.state.screenShake.life -= dtS;
      
      if (this.state.screenShake.life <= 0) {
        this.state.screenShake = null;
        this.currentShakeOffset = { x: 0, y: 0 };
      } else {
        // Apply random shake within intensity
        const intensity = this.state.screenShake.intensity * 
                        (this.state.screenShake.life / this.state.screenShake.decay);
        this.currentShakeOffset = {
          x: (Math.random() - 0.5) * 2 * intensity,
          y: (Math.random() - 0.5) * 2 * intensity,
        };
      }
    }

    return this.currentShakeOffset;
  }

  /**
   * Trigger muzzle flash
   * @param position - Flash position in world coordinates (meters)
 */
  triggerMuzzleFlash(position: { x: number; y: number }): void {
    if (this.settings.reducedMotion || this.settings.reducedFlash) {
      return;
    }

    this.state.muzzleFlash = {
      position,
      life: 0.08, // 80ms flash
      maxLife: 0.08,
    };
  }

  /**
   * Trigger screen shake
   * @param intensity - Shake intensity in meters (default: 0.5m)
 * @param duration - Shake duration in seconds (default: 0.3s)
   */
  triggerScreenShake(intensity: number = 0.5, duration: number = 0.3): void {
    if (this.settings.reducedMotion) {
      return;
    }

    this.state.screenShake = {
      offsetX: 0,
      offsetY: 0,
      intensity,
      decay: duration,
      life: duration,
    };
  }

  /**
   * Get current VFX state
   */
  getState(): VFXState {
    return this.state;
  }

  /**
   * Update VFX settings
   */
  updateSettings(settings: Partial<VFXAccessibilitySettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    // Clear effects if motion is reduced
    if (this.settings.reducedMotion) {
      this.state.screenShake = null;
      this.currentShakeOffset = { x: 0, y: 0 };
    }
    
    if (this.settings.reducedFlash) {
      this.state.muzzleFlash = null;
    }
  }

  /**
   * Get current settings
   */
  getSettings(): VFXAccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Reset VFX state
   */
  reset(): void {
    this.state = {
      muzzleFlash: null,
      screenShake: null,
    };
    this.currentShakeOffset = { x: 0, y: 0 };
  }
}
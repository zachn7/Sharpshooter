/**
 * VFX module exports
 */

export {
  Particle,
  type ParticleConfig,
  type ParticlePosition,
  type ParticleVelocity,
  ParticleSystem,
  DEFAULT_PARTICLE_CONFIG,
} from './particles';

export {
  VFXManager,
  DEFAULT_VFX_SETTINGS,
  getDefaultVFXSettings,
  detectReducedMotionPref,
  type VFXState,
  type MuzzleFlashConfig,
  type ScreenShakeConfig,
  type VFXAccessibilitySettings,
} from './effects';
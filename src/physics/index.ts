export { simulateShotToDistance, type Vec3, type BallisticsEnv, type BallisticsShot, type ShotResult } from './ballistics';

/**
 * Sign conventions for the physics engine are documented in './conventions.ts'
 * All coordinate systems follow:
 * - Positive Z = RIGHT (from shooter's perspective)
 * - Positive Y = UP
 * - Positive wind = blows RIGHT, drifts bullet RIGHT
 * - Positive windage = shifts POI RIGHT
 * - Positive elevation = shifts POI UP
 */

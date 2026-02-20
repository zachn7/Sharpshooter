/**
 * Moving Targets Utilities
 * Handles calculation of target positions based on time for animated targets (clays, plates)
 */

// Moving target configuration
export interface MovingTargetConfig {
  speedMps: number;         // Speed in meters per second
  axis: 'horizontal' | 'vertical'; // Movement axis
  amplitudeM: number;       // Movement amplitude in meters (half total travel)
}

/**
 * Calculate the current position of a moving target
 * Uses sinusoidal movement: position = center + amplitude * sin(speed * time)
 * 
 * @param centerY_M - Base Y position in world coordinates (meters)
 * @param centerZ_M - Base Z position in world coordinates (meters)
 * @param movingConfig - Moving target configuration
 * @param gameTimeMs - Game time in milliseconds since level start
 * @returns Current (Y, Z) position in world coordinates
 */
export function calculateMovingTargetPosition(
  centerY_M: number,
  centerZ_M: number,
  movingConfig: MovingTargetConfig,
  gameTimeMs: number
): { y_M: number; z_M: number } {
  const { speedMps, axis, amplitudeM } = movingConfig;
  
  // Calculate sinusoidal offset
  // Use gameTimeMs to ensure consistent movement across frames
  const phase = (speedMps * gameTimeMs) / 1000; // Convert ms to seconds
  const offset = amplitudeM * Math.sin(phase * Math.PI * 2); // 2π for full sine wave
  
  if (axis === 'horizontal') {
    // Horizontal movement changes Z coordinate (depth)
    return {
      y_M: centerY_M,
      z_M: centerZ_M + offset,
    };
  } else {
    // Vertical movement changes Y coordinate (height)
    return {
      y_M: centerY_M + offset,
      z_M: centerZ_M,
    };
  }
}

/**
 * Calculate the velocity of a moving target at a given time
 * 
 * @param movingConfig - Moving target configuration
 * @param gameTimeMs - Game time in milliseconds since level start
 * @returns Velocity vector (vy_Mps, vz_Mps) in meters per second
 */
export function calculateMovingTargetVelocity(
  movingConfig: MovingTargetConfig,
  gameStateMs: number
): { vy_Mps: number; vz_Mps: number } {
  const { speedMps, axis, amplitudeM } = movingConfig;
  
  // Calculate derivative of sin(2π * speed * t) = 2π * speed * cos(2π * speed * t)
  const phase = (speedMps * gameStateMs) / 1000;
  const cosPhase = Math.cos(phase * Math.PI * 2);
  const velocity = amplitudeM * speedMps * Math.PI * 2 * cosPhase;
  
  if (axis === 'horizontal') {
    return {
      vy_Mps: 0,
      vz_Mps: velocity,
    };
  } else {
    return {
      vy_Mps: velocity,
      vz_Mps: 0,
    };
  }
}

/**
 * Generate a random moving target configuration for procedural level generation
 * 
 * @param minSpeedMps - Minimum speed in m/s (default: 2.0)
 * @param maxSpeedMps - Maximum speed in m/s (default: 5.0)
 * @param minAmplitudeM - Minimum amplitude in meters (default: 0.08)
 * @param maxAmplitudeM - Maximum amplitude in meters (default: 0.2)
 * @param seed - Random seed for deterministic generation (default: Date.now())
 * @returns MovingTargetConfig object
 */
export function generateMovingTargetConfig(
  minSpeedMps: number = 2.0,
  maxSpeedMps: number = 5.0,
  minAmplitudeM: number = 0.08,
  maxAmplitudeM: number = 0.2,
  seed: number = Date.now()
): MovingTargetConfig {
  // Simple deterministic random number generator
  // Using LCG (Linear Congruential Generator)
  const rng = (state: number) => {
    // Ensure state is positive and non-zero
    const safeState = Math.abs(state) || 1;
    // LCG: X_next = (a * X + c) mod m
    const newState = (safeState * 16807 + 12345) % 2147483647;
    return {
      value: newState / 2147483647.0,
      newState,
    };
  };
  
  let state = Math.abs(seed) || 1;
  
  // Generate axis (random choice)
  const axisRaw = rng(state);
  state = axisRaw.newState;
  const axis: 'horizontal' | 'vertical' = axisRaw.value < 0.5 ? 'horizontal' : 'vertical';
  
  // Generate speed
  const speedRaw = rng(state);
  state = speedRaw.newState;
  const speedMps = minSpeedMps + speedRaw.value * (maxSpeedMps - minSpeedMps);
  
  // Generate amplitude
  const ampRaw = rng(state);
  const amplitudeM = minAmplitudeM + ampRaw.value * (maxAmplitudeM - minAmplitudeM);
  
  return {
    speedMps,
    axis,
    amplitudeM,
  };
}

/**
 * Atmospheric model for computing air density based on temperature and altitude
 * Uses a simplified ISA (International Standard Atmosphere) model
 *
 * Key relationships:
 * - Air density decreases with altitude (less air = less drag)
 * - Warmer air is less dense than cooler air
 * - Higher altitude + higher temperature = significantly less drag
 */

/**
 * Environment parameters for air density calculation
 */
export interface AtmosphereParams {
  temperatureC: number;  // Temperature in Celsius
  altitudeM: number;     // Altitude in meters
}

// Constants for ISA-like approximation
const SEA_LEVEL_PRESSURE_PA = 101325;  // Pascals
const SEA_LEVEL_TEMP_K = 288.15;       // Kelvin (15°C)
const GRAVITY_MPS2 = 9.80665;          // m/s²
const GAS_CONSTANT = 287.05;           // J/(kg·K)specific gas constant for dry air
const LAPSE_RATE_K_M = 0.0065;         // Temperature lapse rate (K/m) in troposphere
const TROPOPAUSE_M = 11000;            // Tropopause altitude (m)

/**
 * Compute air density (kg/m³) based on temperature and altitude
 * 
 * Uses a simplified ISA model:
 * - Below 11km: Barometric formula with temperature lapse
 * - Above 11km (not expected for this game): Isothermal layer
 * 
 * @param params - Temperature (°C) and altitude (m)
 * @returns Air density in kg/m³
 * 
 * @example
 * computeAirDensity({ temperatureC: 15, altitudeM: 0 });  // ~1.225 kg/m³
 * computeAirDensity({ temperatureC: 20, altitudeM: 2000 });  // ~1.006 kg/m³
 */
export function computeAirDensity(params: AtmosphereParams): number {
  const { temperatureC, altitudeM } = params;
  
  // Convert temperature to Kelvin
  const temperatureK = temperatureC + 273.15;
  
  if (altitudeM <= TROPOPAUSE_M) {
    // Troposphere (0-11km): Temperature decreases with altitude
    // Barometric formula: ρ = ρ₀ * (T/T₀)^(g/(R*L) - 1)
    // where L is the lapse rate
    const baseTemp = SEA_LEVEL_TEMP_K;
    
    // Use specified temperature if provided, otherwise use ISA lapse
    const effectiveTemp = temperatureK;
    
    // Pressure ratio (P/P₀)
    const pressureRatio = Math.pow(1 - LAPSE_RATE_K_M * altitudeM / baseTemp, GRAVITY_MPS2 / (GAS_CONSTANT * LAPSE_RATE_K_M));
    
    // Density (ideal gas law: ρ = P / (R*T))
    const pressure = SEA_LEVEL_PRESSURE_PA * pressureRatio;
    const density = pressure / (GAS_CONSTANT * effectiveTemp);
    
    return density;
  } else {
    // Stratosphere (above 11km): Simplified isothermal approximation
    // This is unlikely to be needed for this game, but included for completeness
    const tropopauseTemp = SEA_LEVEL_TEMP_K - LAPSE_RATE_K_M * TROPOPAUSE_M;
    const pressureAtTropopause = SEA_LEVEL_PRESSURE_PA * Math.pow(
      1 - LAPSE_RATE_K_M * TROPOPAUSE_M / SEA_LEVEL_TEMP_K,
      GRAVITY_MPS2 / (GAS_CONSTANT * LAPSE_RATE_K_M)
    );
    
    // Exponential decay above tropopause
    const altitudeAbove = altitudeM - TROPOPAUSE_M;
    const pressure = pressureAtTropopause * Math.exp(
      -GRAVITY_MPS2 * altitudeAbove / (GAS_CONSTANT * tropopauseTemp)
    );
    
    const density = pressure / (GAS_CONSTANT * temperatureK);
    return density;
  }
}

/**
 * Default environment (sea level, standard temperature)
 */
export const DEFAULT_ENVIRONMENT: AtmosphereParams = {
  temperatureC: 15,
  altitudeM: 0,
};

/**
 * Environment presets for common shooting conditions
 */
export const ENVIRONMENT_PRESETS: Record<string, AtmosphereParams> = {
  'sea-level': {
    temperatureC: 15,
    altitudeM: 0,
  },
  'desert-hot': {
    temperatureC: 35,
    altitudeM: 100,
  },
  'mountain-summit': {
    temperatureC: 0,
    altitudeM: 2500,
  },
  'arctic-cold': {
    temperatureC: -20,
    altitudeM: 0,
  },
  'high-altitude': {
    temperatureC: 10,
    altitudeM: 3500,
  },
  'tropical': {
    temperatureC: 30,
    altitudeM: 500,
  },
};

/**
 * Format environment summary for UI display
 * Returns a compact string like "15°C @ 0m" or "10°C @ 2500m"
 */
export function formatEnvironmentSummary(params: AtmosphereParams): string {
  return `${params.temperatureC}°C @ ${params.altitudeM}m`;
}

/**
 * Get density index for UI (simplified 0-5 scale)
 * 5 = dense air (sea level, cold)
 * 0 = thin air (high altitude, hot)
 */
export function getDensityIndex(params: AtmosphereParams): number {
  const density = computeAirDensity(params);
  
  // Range from ~0.5 (high altitude, hot) to ~1.4 (sea level, cold)
  // Map to 0-5 scale
  const minDensity = 0.5;
  const maxDensity = 1.4;
  
  const normalized = (density - minDensity) / (maxDensity - minDensity);
  return Math.round(normalized * 5);
}

/**
 * Get environment preset by name
 */
export function getEnvironmentPreset(name: string): AtmosphereParams | undefined {
  return ENVIRONMENT_PRESETS[name];
}
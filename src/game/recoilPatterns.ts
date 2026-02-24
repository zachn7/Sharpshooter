/**
 * Deterministic Recoil Pattern System
 * 
 * This module provides time-based recoil offset curves for weapons.
 * Each weapon has a recoil pattern that generates a predictable offset from
 * the point of aim based on time since last shot.
 * 
 * Patterns are deterministic: the same time input always produces the same offset.
 * This allows players to learn and control recoil through timing.
 */

export interface RecoilPattern {
  id: string;
  name: string;
  description: string;
  /**
   * Get recoil offset at a given time since last shot
   * @param timeSinceLastShotMs - Time in milliseconds since the last shot
   * @param kickIntensity - Recoil kick intensity from weapon params (scales the pattern)
   * @returns [verticalOffsetMils, horizontalOffsetMils]
   */
  getOffset: (timeSinceLastShotMs: number, kickIntensity: number) => [number, number];
  /**
   * Get peak recoil time - when the pattern reaches maximum offset
   */
  getPeakTimeMs: () => number;
}

/**
 * Base pattern class for smooth, natural recoil curves
 */
class SmoothPattern implements RecoilPattern {
  id: string;
  name: string;
  description: string;
  peakTimeMs: number;
  decayRate: number;
  verticalToHorizontalRatio: number;

  constructor(
    id: string,
    name: string,
    description: string,
    peakTimeMs: number,
    decayRate: number,
    verticalToHorizontalRatio: number
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.peakTimeMs = peakTimeMs;
    this.decayRate = decayRate;
    this.verticalToHorizontalRatio = verticalToHorizontalRatio;
  }

  getOffset(timeSinceLastShotMs: number, kickIntensity: number): [number, number] {
    // Normalize time (0 to 1) based on peak time
    const t = Math.min(timeSinceLastShotMs / this.peakTimeMs, 1.0);
    
    // Smooth ease-out curve for natural recoil
    // Uses cubic easing: t * (2 - t) * t
    const easeOut = t * (2 - t) * t;
    
    // Base magnitude
    const magnitude = kickIntensity * easeOut;
    
    // Vertical is dominant, horizontal follows at a ratio
    const vertical = magnitude;
    const horizontal = magnitude * this.verticalToHorizontalRatio;
    
    // Add slight sine wave for organic feel
    const organic = Math.sin(timeSinceLastShotMs * 0.01) * 0.1;
    
    return [
      vertical + organic * vertical,
      horizontal + organic * horizontal
    ];
  }

  getPeakTimeMs(): number {
    return this.peakTimeMs;
  }
}

/**
 * Pattern with sharp vertical climb (magnum/heavy weapons)
 */
class SharpVerticalPattern implements RecoilPattern {
  id: string;
  name: string;
  description: string;
  peakTimeMs: number;
  decayRate: number;
  horizontalDrift: number;

  constructor(
    id: string,
    name: string,
    description: string,
    peakTimeMs: number,
    horizontalDrift: number
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.peakTimeMs = peakTimeMs;
    this.decayRate = 0.7;
    this.horizontalDrift = horizontalDrift;
  }

  getOffset(timeSinceLastShotMs: number, kickIntensity: number): [number, number] {
    const t = Math.min(timeSinceLastShotMs / this.peakTimeMs, 1.0);
    
    // Sharp exponential climb
    const vertical = kickIntensity * Math.pow(t, 2);
    
    // Linear horizontal drift
    const horizontal = kickIntensity * this.horizontalDrift * t;
    
    return [vertical, horizontal];
  }

  getPeakTimeMs(): number {
    return this.peakTimeMs;
  }
}

/**
 * Pattern with circular/spiral drift (sniper feel)
 */
class CircularPattern implements RecoilPattern {
  id: string;
  name: string;
  description: string;
  peakTimeMs: number;
  frequency: number;

  constructor(
    id: string,
    name: string,
    description: string,
    peakTimeMs: number,
    frequency: number
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.peakTimeMs = peakTimeMs;
    this.frequency = frequency;
  }

  getOffset(timeSinceLastShotMs: number, kickIntensity: number): [number, number] {
    const t = Math.min(timeSinceLastShotMs / this.peakTimeMs, 1.0);
    const magnitude = kickIntensity * t;
    
    // Circular/spiral motion
    const angle = timeSinceLastShotMs * 0.1 * this.frequency;
    const vertical = magnitude * Math.cos(angle);
    const horizontal = magnitude * Math.sin(angle);
    
    return [vertical, horizontal];
  }

  getPeakTimeMs(): number {
    return this.peakTimeMs;
  }
}

/**
 * Pattern with snap-and-reset (pistol fast-shooting)
 */
class SnapPattern implements RecoilPattern {
  id: string;
  name: string;
  description: string;
  peakTimeMs: number;
  snapStrength: number;

  constructor(
    id: string,
    name: string,
    description: string,
    peakTimeMs: number,
    snapStrength: number
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.peakTimeMs = peakTimeMs;
    this.snapStrength = snapStrength;
  }

  getOffset(timeSinceLastShotMs: number, kickIntensity: number): [number, number] {
    const t = Math.min(timeSinceLastShotMs / this.peakTimeMs, 1.0);
    
    // Quick snap up and down
    const vertical = kickIntensity * this.snapStrength * Math.sin(t * Math.PI);
    const horizontal = kickIntensity * 0.3 * Math.sin(t * Math.PI * 2);
    
    return [vertical, horizontal];
  }

  getPeakTimeMs(): number {
    return this.peakTimeMs;
  }
}

// Pattern catalog
export const RECOIL_PATTERNS: RecoilPattern[] = [
  // Pistol patterns
  new SmoothPattern(
    'pistol-standard',
    'Standard',
    'Balanced recoil pattern for standard pistols',
    150,  // 150ms to peak
    0.7,   // decay rate
    0.2    // some horizontal drift
  ),
  new SmoothPattern(
    'pistol-controllable',
    'Controllable',
    'Very smooth recoil pattern for competition firearms',
    120,
    0.8,
    0.15
  ),
  new SharpVerticalPattern(
    'pistol-magnum',
    'Magnum Kick',
    'Sharp vertical climb for magnum calibers',
    200,
    0.3
  ),
  new SnapPattern(
    'pistol-fast',
    'Fast Response',
    'Quick snap-and-reset for rapid-fire pistols',
    100,
    1.5
  ),

  // Rifle patterns
  new SmoothPattern(
    'rifle-car',
    'Carbine',
    'Moderate recoil pattern for compact rifles',
    80,
    0.8,
    0.25
  ),
  new SmoothPattern(
    'rifle-standard',
    'Rifle Standard',
    'Balanced pattern for military rifles',
    70,
    0.85,
    0.2
  ),
  new SharpVerticalPattern(
    'rifle-heavy',
    'Battle Rifle',
    'Strong vertical kick for battle rifles',
    120,
    0.5
  ),

  // DMR patterns
  new SmoothPattern(
    'dmr-standard',
    'DMR Standard',
    'Higher but controllable recoil for DMRs',
    100,
    0.6,
    0.2
  ),
  new SharpVerticalPattern(
    'dmr-heavy',
    'Magnum DMR',
    'Strong recoil for heavy DMR cartridges',
    140,
    0.4
  ),

  // Sniper patterns
  new CircularPattern(
    'sniper-standard',
    'SVD Pattern',
    'Circular drift pattern for semi-auto snipers',
    180,
    1.0
  ),
  new CircularPattern(
    'sniper-bolt',
    'Bolt Action',
    'Classic bolt-action recoil pattern',
    200,
    0.7
  ),
  new CircularPattern(
    'sniper-heavy',
    'Heavy .50',
    'Massive recoil pattern for heavy snipers',
    250,
    0.9
  ),
  new CircularPattern(
    'elr-standard',
    'ELR Pattern',
    'High-magnitude pattern for long-range snipers',
    220,
    1.1
  ),

  // Shotgun patterns
  new SharpVerticalPattern(
    'shotgun-pump',
    'Pump Action',
    'Strong vertical kick for pump shotguns',
    250,
    0.2
  ),
  new SmoothPattern(
    'shotgun-semi',
    'Semi-Auto',
    'Moderate recoil for semi-auto shotguns',
    180,
    0.75,
    0.3
  ),
  new SmoothPattern(
    'shotgun-light',
    'Light Shotgun',
    'Gentle recoil for light gauge shotguns',
    120,
    0.8,
    0.15
  ),
];

/**
 * Get a recoil pattern by ID
 */
export function getRecoilPattern(id: string): RecoilPattern | undefined {
  return RECOIL_PATTERNS.find((p) => p.id === id);
}

/**
 * Get recoil offset for a weapon at a given time since last shot
 * @param recoilPatternId - Pattern ID from weapon params
 * @param timeSinceLastShotMs - Time in ms since last shot
 * @param kickIntensity - Kick intensity from weapon params
 * @returns [verticalOffsetMils, horizontalOffsetMils]
 */
export function getRecoilOffset(
  recoilPatternId: string,
  timeSinceLastShotMs: number,
  kickIntensity: number
): [number, number] {
  const pattern = getRecoilPattern(recoilPatternId);
  if (!pattern) {
    // Fallback to simple linear pattern
    return [kickIntensity * 0.5, 0];
  }
  return pattern.getOffset(timeSinceLastShotMs, kickIntensity);
}

/**
 * Test helper: Check if recoil pattern is deterministic
 * Same input should always produce same output
 */
export function testPatternDeterminism(pattern: RecoilPattern, kickIntensity: number): boolean {
  const offset1 = pattern.getOffset(50, kickIntensity);
  const offset2 = pattern.getOffset(50, kickIntensity);
  const offset3 = pattern.getOffset(100, kickIntensity);
  const offset4 = pattern.getOffset(100, kickIntensity);

  // Same input should produce same output
  return (
    offset1[0] === offset2[0] &&
    offset1[1] === offset2[1] &&
    offset3[0] === offset4[0] &&
    offset3[1] === offset4[1]
  );
}

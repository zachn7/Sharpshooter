/**
 * EffectsBus - Centralized event system for juice/gamefeel effects
 * 
 * Provides a unified way to trigger gamefeel effects like:
 * - Hitstop (impact freeze)
 * - Screen shake
 * - Ring pulses
 * - Score popups
 * - Particle bursts
 * 
 * All effects respect reduced motion and test mode settings.
 */

// Event types that can be emitted
export type EffectEvent =
  | 'fire'           // Weapon fired
  | 'impact'         // Bullet hit target
  | 'bullseye'       // Direct center hit
  | 'plateHit'       // Steel plate hit
  | 'levelComplete'  // Level finished
  | 'error'          // Error state;

// Payload for hitstop effect
export interface HitstopPayload {
  duration?: number; // milliseconds, capped to MAX_HITSTOP_DURATION
}

// Payload for screen shake effect
export interface ShakePayload {
  amplitude?: number; // horizontal pixel offset, capped to MAX_SHAKE_AMPLITUDE
  decay?: number;     // decay rate per frame (0-1), defaults to 0.9
}

// Combined impact payload with position
export interface ImpactPayload extends HitstopPayload, ShakePayload, PulsePayload {
  x: number;
  y: number;
  color: string;
  count?: number; // for particle burst
  speed?: number; // for particle burst speed
}

// Payload for ring pulse effect
export interface PulsePayload {
  color?: string; // hex color, defaults to theme accent
  scale?: number; // max scale, defaults to 1.5
}

// Payload for score popup effect
export interface ScorePopPayload {
  score: number;
  x: number;
  y: number;
}

// Payload for particle burst
export interface ParticleBurstPayload {
  x: number;
  y: number;
  color: string;
  count?: number; // particle count, capped to MAX_PARTICLES_PER_BURST
  speed?: number; // particle speed, defaults to 1.0
}

// Union of all event payloads
export type EffectPayload =
  | HitstopPayload
  | ShakePayload
  | PulsePayload
  | ScorePopPayload
  | ParticleBurstPayload
  | ImpactPayload;

// Effect state managed by EffectsBus
export interface EffectsState {
  // Hitstop state
  hitstop: {
    active: boolean;
    remainingTime: number; // milliseconds
    startTime: number;    // timestamp
  };
  // Screen shake state
  shake: {
    amplitude: number;
    decay: number;
    offset: { x: number; y: number };
  };
  // Ring pulse state
  pulse: {
    active: boolean;
    x: number;
    y: number;
    scale: number;
    color: string;
    opacity: number;
  };
  // Score popups
  scorePops: ScorePopPayload[];
  // Particles
  particles: Particle[];
}

// Particle data structure
export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;      // 0-1, particles die when life <= 0
  decay: number;     // how fast life decreases
  color: string;
  size: number;
}

// System configuration and caps
export const EFFECTS_CONFIG = {
  // Hitstop caps
  MAX_HITSTOP_DURATION: 40,    // 40ms maximum hitstop
  DEFAULT_HITSTOP_DURATION: 30, // 30ms default hitstop

  // Shake caps
  MAX_SHAKE_AMPLITUDE: 8,      // 8px maximum shake offset
  DEFAULT_SHAKE_AMPLITUDE: 4,   // 4px default shake
  DEFAULT_SHAKE_DECAY: 0.85,    // 15% decay per frame
  MIN_SHAKE_AMPLITUDE: 0.1,     // threshold to stop shaking

  // Pulse caps
  DEFAULT_PULSE_SCALE: 1.5,
  PULSE_DECAY: 0.05,             // 5% opacity decay per frame

  // Particles caps
  MAX_PARTICLES_PER_BURST: 12,  // Max particles per event
  MAX_ACTIVE_PARTICLES: 50,     // Total particles cap
  PARTICLE_DEFAULT_LIFE: 1.0,
  PARTICLE_DEFAULT_DECAY: 0.02,
  PARTICLE_DEFAULT_SPEED: 2.0,
  PARTICLE_DEFAULT_SIZE: 4,

  // Score popup caps
  MAX_SCORE_POPUPS: 8,          // Max concurrent score pops
  POPUP_LIFETIME: 800,          // 800ms to fade out
  POPUP_DECAY: 0.015,           // Decay rate per frame at 60fps
} as const;

// Event listener type
type EventListener = (event: EffectEvent, payload: EffectPayload) => void;

class EffectsBusClass {
  private listeners: Map<EffectEvent, Set<EventListener>> = new Map();
  private state: EffectsState;
  private nextParticleId: number = 0;

  // Cache settings for gating
  private isTestMode: boolean = false;
  private reducedMotion: boolean = false;
  private reducedFlash: boolean = false;

  // Time management
  private timeScale: number = 1.0;

  constructor() {
    this.state = this.createInitialState();
  }

  /**
   * Create initial effects state
   */
  private createInitialState(): EffectsState {
    return {
      hitstop: {
        active: false,
        remainingTime: 0,
        startTime: 0,
      },
      shake: {
        amplitude: 0,
        decay: EFFECTS_CONFIG.DEFAULT_SHAKE_DECAY,
        offset: { x: 0, y: 0 },
      },
      pulse: {
        active: false,
        x: 0,
        y: 0,
        scale: 1,
        color: '#ffffff',
        opacity: 0,
      },
      scorePops: [],
      particles: [],
    };
  }

  /**
   * Set accessibility/test mode settings
   */
  setSettings(settings: {
    reducedMotion?: boolean;
    reducedFlash?: boolean;
    testMode?: boolean;
  }): void {
    if (settings.reducedMotion !== undefined) {
      this.reducedMotion = settings.reducedMotion;
    }
    if (settings.reducedFlash !== undefined) {
      this.reducedFlash = settings.reducedFlash;
    }
    if (settings.testMode !== undefined) {
      this.isTestMode = settings.testMode;
    }

    // Reset effects if being disabled
    if (this.reducedMotion || this.isTestMode) {
      this.resetEffects();
    }
  }

  /**
   * Reset all active effects
   */
  resetEffects(): void {
    this.state.hitstop.active = false;
    this.state.hitstop.remainingTime = 0;
    this.state.shake.amplitude = 0;
    this.state.shake.offset = { x: 0, y: 0 };
    this.state.pulse.active = false;
    this.state.pulse.opacity = 0;
    this.state.scorePops = [];
    this.state.particles = [];
  }

  /**
   * Emit an effect event
   */
  emit(event: EffectEvent, payload?: EffectPayload): void {
    // In test mode, all effects are no-ops
    if (this.isTestMode) {
      return;
    }

    // Process the event to trigger effects
    this.processEvent(event, payload);

    // Notify listeners (for side effects like audio)
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        listener(event, payload || {});
      }
    }
  }

  /**
   * Subscribe to effect events
   */
  on(event: EffectEvent, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  /**
   * Process event and trigger effects
   */
  private processEvent(event: EffectEvent, payload?: EffectPayload): void {
    switch (event) {
      case 'fire':
        this.processFire();
        break;
      case 'impact':
        this.processImpact(payload as ImpactPayload);
        break;
      case 'bullseye':
        this.processBullseye(payload as ImpactPayload);
        break;
      case 'plateHit':
        this.processPlateHit(payload as ImpactPayload);
        break;
      case 'levelComplete':
        this.processLevelComplete();
        break;
      case 'error':
        this.processError();
        break;
    }
  }

  /**
   * Process weapon fire - slight screen twitch
   */
  private processFire(): void {
    if (this.reducedMotion) return;

    const amp = EFFECTS_CONFIG.DEFAULT_SHAKE_AMPLITUDE * 0.3; // Smaller than impact shake
    this.state.shake.amplitude = Math.min(amp, EFFECTS_CONFIG.MAX_SHAKE_AMPLITUDE);
    this.state.shake.decay = EFFECTS_CONFIG.DEFAULT_SHAKE_DECAY;

    // Generate initial shake offset
    this.updateShakeOffset();
  }

  /**
   * Impact payload
   */
  private processImpact(payload: ImpactPayload): void {
    // Hitstop (disabled by reduced motion)
    if (!this.reducedMotion) {
      const duration = Math.min(
        payload.duration ?? EFFECTS_CONFIG.DEFAULT_HITSTOP_DURATION,
        EFFECTS_CONFIG.MAX_HITSTOP_DURATION
      );
      this.state.hitstop.active = true;
      this.state.hitstop.remainingTime = duration;
      this.state.hitstop.startTime = performance.now();
    }

    // Screen shake
    if (!this.reducedMotion) {
      const amplitude = Math.min(
        payload.amplitude ?? EFFECTS_CONFIG.DEFAULT_SHAKE_AMPLITUDE,
        EFFECTS_CONFIG.MAX_SHAKE_AMPLITUDE
      );
      this.state.shake.amplitude = amplitude;
      this.state.shake.decay = payload.decay ?? EFFECTS_CONFIG.DEFAULT_SHAKE_DECAY;
      this.updateShakeOffset();
    }

    // Ring pulse (disabled by reduced flash)
    if (!this.reducedFlash) {
      this.state.pulse.active = true;
      this.state.pulse.x = payload.x;
      this.state.pulse.y = payload.y;
      this.state.pulse.scale = payload.scale ?? EFFECTS_CONFIG.DEFAULT_PULSE_SCALE;
      this.state.pulse.color = payload.color ?? '#ffffff';
      this.state.pulse.opacity = 1.0;
    }

    // Particles
    this.spawnParticleBurst(
      payload.x,
      payload.y,
      payload.color,
      payload.count,
      payload.speed
    );
  }

  /**
   * Process bullseye - stronger hitstop, shake, particles
   */
  private processBullseye(payload: ImpactPayload): void {
    // Stronger hitstop
    if (!this.reducedMotion) {
      const duration = Math.min(
        EFFECTS_CONFIG.DEFAULT_HITSTOP_DURATION * 1.5,
        EFFECTS_CONFIG.MAX_HITSTOP_DURATION
      );
      this.state.hitstop.active = true;
      this.state.hitstop.remainingTime = duration;
      this.state.hitstop.startTime = performance.now();
    }

    // Stronger shake
    if (!this.reducedMotion) {
      this.state.shake.amplitude = EFFECTS_CONFIG.MAX_SHAKE_AMPLITUDE;
      this.state.shake.decay = EFFECTS_CONFIG.DEFAULT_SHAKE_DECAY;
      this.updateShakeOffset();
    }

    // Gold pulse
    if (!this.reducedFlash) {
      this.state.pulse.active = true;
      this.state.pulse.x = payload.x;
      this.state.pulse.y = payload.y;
      this.state.pulse.scale = 2.0;
      this.state.pulse.color = '#ffd700'; // Gold
      this.state.pulse.opacity = 1.0;
    }

    // More particles
    this.spawnParticleBurst(
      payload.x,
      payload.y,
      '#ffd700',
      EFFECTS_CONFIG.MAX_PARTICLES_PER_BURST * 1.5,
      2.5
    );
  }

  /**
   * Process steel plate hit - ping sound + shake
   */
  private processPlateHit(payload: ImpactPayload): void {
    if (this.reducedMotion) return;

    // Moderate shake
    this.state.shake.amplitude = Math.min(
      payload.amplitude ?? EFFECTS_CONFIG.DEFAULT_SHAKE_AMPLITUDE * 0.7,
      EFFECTS_CONFIG.MAX_SHAKE_AMPLITUDE
    );
    this.state.shake.decay = payload.decay ?? EFFECTS_CONFIG.DEFAULT_SHAKE_DECAY;
    this.updateShakeOffset();

    // Small pulse
    if (!this.reducedFlash) {
      this.state.pulse.active = true;
      this.state.pulse.x = payload.x;
      this.state.pulse.y = payload.y;
      this.state.pulse.scale = 1.2;
      this.state.pulse.color = '#ff6b6b';
      this.state.pulse.opacity = 0.8;
    }
  }

  /**
   * Process level complete - celebration particles
   */
  private processLevelComplete(): void {
    if (this.reducedMotion) return;

    // Spawn celebration particles from center
    const x = 0.5; // Normalized center
    const y = 0.5;
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ffffff'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    this.spawnParticleBurst(x, y, color, EFFECTS_CONFIG.MAX_PARTICLES_PER_BURST, 3.0);
  }

  /**
   * Process error - negative feedback
   */
  private processError(): void {
    // Just a small shake, no hitstop
    if (this.reducedMotion) return;

    this.state.shake.amplitude = EFFECTS_CONFIG.DEFAULT_SHAKE_AMPLITUDE * 0.5;
    this.state.shake.decay = EFFECTS_CONFIG.DEFAULT_SHAKE_DECAY;
    this.updateShakeOffset();

    // Red pulse
    if (!this.reducedFlash) {
      this.state.pulse.active = true;
      this.state.pulse.x = 0.5; // Center
      this.state.pulse.y = 0.5;
      this.state.pulse.scale = 1.2;
      this.state.pulse.color = '#ff4444';
      this.state.pulse.opacity = 0.5;
    }
  }

  /**
   * Update shake offset based on current amplitude
   */
  private updateShakeOffset(): void {
    if (this.state.shake.amplitude > EFFECTS_CONFIG.MIN_SHAKE_AMPLITUDE) {
      const angle = Math.random() * Math.PI * 2;
      this.state.shake.offset.x = Math.cos(angle) * this.state.shake.amplitude;
      this.state.shake.offset.y = Math.sin(angle) * this.state.shake.amplitude;
    }
  }

  /**
   * Spawn a particle burst with pooling and caps
   */
  private spawnParticleBurst(
    x: number,
    y: number,
    color: string,
    count?: number,
    speed?: number
  ): void {
    // Cap particle count
    const actualCount = Math.min(
      count ?? EFFECTS_CONFIG.MAX_PARTICLES_PER_BURST,
      EFFECTS_CONFIG.MAX_PARTICLES_PER_BURST
    );

    // Cap total active particles
    const availableSlots = EFFECTS_CONFIG.MAX_ACTIVE_PARTICLES - this.state.particles.length;
    if (availableSlots <= 0) return;

    const canSpawn = Math.min(actualCount, availableSlots);
    const actualSpeed = speed ?? EFFECTS_CONFIG.PARTICLE_DEFAULT_SPEED;

    for (let i = 0; i < canSpawn; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speedVariation = 0.5 + Math.random(); // 0.5x to 1.5x speed
      const particle: Particle = {
        id: this.nextParticleId++,
        x,
        y,
        vx: Math.cos(angle) * actualSpeed * speedVariation,
        vy: Math.sin(angle) * actualSpeed * speedVariation,
        life: EFFECTS_CONFIG.PARTICLE_DEFAULT_LIFE,
        decay: EFFECTS_CONFIG.PARTICLE_DEFAULT_DECAY * (0.8 + Math.random() * 0.4), // Vary decay slightly
        color,
        size: EFFECTS_CONFIG.PARTICLE_DEFAULT_SIZE * (0.8 + Math.random() * 0.4),
      };
      this.state.particles.push(particle);
    }
  }

  /**
   * Update all effects for the current frame
   */
  update(deltaTime: number): number {
    const currentTime = performance.now();

    // Handle hitstop
    if (this.state.hitstop.active) {
      const elapsed = currentTime - this.state.hitstop.startTime;
      if (elapsed >= this.state.hitstop.remainingTime) {
        this.state.hitstop.active = false;
        this.timeScale = 1.0;
      } else {
        this.timeScale = 0.0; // Time stops during hitstop
        return 0; // Return 0 to indicate no update needed
      }
    }

    this.timeScale = 1.0;

    // Update screen shake with decay
    if (this.state.shake.amplitude > EFFECTS_CONFIG.MIN_SHAKE_AMPLITUDE) {
      this.state.shake.amplitude *= this.state.shake.decay;
      this.updateShakeOffset();
    } else {
      this.state.shake.amplitude = 0;
      this.state.shake.offset = { x: 0, y: 0 };
    }

    // Update pulse with decay
    if (this.state.pulse.active) {
      this.state.pulse.opacity -= EFFECTS_CONFIG.PULSE_DECAY;
      if (this.state.pulse.opacity <= 0) {
        this.state.pulse.active = false;
        this.state.pulse.opacity = 0;
      }
    }

    // Update particles
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const particle = this.state.particles[i];
      particle.life -= particle.decay;

      if (particle.life <= 0) {
        // Pool by removing (simple pooling - could add recycle pool later)
        this.state.particles.splice(i, 1);
        continue;
      }

      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
    }

    // Update score popups
    for (let i = this.state.scorePops.length - 1; i >= 0; i--) {
      // Just track count for now, actual opacity handled in render
      // Score pops are ephemeral UI elements
    }

    return deltaTime;
  }

  /**
   * Get current effects state for rendering
   */
  getState(): Readonly<EffectsState> {
    return this.state;
  }

  /**
   * Get current time scale (0 during hitstop, 1 otherwise)
   */
  getTimeScale(): number {
    // Return 0 if hitstop is currently active
    if (this.state.hitstop.active) {
      return 0.0;
    }
    return this.timeScale;
  }

  /**
   * Get current screen shake offset
   */
  getShakeOffset(): { x: number; y: number } {
    return this.state.shake.offset;
  }

  /**
   * Add a score popup effect
   */
  addScorePopup(score: number, x: number, y: number): void {
    if (this.state.scorePops.length >= EFFECTS_CONFIG.MAX_SCORE_POPUPS) {
      this.state.scorePops.shift(); // Remove oldest
    }
    this.state.scorePops.push({ score, x, y });
  }

  /**
   * Clear all score popups
   */
  clearScorePopups(): void {
    this.state.scorePops = [];
  }
}

/**
 * Singleton instance
 */
export const EffectsBus = new EffectsBusClass();

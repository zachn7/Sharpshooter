/**
 * Lightweight particle system for VFX
 * 
 * Provides simple particle effects for impact sparks and other visual feedback.
 * Optimized for performance with capped particle counts.
 */

/**
 * Particle position in world coordinates (meters)
 */
export interface ParticlePosition {
  x: number;
  y: number;
}

/**
 * Particle velocity (meters per second)
 */
export interface ParticleVelocity {
  vx: number; // Horizontal velocity
  vy: number; // Vertical velocity
}

/**
 * Particle configuration
 */
export interface ParticleConfig {
  position: ParticlePosition;
  velocity: ParticleVelocity;
  life: number; // Life remaining in seconds
  maxLife: number; // Total lifetime in seconds
  size: number; // Particle size in meters
  color: string; // CSS color
  type: 'spark' | 'puff' | 'trail';
}

/**
 * Particle state
 */
export class Particle {
  public position: ParticlePosition;
  public velocity: ParticleVelocity;
  public life: number;
  public maxLife: number;
  public size: number;
  public color: string;
  public type: 'spark' | 'puff' | 'trail';

  constructor(config: ParticleConfig) {
    this.position = { ...config.position };
    this.velocity = { ...config.velocity };
    this.life = config.life;
    this.maxLife = config.maxLife;
    this.size = config.size;
    this.color = config.color;
    this.type = config.type;
  }

  /**
   * Update particle position and life
   * @param dtS - Delta time in seconds
   * @returns true if particle is still alive, false if dead
   */
  update(dtS: number): boolean {
    this.life -= dtS;
    
    if (this.life <= 0) {
      return false;
    }
    
    // Update position based on velocity
    this.position.x += this.velocity.vx * dtS;
    this.position.y += this.velocity.vy * dtS;
    
    // Apply gravity to sparks
    if (this.type === 'spark') {
      this.velocity.vy -= 9.8 * dtS; // Gravity
    }
    
    return true;
  }

  /**
   * Get current alpha based on life
   */
  getAlpha(): number {
    return Math.max(0, this.life / this.maxLife);
  }
}

/**
 * Particle system configuration
 */
export interface ParticleSystemConfig {
  maxParticles: number; // Maximum total particles
  maxAge: number; // Maximum particle lifetime in seconds
}

/**
 * Default particle system configuration
 */
export const DEFAULT_PARTICLE_CONFIG: ParticleSystemConfig = {
  maxParticles: 50, // Conservative limit for performance
  maxAge: 1.0,
};

/**
 * Particle system for managing visual effects
 */
export class ParticleSystem {
  private particles: Particle[] = [];
  private config: ParticleSystemConfig;

  constructor(config: ParticleSystemConfig = DEFAULT_PARTICLE_CONFIG) {
    this.config = config;
  }

  /**
   * Create impact sparks
   * @param position - Impact position in world coordinates (meters)
   * @param impactNormal - Direction of impact (optional, defaults to upward)
   * @param count - Number of particles to create (default: 8)
   */
  createSparks(
    position: ParticlePosition,
    impactNormal: ParticleVelocity = { vx: 0, vy: 1 },
    count: number = 8
  ): void {
    for (let i = 0; i < count; i++) {
      // Random velocity spreading outward from impact normal
      const angleVariation = (Math.random() - 0.5) * Math.PI * 0.8; // ±72 degrees
      const impactAngle = Math.atan2(impactNormal.vy, impactNormal.vx);
      const angle = impactAngle + angleVariation;
      const speed = 2.0 + Math.random() * 3.0; // 2-5 m/s
      
      this.addParticle({
        position: { ...position },
        velocity: {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        },
        life: 0.3 + Math.random() * 0.3, // 0.3-0.6s
        maxLife: 0.6,
        size: 0.01 + Math.random() * 0.02, // 1-3cm
        color: Math.random() > 0.7 ? '#ff6600' : '#ffcc00', // Orange or yellow
        type: 'spark',
      });
    }
  }

  /**
   * Create impact puff (smoke-like effect)
   * @param position - Impact position in world coordinates (meters)
   */
  createPuff(position: ParticlePosition): void {
    this.addParticle({
      position: { ...position },
      velocity: {
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.5 + Math.random() * 0.5, // Upward
      },
      life: 0.5 + Math.random() * 0.3, // 0.5-0.8s
      maxLife: 0.8,
      size: 0.02 + Math.random() * 0.03, // 2-5cm
      color: 'rgba(200, 200, 200, ',
      type: 'puff',
    });
  }

  /**
   * Create bullet trail particle
   * @param position - Trail position in world coordinates (meters)
   * @param _velocity - Bullet velocity (for potential future use)
   */
  createTrail(
    position: ParticlePosition,
    _velocity: ParticleVelocity
  ): void {
    this.addParticle({
      position: { ...position },
      velocity: { vx: 0, vy: 0 }, // Trail doesn't move
      life: 0.1, // 100ms trail
      maxLife: 0.1,
      size: 0.02, // 2cm trail
      color: 'rgba(255, 100, 50, ',
      type: 'trail',
    });
  }

  /**
   * Add a particle to the system
   * @param config - Particle configuration
   */
  private addParticle(config: Omit<ParticleConfig, 'life'> & { life?: number }): void {
    // Remove oldest particle if at max
    if (this.particles.length >= this.config.maxParticles) {
      this.particles.shift();
    }

    this.particles.push(new Particle({
      ...config,
      life: config.life || config.maxLife || this.config.maxAge,
    }));
  }

  /**
   * Update all particles
   * @param dtS - Delta time in seconds
   */
  update(dtS: number): void {
    this.particles = this.particles.filter((p) => p.update(dtS));
  }

  /**
   * Get all particles for rendering
   */
  getParticles(): Particle[] {
    return [...this.particles];
  }

  /**
   * Clear all particles
   */
  clear(): void {
    this.particles = [];
  }

  /**
   * Get particle count
   */
  getParticleCount(): number {
    return this.particles.length;
  }
}
import { describe, it, expect, beforeEach } from 'vitest';
import {
  Particle,
  type ParticleConfig,
  ParticleSystem,
  DEFAULT_PARTICLE_CONFIG,
} from '../particles';
import {
  VFXManager,
  DEFAULT_VFX_SETTINGS,
  getDefaultVFXSettings,
  detectReducedMotionPref,
} from '../effects';

describe('Particle', () => {
  it('should create a particle with correct configuration', () => {
    const config: ParticleConfig = {
      position: { x: 10, y: 20 },
      velocity: { vx: 1, vy: 2 },
      life: 1.0,
      maxLife: 1.0,
      size: 5,
      color: '#ffffff',
      type: 'spark',
    };

    const particle = new Particle(config);

    expect(particle.position).toEqual(config.position);
    expect(particle.velocity).toEqual(config.velocity);
    expect(particle.life).toBe(config.life);
    expect(particle.maxLife).toBe(config.maxLife);
    expect(particle.color).toBe(config.color);
    expect(particle.type).toBe(config.type);
  });

  it('should update position based on velocity', () => {
    const particle = new Particle({
      position: { x: 0, y: 0 },
      velocity: { vx: 10, vy: 20 },
      life: 1.0,
      maxLife: 1.0,
      size: 1,
      color: '#ffffff',
      type: 'spark',
    });

    const alive = particle.update(0.1);

    expect(alive).toBe(true);
    expect(particle.position.x).toBeCloseTo(1, 5); // 0 + 10 * 0.1
    expect(particle.position.y).toBeCloseTo(2, 5); // 0 + 20 * 0.1
  });

  it('should apply gravity to spark particles', () => {
    const particle = new Particle({
      position: { x: 0, y: 0 },
      velocity: { vx: 0, vy: 0 },
      life: 1.0,
      maxLife: 1.0,
      size: 1,
      color: '#ffffff',
      type: 'spark',
    });

    particle.update(0.1);

    // Gravity: -9.8 * 0.1 = -0.98
    expect(particle.velocity.vy).toBeCloseTo(-0.98, 2);
  });

  it('should die when life reaches 0', () => {
    const particle = new Particle({
      position: { x: 0, y: 0 },
      velocity: { vx: 1, vy: 1 },
      life: 0.05,
      maxLife: 0.5,
      size: 1,
      color: '#ffffff',
      type: 'spark',
    });

    const alive = particle.update(0.1);

    expect(alive).toBe(false);
    expect(particle.life).toBeLessThanOrEqual(0);
  });

  it('should calculate alpha based on life', () => {
    const particle = new Particle({
      position: { x: 0, y: 0 },
      velocity: { vx: 1, vy: 1 },
      life: 0.5,
      maxLife: 1.0,
      size: 1,
      color: '#ffffff',
      type: 'spark',
    });

    expect(particle.getAlpha()).toBe(0.5);

    particle.update(0.25);
    expect(particle.getAlpha()).toBeCloseTo(0.25, 5);
  });
});

describe('ParticleSystem', () => {
  let system: ParticleSystem;

  beforeEach(() => {
    system = new ParticleSystem(DEFAULT_PARTICLE_CONFIG);
  });

  it('should create sparks at position', () => {
    system.createSparks({ x: 10, y: 20 }, { vx: 0, vy: 1 }, 5);

    const particles = system.getParticles();
    expect(particles.length).toBe(5);
    expect(particles[0].position).toEqual({ x: 10, y: 20 });
  });

  it('should create a puff at position', () => {
    system.createPuff({ x: 5, y: 10 });

    const particles = system.getParticles();
    expect(particles.length).toBe(1);
    expect(particles[0].type).toBe('puff');
  });

  it('should create a trail at position', () => {
    system.createTrail({ x: 0, y: 0 }, { vx: 10, vy: 0 });

    const particles = system.getParticles();
    expect(particles.length).toBe(1);
    expect(particles[0].type).toBe('trail');
  });

  it('should update all particles', () => {
    system.createSparks({ x: 0, y: 0 }, { vx: 0, vy: 1 }, 10);

    const beforeCount = system.getParticleCount();
    system.update(0.1);
    const afterCount = system.getParticleCount();

    expect(beforeCount).toBe(10);
    expect(afterCount).toBeLessThanOrEqual(10);
  });

  it('should respect max particle limit', () => {
    const limitedSystem = new ParticleSystem({ maxParticles: 5, maxAge: 1.0 });

    limitedSystem.createSparks({ x: 0, y: 0 }, { vx: 0, vy: 1 }, 10);

    expect(limitedSystem.getParticleCount()).toBeLessThanOrEqual(5);
  });

  it('should clear all particles', () => {
    system.createSparks({ x: 0, y: 0 }, { vx: 0, vy: 1 }, 10);
    system.createPuff({ x: 0, y: 0 });

    expect(system.getParticleCount()).toBeGreaterThan(0);

    system.clear();

    expect(system.getParticleCount()).toBe(0);
  });
});

describe('VFXManager', () => {
  let manager: VFXManager;

  beforeEach(() => {
    manager = new VFXManager();
  });

  it('should have default settings', () => {
    const settings = manager.getSettings();
    expect(settings).toEqual(DEFAULT_VFX_SETTINGS);
  });

  it('should trigger muzzle flash', () => {
    manager.triggerMuzzleFlash({ x: 10, y: 20 });

    const state = manager.getState();
    expect(state.muzzleFlash).not.toBeNull();
    expect(state.muzzleFlash?.position).toEqual({ x: 10, y: 20 });
  });

  it('should trigger screen shake', () => {
    manager.triggerScreenShake(0.5, 0.3);

    const state = manager.getState();
    expect(state.screenShake).not.toBeNull();
    expect(state.screenShake?.intensity).toBe(0.5);
  });

  it('should update VFX state', () => {
    manager.triggerMuzzleFlash({ x: 10, y: 20 });
    manager.triggerScreenShake(0.5, 0.3);

    const shake = manager.update(0.1);

    expect(shake.x).not.toBe(0);
    expect(shake.y).not.toBe(0);
  });

  it('should clear muzzle flash after life expires', () => {
    manager.triggerMuzzleFlash({ x: 10, y: 20 });
    expect(manager.getState().muzzleFlash).not.toBeNull();

    manager.update(0.2); // 200ms > 80ms life
    expect(manager.getState().muzzleFlash).toBeNull();
  });

  it('should stop screen shake after life expires', () => {
    manager.triggerScreenShake(0.5, 0.1);
    
    const duringShake = manager.update(0.05);
    expect(duringShake.x).not.toBe(0);

    const afterShake = manager.update(0.1);
    expect(afterShake.x).toBe(0);
    expect(afterShake.y).toBe(0);
  });

  it('should update settings', () => {
    manager.updateSettings({ reducedMotion: true });

    const settings = manager.getSettings();
    expect(settings.reducedMotion).toBe(true);
  });

  it('should not trigger muzzle flash when reduced motion is enabled', () => {
    manager.updateSettings({ reducedMotion: true });
    manager.triggerMuzzleFlash({ x: 10, y: 20 });

    expect(manager.getState().muzzleFlash).toBeNull();
  });

  it('should not trigger screen shake when reduced motion is enabled', () => {
    manager.updateSettings({ reducedMotion: true });
    manager.triggerScreenShake(0.5, 0.3);

    expect(manager.getState().screenShake).toBeNull();
  });

  it('should reset state', () => {
    manager.triggerMuzzleFlash({ x: 10, y: 20 });
    manager.triggerScreenShake(0.5, 0.3);

    expect(manager.getState().muzzleFlash).not.toBeNull();
    expect(manager.getState().screenShake).not.toBeNull();

    manager.reset();

    expect(manager.getState().muzzleFlash).toBeNull();
    expect(manager.getState().screenShake).toBeNull();
  });
});

describe('VFX Settings', () => {
  it('should have default settings', () => {
    expect(DEFAULT_VFX_SETTINGS).toEqual({
      reducedMotion: false,
      reducedFlash: false,
    });
  });

  it('should detect reduced motion preference', () => {
    // This test just validates the function doesn't crash
    // In real usage, it would detect system preference
    const hasReducedMotion = detectReducedMotionPref();
    expect(typeof hasReducedMotion).toBe('boolean');
  });

  it('should get default settings based on system preference', () => {
    const defaults = getDefaultVFXSettings();
    expect(typeof defaults.reducedMotion).toBe('boolean');
    expect(defaults.reducedFlash).toBe(false);
  });
});
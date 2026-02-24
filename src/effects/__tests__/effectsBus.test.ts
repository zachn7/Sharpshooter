/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EffectsBus,
  EFFECTS_CONFIG,
} from '../EffectsBus';

describe('EffectsBus', () => {
  beforeEach(() => {
    // Reset state before each test
    EffectsBus.setSettings({ 
      reducedMotion: false, 
      reducedFlash: false, 
      testMode: false 
    });
    EffectsBus.resetEffects();
  });

  describe('initialization', () => {
    it('should start with no active effects', () => {
      const state = EffectsBus.getState();
      expect(state.hitstop.active).toBe(false);
      expect(state.shake.amplitude).toBe(0);
      expect(state.pulse.active).toBe(false);
      expect(state.particles).toHaveLength(0);
      expect(state.scorePops).toHaveLength(0);
    });

    it('should have time scale of 1.0 by default', () => {
      expect(EffectsBus.getTimeScale()).toBe(1.0);
    });
  });

  describe('event emission', () => {
    it('should emit events and notify listeners', () => {
      const listener = vi.fn();
      const unsubscribe = EffectsBus.on('impact', listener);

      EffectsBus.emit('impact', { x: 100, y: 200, color: '#fff' });

      expect(listener).toHaveBeenCalledWith('impact', expect.any(Object));

      unsubscribe();
    });

    it('should allow unsubscribing from events', () => {
      const listener = vi.fn();
      const unsubscribe = EffectsBus.on('fire', listener);

      EffectsBus.emit('fire');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      EffectsBus.emit('fire');
      expect(listener).toHaveBeenCalledTimes(1); // Should still be 1
    });
  });

  describe('hitstop', () => {
    it('should trigger hitstop on impact events', () => {
      EffectsBus.emit('impact', {
        duration: 30,
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const state = EffectsBus.getState();
      expect(state.hitstop.active).toBe(true);
      expect(state.hitstop.remainingTime).toBeGreaterThan(0);
    });

    it('should cap hitstop duration to MAX_HITSTOP_DURATION', () => {
      EffectsBus.emit('impact', {
        duration: 1000, // Way over the cap
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const state = EffectsBus.getState();
      expect(state.hitstop.remainingTime).toBeLessThanOrEqual(
        EFFECTS_CONFIG.MAX_HITSTOP_DURATION
      );
    });

    it('should set time scale to 0 during hitstop', () => {
      EffectsBus.emit('impact', {
        duration: 30,
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      expect(EffectsBus.getTimeScale()).toBe(0);
    });

    it('should restore time scale to 1 after hitstop expires', () => {
      EffectsBus.emit('impact', {
        duration: 1, // Very short
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      // Fast forward 10ms
      EffectsBus.update(0.01);

      const state = EffectsBus.getState();
      expect(state.hitstop.active).toBe(false);
      expect(EffectsBus.getTimeScale()).toBe(1.0);
    });

    it('should not trigger hitstop when reduced motion is enabled', () => {
      EffectsBus.setSettings({ reducedMotion: true });

      EffectsBus.emit('impact', {
        duration: 30,
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const state = EffectsBus.getState();
      expect(state.hitstop.active).toBe(false);
    });

    it('should not trigger hitstop when in test mode', () => {
      EffectsBus.setSettings({ testMode: true });

      EffectsBus.emit('impact', {
        duration: 30,
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const state = EffectsBus.getState();
      expect(state.hitstop.active).toBe(false);
    });
  });

  describe('screen shake', () => {
    it('should trigger shake on impact events', () => {
      EffectsBus.emit('impact', {
        amplitude: 5,
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const state = EffectsBus.getState();
      expect(state.shake.amplitude).toBeGreaterThan(0);
    });

    it('should cap shake amplitude to MAX_SHAKE_AMPLITUDE', () => {
      EffectsBus.emit('impact', {
        amplitude: 100, // Way over cap
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const state = EffectsBus.getState();
      expect(state.shake.amplitude).toBeLessThanOrEqual(
        EFFECTS_CONFIG.MAX_SHAKE_AMPLITUDE
      );
    });

    it('should decay shake amplitude over time', () => {
      EffectsBus.emit('impact', {
        amplitude: 5,
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const initialAmplitude = EffectsBus.getState().shake.amplitude;

      // Update several frames
      for (let i = 0; i < 10; i++) {
        EffectsBus.update(0.016); // 60fps
      }

      const finalAmplitude = EffectsBus.getState().shake.amplitude;
      expect(finalAmplitude).toBeLessThan(initialAmplitude);
    });

    it('should ensure shake decay is monotic (never increases)', () => {
      EffectsBus.emit('impact', {
        amplitude: 5,
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      let prevAmplitude = EffectsBus.getState().shake.amplitude;

      // Check monotonic decay for multiple frames
      for (let i = 0; i < 20; i++) {
        EffectsBus.update(0.016);
        const currentAmplitude = EffectsBus.getState().shake.amplitude;
        expect(currentAmplitude).toBeLessThanOrEqual(prevAmplitude);
        prevAmplitude = currentAmplitude;
      }
    });

    it('should stop shaking when amplitude falls below threshold', () => {
      EffectsBus.emit('impact', {
        amplitude: 1,
        decay: 0.8,
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      // Update until shake should stop
      for (let i = 0; i < 100; i++) {
        EffectsBus.update(0.016);
      }

      const state = EffectsBus.getState();
      expect(state.shake.amplitude).toBe(0);
      expect(state.shake.offset.x).toBe(0);
      expect(state.shake.offset.y).toBe(0);
    });

    it('should not trigger shake when reduced motion is enabled', () => {
      EffectsBus.setSettings({ reducedMotion: true });

      EffectsBus.emit('impact', {
        amplitude: 5,
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const state = EffectsBus.getState();
      expect(state.shake.amplitude).toBe(0);
    });

    it('should generate shake offsets', () => {
      EffectsBus.emit('impact', {
        amplitude: 5,
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const offset1 = EffectsBus.getShakeOffset();
      expect(Math.abs(offset1.x)).toBeGreaterThan(0);
      expect(Math.abs(offset1.y)).toBeGreaterThan(0);

      // Offset should vary per update
      EffectsBus.update(0.016);
      const offset2 = EffectsBus.getShakeOffset();
      expect(offset2).not.toEqual(offset1);
    });
  });

  describe('pulse effects', () => {
    it('should trigger pulse on impact events', () => {
      EffectsBus.emit('impact', {
        scale: 1.5,
        color: '#ffffff',
        x: 100,
        y: 200,
      } as any);

      const state = EffectsBus.getState();
      expect(state.pulse.active).toBe(true);
      expect(state.pulse.opacity).toBe(1.0);
    });

    it('should decay pulse opacity over time', () => {
      EffectsBus.emit('impact', {
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const initialOpacity = EffectsBus.getState().pulse.opacity;

      // Update several frames
      for (let i = 0; i < 10; i++) {
        EffectsBus.update(0.0);
      }

      const finalOpacity = EffectsBus.getState().pulse.opacity;
      expect(finalOpacity).toBeLessThan(initialOpacity);
    });

    it('should deactivate pulse when opacity reaches 0', () => {
      EffectsBus.emit('impact', {
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      // Update until pulse should fade out
      for (let i = 0; i < 50; i++) {
        EffectsBus.update(0.0);
      }

      const state = EffectsBus.getState();
      expect(state.pulse.active).toBe(false);
      expect(state.pulse.opacity).toBe(0);
    });

    it('should not trigger pulse when reduced flash is enabled', () => {
      EffectsBus.setSettings({ reducedFlash: true });

      EffectsBus.emit('impact', {
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const state = EffectsBus.getState();
      expect(state.pulse.active).toBe(false);
    });

    it('should set bullseye gold color', () => {
      EffectsBus.emit('bullseye', {
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const state = EffectsBus.getState();
      expect(state.pulse.color).toBe('#ffd700'); // Gold
    });
  });

  describe('particles', () => {
    it('should spawn particles on impact events', () => {
      EffectsBus.emit('impact', {
        x: 100,
        y: 200,
        color: '#ffffff',
        count: 10,
      } as any);

      const state = EffectsBus.getState();
      expect(state.particles.length).toBeGreaterThan(0);
    });

    it('should cap particle count per burst to MAX_PARTICLES_PER_BURST', () => {
      EffectsBus.emit('impact', {
        x: 100,
        y: 200,
        color: '#ffffff',
        count: 1000, // Way over cap
      } as any);

      const state = EffectsBus.getState();
      expect(state.particles.length).toBeLessThanOrEqual(
        EFFECTS_CONFIG.MAX_PARTICLES_PER_BURST
      );
    });

    it('should cap total active particles to MAX_ACTIVE_PARTICLES', () => {
      // Fill to near capacity
      for (let i = 0; i < 5; i++) {
        EffectsBus.emit('impact', {
          x: 100,
          y: 200,
          color: '#ffffff',
          count: EFFECTS_CONFIG.MAX_PARTICLES_PER_BURST,
        } as any);
      }

      const state = EffectsBus.getState();
      expect(state.particles.length).toBeLessThanOrEqual(
        EFFECTS_CONFIG.MAX_ACTIVE_PARTICLES
      );
    });

    it('should remove dead particles over time', () => {
      EffectsBus.emit('impact', {
        x: 100,
        y: 200,
        color: '#ffffff',
        count: 5,
      } as any);

      const initialCount = EffectsBus.getState().particles.length;

      // Update many frames to kill particles
      for (let i = 0; i < 100; i++) {
        EffectsBus.update(0.016);
      }

      const finalCount = EffectsBus.getState().particles.length;
      expect(finalCount).toBeLessThan(initialCount);
    });

    it('should update particle positions over time', () => {
      EffectsBus.emit('impact', {
        x: 100,
        y: 200,
        color: '#ffffff',
        count: 1,
      } as any);

      const particle = EffectsBus.getState().particles[0];
      const initialX = particle.x;
      const initialY = particle.y;

      EffectsBus.update(0.016);

      expect(particle.x).not.toBe(initialX);
      expect(particle.y).not.toBe(initialY);
    });

    it('should use object pooling by reusing particles (simple implementation)', () => {
      // This test ensures particles are removed not mutated in place
      EffectsBus.emit('impact', {
        x: 100,
        y: 200,
        color: '#ffffff',
        count: 3,
      } as any);

      const initialIds = EffectsBus.getState().particles.map((p) => p.id);

      // Kill all particles
      for (let i = 0; i < 200; i++) {
        EffectsBus.update(0.016);
      }

      // Spawn new particles
      EffectsBus.emit('impact', {
        x: 100,
        y: 200,
        color: '#ffffff',
        count: 3,
      } as any);

      const newIds = EffectsBus.getState().particles.map((p) => p.id);
      // New particles should have different IDs (pooling implementation)
      expect(newIds).not.toEqual(initialIds);
    });
  });

  describe('score popups', () => {
    it('should add score popups', () => {
      EffectsBus.addScorePopup(100, 100, 200);

      const state = EffectsBus.getState();
      expect(state.scorePops).toHaveLength(1);
      expect(state.scorePops[0].score).toBe(100);
    });

    it('should cap score popups to MAX_SCORE_POPUPS', () => {
      for (let i = 0; i < 20; i++) {
        EffectsBus.addScorePopup(i * 10, i * 10, i * 10);
      }

      const state = EffectsBus.getState();
      expect(state.scorePops.length).toBeLessThanOrEqual(
        EFFECTS_CONFIG.MAX_SCORE_POPUPS
      );
    });

    it('should remove oldest score popup when exceeded', () => {
      EffectsBus.addScorePopup(1, 10, 10);
      EffectsBus.addScorePopup(2, 20, 20);

      // Add up to cap
      for (let i = 0; i < EFFECTS_CONFIG.MAX_SCORE_POPUPS; i++) {
        EffectsBus.addScorePopup(i + 3, 10, 10);
      }

      const state = EffectsBus.getState();
      const scores = state.scorePops.map((p) => p.score);
      // The first popup should have been removed
      expect(scores).not.toContain(3);
      expect(state.scorePops.length).toBe(EFFECTS_CONFIG.MAX_SCORE_POPUPS);
    });

    it('should clear all score popups', () => {
      EffectsBus.addScorePopup(100, 10, 20);
      EffectsBus.addScorePopup(200, 30, 40);

      EffectsBus.clearScorePopups();

      expect(EffectsBus.getState().scorePops).toHaveLength(0);
    });
  });

  describe('reduced motion settings', () => {
    it('should respect reduced motion setting', () => {
      EffectsBus.setSettings({ reducedMotion: true });

      EffectsBus.emit('impact', {
        amplitude: 5,
        duration: 30,
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const state = EffectsBus.getState();
      // No shake, no hitstop when reduced motion is on
      expect(state.shake.amplitude).toBe(0);
      expect(state.hitstop.active).toBe(false);
    });

    it('should respect reduced flash setting', () => {
      EffectsBus.setSettings({ reducedFlash: true });

      EffectsBus.emit('impact', {
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const state = EffectsBus.getState();
      // No pulse when reduced flash is on
      expect(state.pulse.active).toBe(false);
    });

    it('should disable all effects in test mode', () => {
      EffectsBus.setSettings({ testMode: true });

      EffectsBus.emit('impact', {
        amplitude: 5,
        duration: 30,
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const state = EffectsBus.getState();
      expect(state.shake.amplitude).toBe(0);
      expect(state.hitstop.active).toBe(false);
      expect(state.pulse.active).toBe(false);
      expect(state.particles).toHaveLength(0);
    });

    it('should reset effects when enabling reduced motion', () => {
      EffectsBus.emit('impact', {
        amplitude: 5,
        duration: 30,
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      // Enable reduced motion mid-effect
      EffectsBus.setSettings({ reducedMotion: true });

      const state = EffectsBus.getState();
      expect(state.shake.amplitude).toBe(0);
      expect(state.hitstop.active).toBe(false);
      expect(state.pulse.active).toBe(false);
    });
  });

  describe('different event types', () => {
    it('should process fire events with small shake', () => {
      EffectsBus.emit('fire');

      const state = EffectsBus.getState();
      expect(state.shake.amplitude).toBeLessThan(EFFECTS_CONFIG.DEFAULT_SHAKE_AMPLITUDE);
    });

    it('should process bullseye with stronger shake and gold pulse', () => {
      EffectsBus.emit('bullseye', {
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const state = EffectsBus.getState();
      expect(state.shake.amplitude).toBe(EFFECTS_CONFIG.MAX_SHAKE_AMPLITUDE);
      expect(state.pulse.color).toBe('#ffd700');
      expect(state.pulse.scale).toBe(2.0);
    });

    it('should process plateHit with moderate shake', () => {
      EffectsBus.emit('plateHit', {
        amplitude: 5,
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      const state = EffectsBus.getState();
      expect(state.shake.amplitude).toBeGreaterThan(0);
      expect(state.shake.amplitude).toBeLessThan(EFFECTS_CONFIG.MAX_SHAKE_AMPLITUDE);
    });

    it('should process levelComplete with celebration particles', () => {
      EffectsBus.emit('levelComplete');

      const state = EffectsBus.getState();
      expect(state.particles.length).toBeGreaterThan(0);
    });

    it('should process error with red pulse and small shake', () => {
      EffectsBus.emit('error');

      const state = EffectsBus.getState();
      expect(state.pulse.color).toBe('#ff4444');
      expect(state.pulse.scale).toBe(1.2);
      expect(state.shake.amplitude).toBeGreaterThan(0);
    });
  });

  describe('reset effects', () => {
    it('should reset all effects', () => {
      EffectsBus.emit('impact', {
        amplitude: 5,
        duration: 30,
        x: 100,
        y: 200,
        color: '#ffffff',
      } as any);

      EffectsBus.addScorePopup(100, 10, 20);

      EffectsBus.resetEffects();

      const state = EffectsBus.getState();
      expect(state.shake.amplitude).toBe(0);
      expect(state.hitstop.active).toBe(false);
      expect(state.pulse.active).toBe(false);
      expect(state.particles).toHaveLength(0);
      expect(state.scorePops).toHaveLength(0);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  calculateSwayOffset,
  calculateRecoilImpulse,
  updateRecoilDecay,
  combineOffsets,
  isTestModeEnabled,
  type SwayOffset,
  type RecoilState,
} from '../sway';

describe('sway module', () => {
  describe('calculateSwayOffset', () => {
    it('returns zero sway at time=0 with specific frequencies', () => {
      const sway = calculateSwayOffset(0, 'realistic', 'rifle');
      expect(sway.y).toBe(0); // sin(0) = 0
    });

    it('produces different offsets at different times', () => {
      const sway1 = calculateSwayOffset(0, 'realistic', 'rifle');
      const sway2 = calculateSwayOffset(1, 'realistic', 'rifle');
      const sway3 = calculateSwayOffset(2, 'realistic', 'rifle');
      
      expect(sway1.y).not.toBe(sway2.y);
      expect(sway2.y).not.toBe(sway3.y);
    });

    it('scales with realism preset', () => {
      const arcadeSway = calculateSwayOffset(1, 'arcade', 'rifle');
      const realisticSway = calculateSwayOffset(1, 'realistic', 'rifle');
      const expertSway = calculateSwayOffset(1, 'expert', 'rifle');
      
      const arcadeMag = Math.abs(arcadeSway.y) + Math.abs(arcadeSway.z);
      const realisticMag = Math.abs(realisticSway.y) + Math.abs(realisticSway.z);
      const expertMag = Math.abs(expertSway.y) + Math.abs(expertSway.z);
      
      expect(arcadeMag).toBeLessThan(realisticMag);
      expect(realisticMag).toBeLessThan(expertMag);
    });

    it('scales with weapon type', () => {
      const pistolSway = calculateSwayOffset(1, 'realistic', 'pistol');
      const rifleSway = calculateSwayOffset(1, 'realistic', 'rifle');
      const sniperSway = calculateSwayOffset(1, 'realistic', 'sniper');
      
      // Pistol should have more sway than rifle
      const pistolMag = Math.abs(pistolSway.y) + Math.abs(pistolSway.z);
      const rifleMag = Math.abs(rifleSway.y) + Math.abs(rifleSway.z);
      const sniperMag = Math.abs(sniperSway.y) + Math.abs(sniperSway.z);
      
      // Sniper should be most stable (least sway)
      expect(sniperMag).toBeLessThan(rifleMag);
      expect(pistolMag).toBeGreaterThan(rifleMag);
    });

    it('scales with magnification (higher mag = more visible sway)', () => {
      const mag1Sway = calculateSwayOffset(1, 'realistic', 'rifle', 1);
      const mag4Sway = calculateSwayOffset(1, 'realistic', 'rifle', 4);
      const mag8Sway = calculateSwayOffset(1, 'realistic', 'rifle', 8);
      
      const mag1Mag = Math.abs(mag1Sway.y) + Math.abs(mag1Sway.z);
      const mag4Mag = Math.abs(mag4Sway.y) + Math.abs(mag4Sway.z);
      const mag8Mag = Math.abs(mag8Sway.y) + Math.abs(mag8Sway.z);
      
      expect(mag1Mag).toBeLessThan(mag4Mag);
      expect(mag4Mag).toBeLessThan(mag8Mag);
    });

    it('produces continuous oscillation (not random)', () => {
      // Sway should be smooth and predictable
      const samples: SwayOffset[] = [];
      for (let t = 0; t < 2; t += 0.1) {
        samples.push(calculateSwayOffset(t, 'realistic', 'rifle'));
      }
      
      // Check that adjacent samples are relatively close (smooth motion)
      let maxJump = 0;
      for (let i = 1; i < samples.length; i++) {
        const dx = samples[i].y - samples[i - 1].y;
        const dz = samples[i].z - samples[i - 1].z;
        const jump = Math.sqrt(dx * dx + dz * dz);
        maxJump = Math.max(maxJump, jump);
      }
      
      // Maximum change between 0.1s samples should be reasonable (not random jumps)
      expect(maxJump).toBeLessThan(0.2); // Less than 0.2 MILs change
    });

    it('is deterministic (same time = same offset)', () => {
      const sway1 = calculateSwayOffset(1.2345, 'expert', 'shotgun', 8);
      const sway2 = calculateSwayOffset(1.2345, 'expert', 'shotgun', 8);
      
      expect(sway1.y).toBeCloseTo(sway2.y, 10);
      expect(sway1.z).toBeCloseTo(sway2.z, 10);
    });
  });

  describe('calculateRecoilImpulse', () => {
    it('returns positive vertical offset (kick up)', () => {
      const recoil = calculateRecoilImpulse('realistic', 'rifle');
      expect(recoil.offsetY).toBeGreaterThan(0);
    });

    it('returns smaller horizontal offset', () => {
      const recoil = calculateRecoilImpulse('realistic', 'rifle');
      expect(Math.abs(recoil.offsetZ)).toBeLessThan(recoil.offsetY);
    });

    it('has positive decay rate', () => {
      const recoil = calculateRecoilImpulse('realistic', 'rifle');
      expect(recoil.decayRate).toBeGreaterThan(0);
    });

    it('scales with realism preset', () => {
      const arcadeRecoil = calculateRecoilImpulse('arcade', 'rifle');
      const realisticRecoil = calculateRecoilImpulse('realistic', 'rifle');
      const expertRecoil = calculateRecoilImpulse('expert', 'rifle');
      
      expect(arcadeRecoil.offsetY).toBeLessThan(realisticRecoil.offsetY);
      expect(realisticRecoil.offsetY).toBeLessThan(expertRecoil.offsetY);
    });

    it('scales with weapon type', () => {
      const pistolRecoil = calculateRecoilImpulse('realistic', 'pistol');
      const rifleRecoil = calculateRecoilImpulse('realistic', 'rifle');
      const shotgunRecoil = calculateRecoilImpulse('realistic', 'shotgun');
      
      expect(pistolRecoil.offsetY).toBeLessThan(rifleRecoil.offsetY);
      expect(rifleRecoil.offsetY).toBeLessThan(shotgunRecoil.offsetY);
    });

    it('decay rate varies by preset (faster for arcade)', () => {
      const arcadeDecay = calculateRecoilImpulse('arcade', 'rifle').decayRate;
      const realisticDecay = calculateRecoilImpulse('realistic', 'rifle').decayRate;
      const expertDecay = calculateRecoilImpulse('expert', 'rifle').decayRate;
      
      expect(arcadeDecay).toBeGreaterThan(realisticDecay);
      expect(realisticDecay).toBeGreaterThan(expertDecay);
    });
  });

  describe('updateRecoilDecay', () => {
    it('reduces offset over time', () => {
      const state: RecoilState = {
        offsetY: 5.0,
        offsetZ: 2.0,
        decayRate: 4.0,
      };
      
      const dt1 = 0.1; // 100ms
      const dt2 = 0.2; // 200ms
      
      const decay1 = updateRecoilDecay(state, dt1);
      const decay2 = updateRecoilDecay(state, dt2);
      
      expect(Math.abs(decay1.y)).toBeLessThan(Math.abs(state.offsetY));
      expect(Math.abs(decay2.y)).toBeLessThan(Math.abs(decay1.y)); // Longer time = more decay
    });

    it('exponential decay: larger dt = more decay', () => {
      const state: RecoilState = {
        offsetY: 10.0,
        offsetZ: 5.0,
        decayRate: 2.0,
      };
      
      const dt1 = 0.1;
      const dt2 = 0.2;
      const dt3 = 0.4;
      
      const decay1 = updateRecoilDecay(state, dt1);
      const decay2 = updateRecoilDecay(state, dt2);
      const decay3 = updateRecoilDecay(state, dt3);
      
      // Verify exponential decay: amount decayed per unit time decreases over time
      const ratio1 = decay1.y / state.offsetY;
      const ratio2 = decay2.y / state.offsetY;
      const ratio3 = decay3.y / state.offsetY;
      
      expect(ratio1).toBeGreaterThan(ratio2);
      expect(ratio2).toBeGreaterThan(ratio3);
    });

    it('approaches zero asymptotically', () => {
      const state: RecoilState = {
        offsetY: 5.0,
        offsetZ: 2.0,
        decayRate: 4.0,
      };
      
      // Decay over 3 seconds
      const dt = 3.0;
      const decayed = updateRecoilDecay(state, dt);
      
      // Should be very close to zero but not negative
      expect(decayed.y).toBeCloseTo(0, 4);
      expect(decayed.y).toBeGreaterThanOrEqual(0);
      expect(decayed.z).toBeCloseTo(0, 4);
      expect(decayed.z).toBeGreaterThanOrEqual(0);
    });

    it('handles zero time delta', () => {
      const state: RecoilState = {
        offsetY: 5.0,
        offsetZ: 2.0,
        decayRate: 4.0,
      };
      
      const decayed = updateRecoilDecay(state, 0);
      
      expect(decayed.y).toBe(state.offsetY);
      expect(decayed.z).toBe(state.offsetZ);
    });

    it('monotonic decay (never increases)', () => {
      const state: RecoilState = {
        offsetY: 10.0,
        offsetZ: 5.0,
        decayRate: 2.0,
      };
      
      // Step through decay in multiple small increments
      let current = state;
      for (let i = 0; i < 100; i++) {
        const dt = 0.01;
        const next = updateRecoilDecay(current, dt);
        
        // Never should increase
        expect(Math.abs(next.y)).toBeLessThanOrEqual(Math.abs(current.offsetY) + 0.0001);
        expect(Math.abs(next.z)).toBeLessThanOrEqual(Math.abs(current.offsetZ) + 0.0001);
        
        current = { offsetY: next.y, offsetZ: next.z, decayRate: state.decayRate };
      }
    });
  });

  describe('combineOffsets', () => {
    it('adds sway and recoil offsets', () => {
      const sway: SwayOffset = { y: 0.5, z: -0.3 };
      const recoil: SwayOffset = { y: 2.0, z: 0.4 };
      
      const combined = combineOffsets(sway, recoil);
      
      expect(combined.y).toBeCloseTo(2.5, 10);
      expect(combined.z).toBeCloseTo(0.1, 10);
    });

    it('handles zero offsets', () => {
      const sway: SwayOffset = { y: 0, z: 0 };
      const recoil: SwayOffset = { y: 0, z: 0 };
      
      const combined = combineOffsets(sway, recoil);
      
      expect(combined.y).toBe(0);
      expect(combined.z).toBe(0);
    });

    it('handles negative offsets', () => {
      const sway: SwayOffset = { y: -0.5, z: -0.3 };
      const recoil: SwayOffset = { y: -2.0, z: -0.4 };
      
      const combined = combineOffsets(sway, recoil);
      
      expect(combined.y).toBeCloseTo(-2.5, 10);
      expect(combined.z).toBeCloseTo(-0.7, 10);
    });
  });

  describe('isTestModeEnabled', () => {
    it('returns true for testMode=1', () => {
      const params = new URLSearchParams('testMode=1');
      expect(isTestModeEnabled(params)).toBe(true);
    });

    it('returns true for testMode=true', () => {
      const params = new URLSearchParams('testMode=true');
      expect(isTestModeEnabled(params)).toBe(true);
    });

    it('returns false for testMode=0', () => {
      const params = new URLSearchParams('testMode=0');
      expect(isTestModeEnabled(params)).toBe(false);
    });

    it('returns false for missing testMode', () => {
      const params = new URLSearchParams('');
      expect(isTestModeEnabled(params)).toBe(false);
    });

    it('returns false for other params', () => {
      const params = new URLSearchParams('level=1&seed=123');
      expect(isTestModeEnabled(params)).toBe(false);
    });
  });
});

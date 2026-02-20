import { describe, it, expect } from 'vitest';
import { WEAPONS_CATALOG, getWeaponById } from '../weapons';
import type { WeaponType } from '../weapons';

describe('weapons data', () => {
  describe('weapons catalog', () => {
    it('has at least 6 weapons', () => {
      expect(WEAPONS_CATALOG.length).toBeGreaterThanOrEqual(6);
    });

    it('contains 6 pistol weapons (4 existing + 3 new)', () => {
      const pistols = WEAPONS_CATALOG.filter(w => w.type === 'pistol');
      expect(pistols.length).toBe(6);
    });

    it('new pistol weapons have valid ids and names', () => {
      const expectedNewPistols = [
        { id: 'pistol-viper', name: 'Viper VX-9' },
        { id: 'pistol-phantom', name: 'Phantom P-45' },
        { id: 'pistol-eclipse', name: 'Eclipse E-22' },
      ];

      expectedNewPistols.forEach(expected => {
        const weapon = getWeaponById(expected.id);
        expect(weapon).toBeDefined();
        expect(weapon?.name).toBe(expected.name);
        expect(weapon?.type).toBe('pistol');
      });
    });

    it('names are fictional (no real brand references)', () => {
      const realBrands = ['Glock', 'Beretta', 'Sig', 'Smith', 'Wesson', 'Ruger', 'HK'];
      WEAPONS_CATALOG.forEach(weapon => {
        const nameLower = weapon.name.toLowerCase();
        realBrands.forEach(brand => {
          expect(nameLower).not.toContain(brand.toLowerCase());
        });
      });
    });

    it.each(WEAPONS_CATALOG)('weapon $id has sensible params', (weapon) => {
      expect(weapon.params.muzzleVelocityMps).toBeGreaterThan(0);
      expect(weapon.params.muzzleVelocityMps).toBeLessThan(1500);
      expect(weapon.params.massKg).toBeGreaterThan(0);
      expect(weapon.params.massKg).toBeLessThan(0.1);
      expect(weapon.params.precisionMoaAt100).toBeGreaterThan(0);
      // Shotguns have higher precision (wider spread), up to 10 MOA
      const maxPrecision = weapon.type === 'shotgun' ? 15 : 6;
      expect(weapon.params.precisionMoaAt100).toBeLessThan(maxPrecision);
    });

    it('pistols have higher recoil recovery than rifles', () => {
      const pistols = WEAPONS_CATALOG.filter(w => w.type === 'pistol').map(w => w.params.recoilRecoveryMs);
      const rifles = WEAPONS_CATALOG.filter(w => w.type === 'rifle').map(w => w.params.recoilRecoveryMs);
      
      const avgPistolRecovery = pistols.reduce((a, b) => a + b, 0) / pistols.length;
      const avgRifleRecovery = rifles.reduce((a, b) => a + b, 0) / rifles.length;
      
      expect(avgPistolRecovery).toBeGreaterThan(avgRifleRecovery);
    });

    it('pistols have lower muzzle velocity than rifles generally', () => {
      const pistols = WEAPONS_CATALOG.filter(w => w.type === 'pistol').map(w => w.params.muzzleVelocityMps);
      const rifles = WEAPONS_CATALOG.filter(w => w.type === 'rifle').map(w => w.params.muzzleVelocityMps);
      
      const avgPistolVelocity = pistols.reduce((a, b) => a + b, 0) / pistols.length;
      const avgRifleVelocity = rifles.reduce((a, b) => a + b, 0) / rifles.length;
      
      expect(avgPistolVelocity).toBeLessThan(avgRifleVelocity);
    });

    it('all weapon ids are unique', () => {
      const ids = WEAPONS_CATALOG.map(w => w.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('getWeaponById returns correct weapon or undefined', () => {
      const weapon = getWeaponById('pistol-training');
      expect(weapon).toBeDefined();
      expect(weapon?.id).toBe('pistol-training');

      const missing = getWeaponById('non-existent-weapon');
      expect(missing).toBeUndefined();
    });
  });

  describe('weapon types', () => {
    it('supports all required weapon types', () => {
      const types = new Set(WEAPONS_CATALOG.map(w => w.type));
      const expectedTypes: WeaponType[] = ['pistol', 'rifle', 'sniper', 'shotgun'];
      
      expectedTypes.forEach(type => {
        expect(types.has(type)).toBe(true);
      });
    });
  });
});

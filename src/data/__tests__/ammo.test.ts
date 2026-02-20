import { describe, it, expect } from 'vitest';
import { getAmmoById } from '../ammo';

describe('ELR ammo data', () => {
  describe('ELR ammo variants', () => {
    it('has at least 3 ELR-specific ammo variants', () => {
      const elrAmmoIds = ['rifle-elr-match', 'rifle-elr-budget', 'rifle-elr-heavy'];
      elrAmmoIds.forEach(id => {
        const ammo = getAmmoById(id);
        expect(ammo).toBeDefined();
        expect(ammo?.weaponType).toBe('rifle');
      });
    });

    it('ELR Match Ultra has ultra-low drag and tight dispersion', () => {
      const ammo = getAmmoById('rifle-elr-match');
      expect(ammo).toBeDefined();
      expect(ammo?.dragScale).toBeLessThan(0.95);  // Very low drag
      expect(ammo?.dispersionScale).toBeLessThan(0.7);  // Very tight
      expect(ammo?.muzzleVelocityScale).toBeGreaterThanOrEqual(1.0);  // High velocity
    });

    it('ELR Budget has good performance but less than match grade', () => {
      const budget = getAmmoById('rifle-elr-budget');
      const match = getAmmoById('rifle-elr-match');
      expect(budget).toBeDefined();
      expect(match).toBeDefined();
      
      // Budget should have worse drag and dispersion than match
      expect(budget!.dragScale).toBeGreaterThan(match!.dragScale);
      expect(budget!.dispersionScale).toBeGreaterThan(match!.dispersionScale);
    });

    it('ELR Heavy Boat-Tail has heavy recoil for wind resistance', () => {
      const ammo = getAmmoById('rifle-elr-heavy');
      expect(ammo).toBeDefined();
      expect(ammo?.name).toContain('Heavy');
      expect(ammo?.recoilScale).toBeGreaterThan(1.1);  // Higher recoil
      expect(ammo?.name).toContain('Boat-Tail');
    });

    it('all ELR ammo variants have meaningful stat differences', () => {
      const elrAmmos = [
        getAmmoById('rifle-elr-match'),
        getAmmoById('rifle-elr-budget'),
        getAmmoById('rifle-elr-heavy'),
      ].filter(a => a !== undefined);

      // Each should have distinct characteristics
      const dragScales = elrAmmos.map(a => a!.dragScale);
      const dispersionScales = elrAmmos.map(a => a!.dispersionScale);
      const recoilScales = elrAmmos.map(a => a!.recoilScale);

      // Should have variation
      expect(new Set(dragScales).size).toBeGreaterThan(1);
      expect(new Set(dispersionScales).size).toBeGreaterThan(1);
      expect(new Set(recoilScales).size).toBeGreaterThan(1);
    });
  });
});

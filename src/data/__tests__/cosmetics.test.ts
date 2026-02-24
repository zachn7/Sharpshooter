import { describe, it, expect } from 'vitest';
import {
  getReticleSkin,
  isReticleSkinUnlocked,
  getAvailableReticleSkins,
  getReticleSkinsByPack,
  packHasCosmetics,
  DEFAULT_COSMETIC_UNLOCKS,
  RETICLE_SKINS,
} from '../cosmetics';

describe('Cosmetics', () => {
  describe('getReticleSkin', () => {
    it('should find skin by ID', () => {
      const skin = getReticleSkin('reticle-default');
      expect(skin).toBeDefined();
      expect(skin?.id).toBe('reticle-default');
    });

    it('should return undefined for unknown skin', () => {
      const skin = getReticleSkin('unknown-skin');
      expect(skin).toBeUndefined();
    });
  });

  describe('isReticleSkinUnlocked', () => {
    it('should unlock skins with no requirements', () => {
      const unlocked = isReticleSkinUnlocked('reticle-default', []);
      expect(unlocked).toBe(true);
    });

    it('should unlock skins when pack is completed', () => {
      const unlocked = isReticleSkinUnlocked('reticle-tactical', ['pistols']);
      expect(unlocked).toBe(true);
    });

    it('should not unlock skins when pack is not completed', () => {
      const unlocked = isReticleSkinUnlocked('reticle-tactical', []);
      expect(unlocked).toBe(false);
    });

    it('should unlock skins from multiple packs', () => {
      const unlocked1 = isReticleSkinUnlocked('reticle-tactical', ['pistols']);
      const unlocked2 = isReticleSkinUnlocked('reticle-target', ['rifle-basics']);
      
      expect(unlocked1).toBe(true);
      expect(unlocked2).toBe(true);
    });

    it('should handle ELR pack unlocks correctly', () => {
      const unlocked = isReticleSkinUnlocked('reticle-sniperscope', ['elr-pack']);
      expect(unlocked).toBe(true);
    });

    it('should not unlock with wrong pack', () => {
      const unlocked = isReticleSkinUnlocked('reticle-sniperscope', ['pistols']);
      expect(unlocked).toBe(false);
    });
  });

  describe('getAvailableReticleSkins', () => {
    it('should return all skins with unlock status', () => {
      const skins = getAvailableReticleSkins(['pistols']);
      expect(skins.length).toBeGreaterThan(0);
      expect(skins.every((s) => s.id && s.unlocked !== undefined)).toBe(true);
    });

    it('should mark default skins as unlocked', () => {
      const skins = getAvailableReticleSkins([]);
      const defaultSkin = skins.find((s) => s.id === 'reticle-default');
      expect(defaultSkin?.unlocked).toBe(true);
    });

    it('should only unlock pack-specific skins when pack completed', () => {
      const skins = getAvailableReticleSkins(['pistols']);
      
      // Default skin should be unlocked
      expect(skins.find((s) => s.id === 'reticle-default')?.unlocked).toBe(true);
      
      // Pistols pack skins should be unlocked
      expect(skins.find((s) => s.id === 'reticle-tactical')?.unlocked).toBe(true);
      
      // Other pack skins should be locked
      expect(skins.find((s) => s.id === 'reticle-target')?.unlocked).toBe(false);
    });

    it('should unlock all skins when all packs completed', () => {
      const allPacks = ['pistols', 'rifle-basics', 'shotguns-pack', 'elr-pack'];
      const skins = getAvailableReticleSkins(allPacks);
      
      // All skins should be unlocked
      expect(skins.every((s) => s.unlocked)).toBe(true);
    });
  });

  describe('getReticleSkinsByPack', () => {
    it('should return empty array for pack with no cosmetics', () => {
      const skins = getReticleSkinsByPack('pack-without-cosmetics');
      expect(skins).toEqual([]);
    });

    it('should return pistols pack skins', () => {
      const skins = getReticleSkinsByPack('pistols');
      expect(skins.length).toBeGreaterThan(0);
      expect(skins.every((s) => s.requiredPackId === 'pistols')).toBe(true);
    });

    it('should return rifle pack skins', () => {
      const skins = getReticleSkinsByPack('rifle-basics');
      expect(skins.length).toBeGreaterThan(0);
      expect(skins.length).toBe(3); // target, acog, holo
    });

    it('should return shotgun pack skins', () => {
      const skins = getReticleSkinsByPack('shotguns-pack');
      expect(skins.length).toBe(3); // bullseye, circle, red-dot
    });

    it('should return ELR pack skins', () => {
      const skins = getReticleSkinsByPack('elr-pack');
      expect(skins.length).toBe(3); // sniperscope, competition, bdc
    });
  });

  describe('packHasCosmetics', () => {
    it('should return false for packs without cosmetics', () => {
      expect(packHasCosmetics('pistol-basics')).toBe(false);
      expect(packHasCosmetics('sniper-basics')).toBe(false);
    });

    it('should return true for packs with cosmetics', () => {
      expect(packHasCosmetics('pistols')).toBe(true);
      expect(packHasCosmetics('rifle-basics')).toBe(true);
      expect(packHasCosmetics('shotguns-pack')).toBe(true);
      expect(packHasCosmetics('elr-pack')).toBe(true);
    });
  });

  describe('DEFAULT_COSMETIC_UNLOCKS', () => {
    it('should have default reticle unlocked', () => {
      expect(DEFAULT_COSMETIC_UNLOCKS.reticleSkins['reticle-default']).toBe(true);
    });

    it('should have default reticle selected', () => {
      expect(DEFAULT_COSMETIC_UNLOCKS.selectedReticleId).toBe('reticle-default');
    });
  });

  describe('reticle skin data structure', () => {
    it('should have valid skin data', () => {
      RETICLE_SKINS.forEach((skin) => {
        expect(skin.id).toBeTruthy();
        expect(skin.name).toBeTruthy();
        expect(skin.description).toBeTruthy();
        expect(skin.colors?.primary).toBeTruthy();
      });
    });

    it('should have unique IDs', () => {
      const ids = RETICLE_SKINS.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have visual properties', () => {
      const skins = getAvailableReticleSkins([]);
      skins.forEach((skin) => {
        expect(skin.colors?.primary).toBeTruthy();
        expect(skin.colors?.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });
});

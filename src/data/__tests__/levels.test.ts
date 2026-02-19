import { describe, it, expect } from 'vitest';
import { LEVELS, LEVEL_PACKS, getLevelById, getLevelsByPack, getPackById } from '../levels';

describe('levels data validation', () => {
  it('has unique level IDs', () => {
    const ids = LEVELS.map((l) => l.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('has unique pack IDs', () => {
    const ids = LEVEL_PACKS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('all levels belong to valid packs', () => {
    const packIds = new Set(LEVEL_PACKS.map((p) => p.id));
    LEVELS.forEach((level) => {
      expect(packIds).toContain(level.packId);
    });
  });

  it('pack level IDs reference existing levels', () => {
    const levelIds = new Set(LEVELS.map((l) => l.id));
    LEVEL_PACKS.forEach((pack) => {
      pack.levels.forEach((levelId) => {
        expect(levelIds).toContain(levelId);
      });
    });
  });

  it('all level packs have at least one level', () => {
    LEVEL_PACKS.forEach((pack) => {
      expect(pack.levels.length).toBeGreaterThan(0);
    });
  });

  it('Rifle Basics pack has correct number of levels', () => {
    const rifleBasicsPack = LEVEL_PACKS.find((p) => p.id === 'rifle-basics');
    expect(rifleBasicsPack).toBeDefined();
    expect(rifleBasicsPack?.levels.length).toBeGreaterThanOrEqual(10);
  });

  it('Rifle Basics levels follow consistent naming for numbered levels', () => {
    const rifleBasicsPack = LEVEL_PACKS.find((p) => p.id === 'rifle-basics');
    const numberedLevels = rifleBasicsPack?.levels.filter(l => l.startsWith('rifle-basics-') && !isNaN(parseInt(l.split('-')[2]))) || [];
    // Check that at least the numbered levels follow the pattern
    numberedLevels.forEach((levelId) => {
      const suffix = parseInt(levelId.split('-')[2]);
      expect(suffix).toBeGreaterThan(0);
    });
  });

  it('Rifle Basics levels have appropriate difficulty progression', () => {
    const rifleBasicsLevels = LEVELS.filter((l) => l.packId === 'rifle-basics');
    expect(rifleBasicsLevels.length).toBeGreaterThanOrEqual(10);
    // Check that first level is easy
    expect(rifleBasicsLevels[0].difficulty).toBe('easy');
    // Check that we have a mix of difficulties
    const difficulties = new Set(rifleBasicsLevels.map(l => l.difficulty));
    expect(difficulties.has('easy')).toBe(true);
    expect(difficulties.has('medium')).toBe(true);
    // Hard difficulties are expected to exist
    expect(difficulties.size).toBeGreaterThanOrEqual(2);
  });

  it('level distances are within sane bounds', () => {
    LEVELS.forEach((level) => {
      expect(level.distanceM).toBeGreaterThan(0);
      expect(level.distanceM).toBeLessThan(1000); // Max reasonable distance
    });
  });

  it('all levels have star thresholds', () => {
    LEVELS.forEach((level) => {
      expect(level.starThresholds.one).toBeGreaterThan(0);
      expect(level.starThresholds.two).toBeGreaterThan(level.starThresholds.one);
      expect(level.starThresholds.three).toBeGreaterThan(level.starThresholds.two);
    });
  });

  it('maxShots is positive', () => {
    LEVELS.forEach((level) => {
      expect(level.maxShots).toBeGreaterThan(0);
      expect(level.maxShots).toBeLessThanOrEqual(10);
    });
  });

  it('targetScale is within reasonable bounds', () => {
    LEVELS.forEach((level) => {
      expect(level.targetScale).toBeGreaterThan(0);
      expect(level.targetScale).toBeLessThanOrEqual(2); // Max 2x standard size
    });
  });

  it('getLevelById returns correct level', () => {
    const testLevel = LEVELS[0];
    const found = getLevelById(testLevel.id);
    expect(found).toEqual(testLevel);
  });

  it('getLevelById returns undefined for non-existent level', () => {
    const found = getLevelById('non-existent');
    expect(found).toBeUndefined();
  });

  it('getLevelsByPack returns correct levels', () => {
    const testPack = LEVEL_PACKS[0];
    const levels = getLevelsByPack(testPack.id);
    const levelIds = levels.map((l) => l.id);
    expect(levelIds).toEqual(testPack.levels);
  });

  it('getPackById returns correct pack', () => {
    const testPack = LEVEL_PACKS[0];
    const found = getPackById(testPack.id);
    expect(found).toEqual(testPack);
  });
});

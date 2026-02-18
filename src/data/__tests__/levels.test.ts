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

  it('Rifle Basics pack has exactly 10 levels', () => {
    const rifleBasicsPack = LEVEL_PACKS.find((p) => p.id === 'rifle-basics');
    expect(rifleBasicsPack).toBeDefined();
    expect(rifleBasicsPack?.levels.length).toBe(10);
  });

  it('Rifle Basics levels follow consistent naming', () => {
    const rifleBasicsPack = LEVEL_PACKS.find((p) => p.id === 'rifle-basics');
    rifleBasicsPack?.levels.forEach((levelId, index) => {
      expect(levelId).toBe(`rifle-basics-${index + 1}`);
    });
  });

  it('Rifle Basics levels have increasing difficulty', () => {
    const rifleBasicsLevels = LEVELS.filter((l) => l.packId === 'rifle-basics');
    expect(rifleBasicsLevels.length).toBe(10);
    expect(rifleBasicsLevels[0].difficulty).toBe('easy');
    expect(rifleBasicsLevels[2].difficulty).toBe('easy');
    expect(rifleBasicsLevels[3].difficulty).toBe('medium');
    expect(rifleBasicsLevels[6].difficulty).toBe('medium');
    expect(rifleBasicsLevels[7].difficulty).toBe('hard');
    expect(rifleBasicsLevels[9].difficulty).toBe('hard');
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

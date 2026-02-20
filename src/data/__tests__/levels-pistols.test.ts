import { describe, it, expect } from 'vitest';
import { LEVELS, getLevelById, getPackById } from '../levels';

describe('pistols pack data', () => {
  describe('pistols pack exists', () => {
    it('pistols pack is in LEVEL_PACKS', () => {
      const pack = getPackById('pistols');
      expect(pack).toBeDefined();
      expect(pack?.id).toBe('pistols');
      expect(pack?.name).toBe('Pistols');
      expect(pack?.weaponType).toBe('pistol');
    });

    it('pistols pack has 10 levels', () => {
      const pack = getPackById('pistols');
      expect(pack?.levels).toHaveLength(10);
    });

    it('pistols pack has correct level ids', () => {
      const pack = getPackById('pistols');
      const expectedLevelIds = [
        'pistols-1-cqc', 'pistols-2-wind-adapt', 'pistols-3-rapid-fire',
        'pistols-4-close-wind', 'pistols-5-timed-string', 'pistols-6-switch-draw',
        'pistols-7-gusty-urban', 'pistols-8-pressure-point', 'pistols-9-double-tap',
        'pistols-10-urban-engage',
      ];
      
      expect(pack?.levels).toEqual(expectedLevelIds);
    });
  });

  describe('pistols levels exist', () => {
    it('all 10 pistol levels exist in LEVELS', () => {
      const pack = getPackById('pistols');
      pack?.levels.forEach(levelId => {
        const level = getLevelById(levelId);
        expect(level).toBeDefined();
        expect(level?.packId).toBe('pistols');
      });
    });

    it('all pistol levels have correct packId', () => {
      const pistolLevels = LEVELS.filter(l => l.packId === 'pistols');
      expect(pistolLevels).toHaveLength(10);

      pistolLevels.forEach(level => {
        expect(level.requiredWeaponType).toBe('pistol');
        expect(level.unlocked).toBe(true);
      });
    });

    it('all pistol levels have valid distances (25-50m)', () => {
      const pistolLevels = LEVELS.filter(l => l.packId === 'pistols');
      pistolLevels.forEach(level => {
        expect(level.distanceM).toBeGreaterThanOrEqual(25);
        expect(level.distanceM).toBeLessThanOrEqual(50);
      });
    });

    it('has increasing difficulty progression', () => {
      const pack = getPackById('pistols');
      
      const levels = pack?.levels.map(id => getLevelById(id)) || [];
      
      // Level 1-2: easy
      expect(levels[0]?.difficulty).toBe('easy');
      expect(levels[1]?.difficulty).toBe('easy');
      
      // Level 3-6: medium
      expect(levels[2]?.difficulty).toBe('medium');
      expect(levels[3]?.difficulty).toBe('medium');
      expect(levels[4]?.difficulty).toBe('medium');
      expect(levels[5]?.difficulty).toBe('medium');
      
      // Level 7-9: hard
      expect(levels[6]?.difficulty).toBe('hard');
      expect(levels[7]?.difficulty).toBe('hard');
      expect(levels[8]?.difficulty).toBe('hard');
      
      // Level 10: expert
      expect(levels[9]?.difficulty).toBe('expert');
    });

    it('timed levels have timerSeconds defined', () => {
      const timedLevels = LEVELS.filter(l => 
        l.packId === 'pistols' && l.timerSeconds !== undefined
      );
      
      expect(timedLevels.length).toBeGreaterThan(0);
      
      timedLevels.forEach(level => {
        expect(level.timerSeconds).toBeGreaterThan(0);
        expect(level.targetMode).toBe('plates');
      });
    });

    it('plate levels have targets defined', () => {
      const plateLevels = LEVELS.filter(l => 
        l.packId === 'pistols' && l.targetMode === 'plates'
      );
      
      expect(plateLevels.length).toBeGreaterThan(0);
      
      plateLevels.forEach(level => {
        expect(level.targets).toBeDefined();
        expect(level.targets?.length).toBeGreaterThan(0);
        expect(level.targets?.length).toBeLessThanOrEqual(5);
        
        level.targets?.forEach(target => {
          expect(target.id).toMatch(/^p\d+-\d+$/);
          expect(target.points).toBeGreaterThan(0);
          expect(target.radiusM).toBeGreaterThan(0);
        });
      });
    });

    it('all pistol levels have valid star thresholds', () => {
      const pistolLevels = LEVELS.filter(l => l.packId === 'pistols');
      
      pistolLevels.forEach(level => {
        expect(level.starThresholds.one).toBeGreaterThan(0);
        expect(level.starThresholds.two).toBeGreaterThan(level.starThresholds.one);
        expect(level.starThresholds.three).toBeGreaterThan(level.starThresholds.two);
      });
    });

    it('higher difficulty levels have smaller target scale', () => {
      const pistolLevels = LEVELS.filter(l => l.packId === 'pistols');
      const easyLevels = pistolLevels.filter(l => l.difficulty === 'easy');
      const expertLevels = pistolLevels.filter(l => l.difficulty === 'expert');
      
      const avgEasyScale = easyLevels.reduce((sum, l) => sum + l.targetScale, 0) / easyLevels.length;
      const avgExpertScale = expertLevels.reduce((sum, l) => sum + l.targetScale, 0) / expertLevels.length;
      
      expect(avgExpertScale).toBeLessThan(avgEasyScale);
    });
  });

  describe('level pack integrity', () => {
    it('all levels in pack are unlocked', () => {
      const pack = getPackById('pistols');
      pack?.levels.forEach(levelId => {
        const level = getLevelById(levelId);
        expect(level?.unlocked).toBe(true);
      });
    });

    it('all level ids are unique across entire game', () => {
      const allIds = LEVELS.map(l => l.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    it('pistols pack levels follow naming convention', () => {
      const pack = getPackById('pistols');
      pack?.levels.forEach(levelId => {
        expect(levelId).toMatch(/^pistols-\d+-[a-z-]+$/);
      });
    });
  });
});

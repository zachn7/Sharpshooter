import { describe, it, expect } from 'vitest';
import { DRILLS, generateDrillScenario } from '../drills';

describe('drills data', () => {
  describe('DRills array', () => {
    it('exports exactly 4 drills', () => {
      expect(DRILLS).toHaveLength(4);
    });

    it('has required drill types', () => {
      const drillTypes = DRILLS.map(d => d.id);
      expect(drillTypes).toContain('wind-ladder');
      expect(drillTypes).toContain('holdover-ladder');
      expect(drillTypes).toContain('cold-bore');
      expect(drillTypes).toContain('speed-plates');
    });

    it('each drill has required properties', () => {
      DRILLS.forEach(drill => {
        expect(drill).toHaveProperty('id');
        expect(drill).toHaveProperty('name');
        expect(drill).toHaveProperty('description');
        expect(drill).toHaveProperty('type');
        expect(drill).toHaveProperty('maxShots');
        expect(drill.id).toBeTypeOf('string');
        expect(drill.name).toBeTypeOf('string');
        expect(drill.description).toBeTypeOf('string');
        expect(drill.type).toBeOneOf(['wind-ladder', 'holdover-ladder', 'cold-bore', 'speed-plates']);
        expect(drill.maxShots).toBeGreaterThan(0);
      });
    });
  });

  describe('scenario generation determinism', () => {
    it('generates consistent scenarios for same drill and attempt', () => {
      const scenario1 = generateDrillScenario('wind-ladder', 1);
      const scenario2 = generateDrillScenario('wind-ladder', 1);

      expect(scenario1).toEqual(scenario2);
    });

    it('generates different scenarios for different attempts', () => {
      const scenario1 = generateDrillScenario('cold-bore', 1);
      const scenario2 = generateDrillScenario('cold-bore', 2);

      expect(scenario1.seed).not.toBe(scenario2.seed);
    });

    it('wind-ladder generates valid scenario', () => {
      const scenario = generateDrillScenario('wind-ladder', 1);

      expect(scenario.id).toBe('wind-ladder');
      expect(scenario.maxShots).toBe(6);
      expect(scenario.distanceM).toBe(150);
      expect(scenario.targetMode).toBe('bullseye');
      expect(scenario.plates).toBeUndefined();
      expect(scenario.timeLimit).toBeUndefined();
      expect(Math.abs(scenario.windMps)).toBeGreaterThanOrEqual(5);
      expect(Math.abs(scenario.windMps)).toBeLessThanOrEqual(8);
    });

    it('holdover-ladder generates valid scenario', () => {
      const scenario = generateDrillScenario('holdover-ladder', 1);

      expect(scenario.id).toBe('holdover-ladder');
      expect(scenario.maxShots).toBe(5);
      expect(scenario.distanceM).toBe(150);
      expect(scenario.targetMode).toBe('bullseye');
      expect(scenario.plates).toBeUndefined();
      expect(scenario.timeLimit).toBeUndefined();
      expect(Math.abs(scenario.windMps)).toBe(3);
      expect(scenario.gustMps).toBe(0.5);
    });

    it('cold-bore generates valid scenario', () => {
      const scenario = generateDrillScenario('cold-bore', 1);

      expect(scenario.id).toBe('cold-bore');
      expect(scenario.maxShots).toBe(1);
      expect(scenario.distanceM).toBe(300);
      expect(scenario.targetMode).toBe('bullseye');
      expect(scenario.plates).toBeUndefined();
      expect(scenario.timeLimit).toBeUndefined();
      expect(scenario.windMps).toBeGreaterThanOrEqual(-8);
      expect(scenario.windMps).toBeLessThanOrEqual(8);
      expect(scenario.env.altitudeM).toBeGreaterThanOrEqual(0);
      expect(scenario.env.altitudeM).toBeLessThanOrEqual(2000);
    });

    it('speed-plates generates valid scenario', () => {
      const scenario = generateDrillScenario('speed-plates', 1);

      expect(scenario.id).toBe('speed-plates');
      expect(scenario.maxShots).toBe(10);
      expect(scenario.distanceM).toBe(100);
      expect(scenario.targetMode).toBe('plates');
      expect(scenario.timeLimit).toBe(30);
      expect(scenario.plates).toBeDefined();
      expect(scenario.plates).toHaveLength(5);
      
      scenario.plates?.forEach(plate => {
        expect(plate.id).toMatch(/^plate-\d+$/);
        expect(plate.x_M).toBeTypeOf('number');
        expect(plate.z_M).toBeTypeOf('number');
        expect(plate.points).toBe(2);
      });
      expect(Math.abs(scenario.windMps)).toBe(2);
    });

    it('throws error for unknown drill type', () => {
      expect(() => generateDrillScenario('unknown-drill', 1)).toThrow('Unknown drill type');
    });

    it('multiple calls with same seed produce identical results', () => {
      const scenarios = [];
      for (let i = 0; i < 10; i++) {
        scenarios.push(generateDrillScenario('wind-ladder', 5));
      }

      const first = scenarios[0];
      scenarios.slice(1).forEach(scenario => {
        expect(scenario).toEqual(first);
      });
    });
  });
});

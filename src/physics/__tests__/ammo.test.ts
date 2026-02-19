import { describe, it, expect } from 'vitest';
import { computeFinalShotParams, formatAmmoSummary } from '../ammo';
import { WEAPONS_CATALOG } from '../../data/weapons';
import { AMMO_CATALOG } from '../../data/ammo';

describe('ammo - computeFinalShotParams', () => {
  const rifle = WEAPONS_CATALOG.find(w => w.id === 'rifle-assault');
  const rifleMatch = AMMO_CATALOG.find(a => a.id === 'rifle-match');
  const rifleBudget = AMMO_CATALOG.find(a => a.id === 'rifle-budget');
  const rifleHeavy = AMMO_CATALOG.find(a => a.id === 'rifle-heavy');
  
  if (!rifle || !rifleMatch || !rifleBudget || !rifleHeavy) {
    throw new Error('Required test data not found');
  }

  it('aggregates weapon and match ammo params correctly', () => {
    const params = computeFinalShotParams(rifle, rifleMatch, 'realistic');
    
    // Match ammo should have no modifications (1.0 scale)
    expect(params.muzzleVelocityMps).toBeCloseTo(rifle.params.muzzleVelocityMps, 1);
    expect(params.dragFactor).toBeCloseTo(rifle.params.dragFactor, 5);
  });

  it('applies ammo velocity scaling', () => {
    const budgetParams = computeFinalShotParams(rifle, rifleBudget, 'realistic');
    const lightParams = computeFinalShotParams(
      rifle,
      AMMO_CATALOG.find(a => a.id === 'rifle-light')!,
      'realistic'
    );
    
    // Budget ammo reduces velocity
    expect(budgetParams.muzzleVelocityMps).toBeLessThan(rifle.params.muzzleVelocityMps);
    // Light ammo increases velocity
    expect(lightParams.muzzleVelocityMps).toBeGreaterThan(rifle.params.muzzleVelocityMps);
  });

  it('applies ammo drag scaling', () => {
    const matchParams = computeFinalShotParams(rifle, rifleMatch, 'realistic');
    const budgetParams = computeFinalShotParams(rifle, rifleBudget, 'realistic');
    
    // Match ammo improves (reduces) drag
    expect(matchParams.dragFactor).toBeLessThan(rifle.params.dragFactor);
    // Budget ammo increases drag
    expect(budgetParams.dragFactor).toBeGreaterThan(rifle.params.dragFactor);
  });

  it('applies ammo dispersion scaling', () => {
    const matchParams = computeFinalShotParams(rifle, rifleMatch, 'realistic');
    const budgetParams = computeFinalShotParams(rifle, rifleBudget, 'realistic');
    
    // Match ammo reduces dispersion (more accurate)
    expect(matchParams.dispersionGroupSizeM).toBeLessThan(
      budgetParams.dispersionGroupSizeM
    );
  });

  it('applies ammo recoil scaling', () => {
    const normalParams = computeFinalShotParams(rifle, rifleMatch, 'realistic');
    const heavyParams = computeFinalShotParams(rifle, rifleHeavy, 'realistic');
    
    // Heavy ammo increases recoil
    expect(heavyParams.recoilImpulseMils).toBeGreaterThan(normalParams.recoilImpulseMils);
  });

  it('applies realism preset drag scaling', () => {
    const arcadeParams = computeFinalShotParams(rifle, rifleMatch, 'arcade');
    const realisticParams = computeFinalShotParams(rifle, rifleMatch, 'realistic');
    const expertParams = computeFinalShotParams(rifle, rifleMatch, 'expert');
    
    // Arcade should have less drag
    expect(arcadeParams.dragFactor).toBeLessThan(realisticParams.dragFactor);
    // Expert should have more drag
    expect(expertParams.dragFactor).toBeGreaterThan(realisticParams.dragFactor);
  });

  it('handles null ammo by falling back to match grade', () => {
    const params = computeFinalShotParams(rifle, null, 'realistic');
    
    // Should not throw and should return valid params
    expect(params.muzzleVelocityMps).toBeGreaterThan(0);
    expect(params.dragFactor).toBeGreaterThan(0);
    expect(params.ammo).not.toBeNull();
    expect(params.ammo?.name).toContain('Match');
  });

  it('stores metadata for UI display', () => {
    const params = computeFinalShotParams(rifle, rifleMatch, 'realistic');
    
    expect(params.weapon).toBe(rifle);
    expect(params.ammo).toBe(rifleMatch);
  });
});

describe('ammo - formatAmmoSummary', () => {
  const rifleMatch = AMMO_CATALOG.find(a => a.id === 'rifle-match');
  const rifleLight = AMMO_CATALOG.find(a => a.id === 'rifle-light');
  const rifleBudget = AMMO_CATALOG.find(a => a.id === 'rifle-budget');
  const rifleHeavy = AMMO_CATALOG.find(a => a.id === 'rifle-heavy');
  
  if (!rifleMatch || !rifleLight || !rifleBudget || !rifleHeavy) {
    throw new Error('Required test data not found');
  }

  it('formats match ammo summary correctly', () => {
    const summary = formatAmmoSummary(rifleMatch);
    expect(summary).toContain('Vel: =');
    expect(summary).toContain('100%');
    expect(summary).toContain('Dispersion: ↑');
  });

  it('formats light ammo summary correctly', () => {
    const summary = formatAmmoSummary(rifleLight);
    expect(summary).toContain('Vel: +');
    expect(summary).toContain('Dispersion: ↑');
  });

  it('formats budget ammo summary correctly', () => {
    const summary = formatAmmoSummary(rifleBudget);
    expect(summary).toContain('Vel: −');
    expect(summary).toContain('Dispersion: ↓');
  });
});
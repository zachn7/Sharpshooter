import { test as base, expect } from '@playwright/test';

/**
 * Base fixture for test isolation.
 * Sets up deterministic defaults instead of clearing storage to allow
 * selections (like weapon choice) to persist within a single test across page navigations.
 */
export const test = base.extend<object, object>({});

export { expect };

const now = Date.now();
const unlockedLevelProgress = (stars = 1) => ({
  stars,
  bestScore: 10,
  attempts: 1,
  lastPlayedAt: now,
});

const E2E_DEFAULT_SAVE = {
  version: 20,
  selectedWeaponId: 'pistol-training',
  freeplaySelectedWeaponId: 'pistol-training',
  // Keep this high enough to unlock most packs used in E2E.
  // Enough to unlock ELR Pack (level 12) + everything the suite touches.
  profileXp: 2475,
  levelProgress: {
    'pistol-calm': unlockedLevelProgress(),
    'pistol-windy': unlockedLevelProgress(),
    'pistol-gusty': unlockedLevelProgress(),
    'rifle-basics-1': unlockedLevelProgress(),
    'rifle-basics-2': unlockedLevelProgress(),
    'rifle-basics-3': unlockedLevelProgress(),
    'rifle-basics-4': unlockedLevelProgress(),
    'rifle-basics-5': unlockedLevelProgress(),
    'rifle-basics-6': unlockedLevelProgress(),
    'rifle-basics-7': unlockedLevelProgress(),
    'rifle-basics-8': unlockedLevelProgress(),
    'rifle-basics-9': unlockedLevelProgress(),
    'rifle-basics-10': unlockedLevelProgress(),
    'rifle-basics-plates': unlockedLevelProgress(),
    'sniper-calm': unlockedLevelProgress(),
    'sniper-windy': unlockedLevelProgress(),
    'sniper-gale': unlockedLevelProgress(),
    // Unlocking the level doesn't change the loadout; we'll pick shotgun per-test.
    'shotgun-intro': unlockedLevelProgress(),
  },
  unlockedWeapons: [
    'pistol-training',
    'pistol-competition',
    'pistol-viper',
    'rifle-assault',
    'rifle-carbine',
    'shotgun-pump',
    'shotgun-semi',
    'sniper-bolt',
    'sniper-marksman',
    'elr-sniper',
  ],

  settings: {
    realismPreset: 'realistic',
    showShotTrace: false,
    showMilOffset: false,
    showHud: true,
    showNumericWind: false,
    hudMode: 'basic',
    aimSmoothingEnabled: false,
    aimSmoothingFactor: 0.3,
    arcadeCoachEnabled: false,
    zeroRangeShotLimitMode: 'unlimited',
    expertSpinDriftEnabled: false,
    expertCoriolisEnabled: false,
    audio: {
      masterVolume: 0.5,
      isMuted: false,
      reducedAudio: true,
    },
    vfx: {
      reducedMotion: true,
      reducedFlash: true,
      recordShotPath: false,
    },
    reticle: {
      style: 'simple',
      thickness: 2,
      centerDot: true,
    },
    display: {
      offsetUnit: 'mil',
    },
    mobile: {
      showFireButton: false,
      thumbAimMode: false,
    },
  },
  turretStates: {},
  zeroProfiles: {},
  selectedAmmoId: {},
  stats: {
    totalShotsFired: 0,
    totalBullseyes: 0,
    totalCenters: 0,
    averageOffsetMils: 0,
    bestGroupSizeMils: 999,
    levelsCompleted: 0,
    packsCompleted: 0,
    dailyChallengesCompleted: 0,
    totalPlayTimeMs: 0,
    longestStreak: 0,
    currentStreak: 0,
    lastPlayDate: null,
  },
  achievements: {},
  reticleSkinId: 'classic',
};

// Set up deterministic test defaults before each test
test.beforeEach(async ({ page }) => {
  const seedId = `${Date.now()}-${Math.random()}`;

  await page.addInitScript(({ save, seedId: currentSeedId }) => {
    const overrideRaw = window.localStorage.getItem('__e2e_save_override__');
    const marker = window.localStorage.getItem('__e2e_seed_marker__');
    const existingSave = window.localStorage.getItem('sharpshooter_save');
    const existingVersion = window.localStorage.getItem('sharpshooter_schema_version');
    const seededThisSession = window.sessionStorage.getItem('__e2e_seed_id__') === currentSeedId;

    // Important: some tests call localStorage.clear() mid-test without clearing sessionStorage.
    // If that happens and the app recreates a default save via client-side routing, we still want
    // the next hard navigation (page.goto) to restore our deterministic save.
    const shouldForceSeed = marker !== currentSeedId;
    const needsSeed = Boolean(overrideRaw) || shouldForceSeed || !seededThisSession || !existingSave || !existingVersion;

    if (needsSeed) {
      let saveToUse = save;

      if (overrideRaw) {
        try {
          saveToUse = JSON.parse(overrideRaw);
        } catch {
          // If override is junk, ignore it and fall back to default.
          saveToUse = save;
        }
      }

      const createdAt = Date.now();
      window.localStorage.setItem(
        'sharpshooter_save',
        JSON.stringify({
          ...saveToUse,
          createdAt,
          updatedAt: createdAt,
        })
      );
      window.localStorage.setItem('sharpshooter_schema_version', String(saveToUse.version));
      window.localStorage.setItem('__e2e_seed_marker__', currentSeedId);
      window.sessionStorage.setItem('__e2e_seed_id__', currentSeedId);

      if (overrideRaw) {
        window.localStorage.removeItem('__e2e_save_override__');
      }
    }
  }, { save: E2E_DEFAULT_SAVE, seedId });
});

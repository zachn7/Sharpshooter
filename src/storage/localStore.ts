// Current schema version
export const CURRENT_SCHEMA_VERSION = 6;

// Turret state (imported type)
export interface TurretState {
  elevationMils: number;
  windageMils: number;
}

// Zeroing profile for a weapon
export interface ZeroProfile {
  zeroDistanceM: number;      // Distance at zero (e.g., 25, 50, 100, 200)
  zeroElevationMils: number;   // Elevation dial setting at zero
  zeroWindageMils: number;     // Windage dial setting at zero
}

// Storage keys
const STORAGE_KEY = 'sharpshooter_save';
const VERSION_KEY = 'sharpshooter_schema_version';
const TUTORIALS_KEY = 'sharpshooter_tutorials_seen';

// Level progress record
export interface LevelProgress {
  stars: 0 | 1 | 2 | 3;
  bestScore: number;
  attempts: number;
  lastPlayedAt: number;
}

// Realism presets
export type RealismPreset = 'arcade' | 'realistic' | 'expert';

// Zero Range shot limit mode
export type ZeroRangeShotLimitMode = 'unlimited' | 'three';

// Game settings
export interface GameSettings {
  realismPreset: RealismPreset;
  showShotTrace: boolean;
  showMilOffset: boolean;
  showHud: boolean;
  showNumericWind: boolean; // Show numeric wind values (arcade default true, others false)
  zeroRangeShotLimitMode: ZeroRangeShotLimitMode;
}

// Complete game save data
export interface GameSave {
  version: number;
  selectedWeaponId: string;
  levelProgress: Record<string, LevelProgress>;
  unlockedWeapons: string[];
  settings: GameSettings;
  turretStates: Record<string, TurretState>; // Per-weapon turret state
  zeroProfiles: Record<string, ZeroProfile>; // Per-weapon zero profiles
  createdAt: number;
  updatedAt: number;
}

// Schema migration types
type Migration = (data: unknown) => unknown;

// Migrations array - will be expanded as schema evolves
const MIGRATIONS: Migration[] = [
  // v0 -> v1: Initial structure (no-op)
  (data) => data,
  // v1 -> v2: Add settings field with defaults
  (data) => {
    const save = data as GameSave;
    return {
      ...save,
      version: 2,
      settings: save.settings || {
        realismPreset: 'realistic',
        showShotTrace: false,
        showMilOffset: false,
        showHud: true,
      },
    };
  },
  // v2 -> v3: Add turretStates field with empty defaults
  (data) => {
    const save = data as GameSave;
    return {
      ...save,
      version: 3,
      turretStates: save.turretStates || {},
    };
  },
  // v3 -> v4: Add zeroProfiles field with empty defaults
  (data) => {
    const save = data as GameSave;
    return {
      ...save,
      version: 4,
      zeroProfiles: save.zeroProfiles || {},
    };
  },
  // v4 -> v5: Add zeroRangeShotLimitMode to settings
  (data) => {
    const save = data as GameSave;
    return {
      ...save,
      version: 5,
      settings: save.settings ? {
        ...save.settings,
        zeroRangeShotLimitMode: save.settings.zeroRangeShotLimitMode || 'unlimited',
      } : save.settings,
    };
  },
  // v5 -> v6: Add showNumericWind to settings
  (data) => {
    const save = data as GameSave;
    return {
      ...save,
      version: 6,
      settings: save.settings ? {
        ...save.settings,
        showNumericWind: save.settings.showNumericWind ?? false, // Default to false
      } : save.settings,
    };
  },
];

// Internal storage helpers - safe for testing environment
const storage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, value);
    } catch {
      // Silently fail in test environment
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem(key);
    } catch {
      // Silently fail
    }
  },
};

/**
 * Validate GameSave schema
 */
function validateGameSave(data: unknown): data is GameSave {
  if (!data || typeof data !== 'object') return false;
  
  const save = data as GameSave;
  
  return (
    typeof save.version === 'number' &&
    typeof save.selectedWeaponId === 'string' &&
    typeof save.levelProgress === 'object' &&
    Array.isArray(save.unlockedWeapons) &&
    typeof save.settings === 'object' &&
    typeof save.turretStates === 'object' &&
    typeof save.zeroProfiles === 'object' &&
    typeof save.createdAt === 'number' &&
    typeof save.updatedAt === 'number'
  );
}

/**
 * Migrate data from older schema versions
 */
function migrateData(data: unknown, fromVersion: number, toVersion: number): unknown {
  let current = typeof data === 'object' && data !== null ? { ...data } : data;
  
  for (let i = fromVersion; i < toVersion; i++) {
    if (MIGRATIONS[i]) {
      current = MIGRATIONS[i](current);
    }
  }
  
  return current;
}

/**
 * Create a fresh save with default values
 */
function createDefaultSave(): GameSave {
  const now = Date.now();
  
  return {
    version: CURRENT_SCHEMA_VERSION,
    selectedWeaponId: 'pistol-training',
    levelProgress: {},
    unlockedWeapons: ['pistol-training'],
    settings: {
      realismPreset: 'realistic',
      showShotTrace: false,
      showMilOffset: false,
      showHud: true,
      showNumericWind: false, // Default to false for realistic preset
      zeroRangeShotLimitMode: 'unlimited',
    },
    turretStates: {},
    zeroProfiles: {},
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get current game settings
 */
export function getGameSettings(): GameSettings {
  const save = getOrCreateGameSave();
  return save.settings;
}

/**
 * Update game settings
 */
export function updateGameSettings(settings: Partial<GameSettings>): GameSave {
  const save = getOrCreateGameSave();
  const updated = {
    ...save.settings,
    ...settings,
  };
  save.settings = updated;
  saveGameSave(save);
  return save;
}

/**
 * Get realism preset scaling factors
 */
export function getRealismScaling(preset: RealismPreset): { dragScale: number; windScale: number } {
  switch (preset) {
    case 'arcade':
      return { dragScale: 0.5, windScale: 0.5 }; // Easier - less wind and drag
    case 'expert':
      return { dragScale: 1.2, windScale: 1.3 }; // Harder - more wind and drag
    case 'realistic':
    default:
      return { dragScale: 1.0, windScale: 1.0 }; // Baseline
  }
}

/**
 * Get turret state for a specific weapon
 */
export function getTurretState(weaponId: string): TurretState {
  const save = getOrCreateGameSave();
  return save.turretStates[weaponId] || {
    elevationMils: 0.0,
    windageMils: 0.0,
  };
}

/**
 * Update turret state for a specific weapon
 */
export function updateTurretState(weaponId: string, turretState: TurretState): GameSave {
  const save = getOrCreateGameSave();
  save.turretStates[weaponId] = turretState;
  save.updatedAt = Date.now();
  saveGameSave(save);
  return save;
}

/**
 * Reset turret state for a specific weapon
 */
export function resetTurretStateForWeapon(weaponId: string): GameSave {
  const save = getOrCreateGameSave();
  save.turretStates[weaponId] = {
    elevationMils: 0.0,
    windageMils: 0.0,
  };
  save.updatedAt = Date.now();
  saveGameSave(save);
  return save;
}

/**
 * Get zero profile for a weapon
 */
export function getZeroProfile(weaponId: string): ZeroProfile | null {
  const save = getOrCreateGameSave();
  return save.zeroProfiles[weaponId] || null;
}

/**
 * Save zero profile for a weapon
 */
export function saveZeroProfile(weaponId: string, profile: ZeroProfile): GameSave {
  const save = getOrCreateGameSave();
  save.zeroProfiles[weaponId] = profile;
  save.updatedAt = Date.now();
  saveGameSave(save);
  return save;
}

/**
 * Delete zero profile for a weapon
 */
export function deleteZeroProfile(weaponId: string): GameSave {
  const save = getOrCreateGameSave();
  delete save.zeroProfiles[weaponId];
  save.updatedAt = Date.now();
  saveGameSave(save);
  return save;
}

/**
 * Get default zero distance for a weapon
 * Returns 0 if no profile exists
 */
export function getZeroDistance(weaponId: string): number {
  const profile = getZeroProfile(weaponId);
  return profile ? profile.zeroDistanceM : 0;
}

/**
 * Load game save from localStorage with migration support
 */
export function loadGameSave(): GameSave | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    
    const data = JSON.parse(raw) as unknown;
    
    // Check schema version and migrate if needed
    const version = storage.getItem(VERSION_KEY);
    const storedVersion = version ? parseInt(version, 10) : 0;
    
    if (storedVersion < CURRENT_SCHEMA_VERSION) {
      const migrated = migrateData(data, storedVersion, CURRENT_SCHEMA_VERSION) as GameSave;
      if (validateGameSave(migrated)) {
        storage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        storage.setItem(VERSION_KEY, CURRENT_SCHEMA_VERSION.toString());
        return migrated;
      }
      return null;
    }
    
    return validateGameSave(data) ? data : null;
  } catch {
    return null;
  }
}

/**
 * Save game data to localStorage
 */
export function saveGameSave(save: GameSave): boolean {
  try {
    if (!validateGameSave(save)) {
      return false;
    }
    
    const toSave = {
      ...save,
      updatedAt: Date.now(),
    };
    
    storage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    storage.setItem(VERSION_KEY, CURRENT_SCHEMA_VERSION.toString());
    return true;
  } catch {
    return false;
  }
}

/**
 * Get or create game save (never returns null)
 */
export function getOrCreateGameSave(): GameSave {
  const existing = loadGameSave();
  if (existing) return existing;
  
  const fresh = createDefaultSave();
  saveGameSave(fresh);
  return fresh;
}

/**
 * Update level progress
 */
export function updateLevelProgress(levelId: string, score: number, starThresholds: { one: number; two: number; three: number }): GameSave {
  const save = getOrCreateGameSave();
  
  const existing = save.levelProgress[levelId];
  const bestScore = existing ? Math.max(existing.bestScore, score) : score;
  const attempts = existing ? existing.attempts + 1 : 1;
  
  // Calculate stars based on best score
  let stars: 0 | 1 | 2 | 3;
  if (bestScore >= starThresholds.three) stars = 3;
  else if (bestScore >= starThresholds.two) stars = 2;
  else if (bestScore >= starThresholds.one) stars = 1;
  else stars = 0;
  
  save.levelProgress[levelId] = {
    stars,
    bestScore,
    attempts,
    lastPlayedAt: Date.now(),
  };
  
  saveGameSave(save);
  return save;
}

/**
 * Get level progress
 */
export function getLevelProgress(levelId: string): LevelProgress | undefined {
  const save = loadGameSave();
  return save?.levelProgress[levelId];
}

/**
 * Set selected weapon
 */
export function setSelectedWeapon(weaponId: string): boolean {
  const save = getOrCreateGameSave();
  save.selectedWeaponId = weaponId;
  return saveGameSave(save);
}

/**
 * Get selected weapon ID
 */
export function getSelectedWeaponId(): string {
  const save = loadGameSave();
  return save?.selectedWeaponId || 'pistol-training';
}

/**
 * Clear all save data (for testing/reset)
 */
export function clearSaveData(): void {
  storage.removeItem(STORAGE_KEY);
  storage.removeItem(VERSION_KEY);
}

/**
 * Get total stars earned
 */
export function getTotalStars(): number {
  const save = loadGameSave();
  if (!save) return 0;
  
  return Object.values(save.levelProgress).reduce((sum, p) => sum + p.stars, 0);
}

/**
 * Get stars earned in a specific pack
 */
export function getPackStars(packLevels: string[]): number {
  const save = loadGameSave();
  if (!save) return 0;
  
  return packLevels.reduce((sum, levelId) => {
    const progress = save.levelProgress[levelId];
    return sum + (progress?.stars || 0);
  }, 0);
}

/**
 * Get max possible stars for a pack
 */
export function getPackMaxStars(packLevels: string[]): number {
  return packLevels.length * 3;
}

/**
 * Check if a level is unlocked based on previous level progress
 * @param levelId - Current level ID
 * @param allLevelIds - Array of all level IDs in order
 * @returns true if level is unlocked
 */
export function isLevelUnlocked(levelId: string, allLevelIds: string[]): boolean {
  // Find the index of the current level
  const currentIndex = allLevelIds.indexOf(levelId);
  
  // First level is always unlocked
  if (currentIndex <= 0) return true;
  
  const save = loadGameSave();
  if (!save) return false;
  
  // Check if the previous level has at least 1 star
  const previousLevelId = allLevelIds[currentIndex - 1];
  const previousProgress = save.levelProgress[previousLevelId];
  
  return (previousProgress?.stars ?? 0) >= 1;
}

/**
 * Get all unlocked level IDs
 * @param allLevelIds - Array of all level IDs in order
 * @returns Array of unlocked level IDs
 */
export function getUnlockedLevels(allLevelIds: string[]): string[] {
  return allLevelIds.filter((levelId) => isLevelUnlocked(levelId, allLevelIds));
}

/**
 * Get tutorials seen from localStorage
 * @returns Set of tutorial IDs that have been seen
 */
export function getTutorialsSeen(): Set<string> {
  try {
    const raw = storage.getItem(TUTORIALS_KEY);
    if (!raw) return new Set();
    const data = JSON.parse(raw) as string[];
    return new Set(data);
  } catch {
    return new Set();
  }
}

/**
 * Mark a tutorial as seen
 * @param tutorialId - The tutorial ID to mark as seen
 */
export function markTutorialSeen(tutorialId: string): void {
  const seen = getTutorialsSeen();
  seen.add(tutorialId);
  storage.setItem(TUTORIALS_KEY, JSON.stringify(Array.from(seen)));
}

/**
 * Check if a tutorial has been seen
 * @param tutorialId - The tutorial ID to check
 * @returns true if tutorial has been seen
 */
export function hasTutorialBeenSeen(tutorialId: string): boolean {
  return getTutorialsSeen().has(tutorialId);
}

/**
 * Clear tutorials seen (for testing/reset)
 */
export function clearTutorialsSeen(): void {
  storage.removeItem(TUTORIALS_KEY);
}

/**
 * Get zero range shot limit mode
 * @returns Current shot limit mode for Zero Range
 */
export function getZeroRangeShotLimitMode(): ZeroRangeShotLimitMode {
  const settings = getGameSettings();
  return settings.zeroRangeShotLimitMode || 'unlimited';
}

/**
 * Set zero range shot limit mode
 * @param mode - New shot limit mode
 */
export function setZeroRangeShotLimitMode(mode: ZeroRangeShotLimitMode): void {
  updateGameSettings({ zeroRangeShotLimitMode: mode });
}

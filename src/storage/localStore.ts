// Current schema version
export const CURRENT_SCHEMA_VERSION = 1;

// Storage keys
const STORAGE_KEY = 'sharpshooter_save';
const VERSION_KEY = 'sharpshooter_schema_version';

// Level progress record
export interface LevelProgress {
  stars: 0 | 1 | 2 | 3;
  bestScore: number;
  attempts: number;
  lastPlayedAt: number;
}

// Complete game save data
export interface GameSave {
  version: number;
  selectedWeaponId: string;
  levelProgress: Record<string, LevelProgress>;
  unlockedWeapons: string[];
  createdAt: number;
  updatedAt: number;
}

// Schema migration types
type Migration = (data: unknown) => unknown;

// Migrations array - will be expanded as schema evolves
const MIGRATIONS: Migration[] = [
  // v0 -> v1: Initial structure (no-op)
  (data) => data,
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
    createdAt: now,
    updatedAt: now,
  };
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
      const migrated = migrateData(data, storedVersion, CURRENT_SCHEMA_VERSION);
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

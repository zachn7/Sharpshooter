// Current schema version
export const CURRENT_SCHEMA_VERSION = 12;

// Daily Challenge key
const DAILY_CHALLENGE_KEY = 'sharpshooter_daily_challenge';

// Daily Challenge result record
export interface DailyChallengeResult {
  date: string;            // YYYY-MM-DD format
  score: number;
  stars: 0 | 1 | 2 | 3;
  groupSizeMeters: number; // Precision metric
  weaponId: string;
  ammoId: string | null;
  completedAt: number;     // Timestamp when completed
}

// Daily Challenge storage
export interface DailyChallengeStore {
  results: DailyChallengeResult[]; // List of completed challenges
  lastPlayed: string | null;       // Last played date (YYYY-MM-DD)
}

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

// Audio settings
export interface AudioSettings {
  masterVolume: number; // 0.0 to 1.0
  isMuted: boolean;
  reducedAudio: boolean; // Quieter sounds
}

// VFX accessibility settings
export interface VFXSettings {
  reducedMotion: boolean; // Disable trails, flash, screen shake
  reducedFlash: boolean; // Disable muzzle flash specifically
  recordShotPath: boolean; // Record shot path for replay (off by default for performance)
}

// Game settings
export interface GameSettings {
  realismPreset: RealismPreset;
  showShotTrace: boolean;
  showMilOffset: boolean;
  showHud: boolean;
  showNumericWind: boolean; // Show numeric wind values (arcade default true, others false)
  zeroRangeShotLimitMode: ZeroRangeShotLimitMode;
  expertSpinDriftEnabled: boolean; // Enable spin drift simulation (Expert only, off by default)
  expertCoriolisEnabled: boolean; // Enable Coriolis effect simulation (Expert only, off by default)
  audio: AudioSettings; // Audio settings
  vfx: VFXSettings; // VFX accessibility settings
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
  selectedAmmoId: Record<string, string>; // Per-weapon selected ammo
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
        showNumericWind: false,
        zeroRangeShotLimitMode: 'unlimited',
        expertSpinDriftEnabled: false,
        expertCoriolisEnabled: false,
        audio: {
          masterVolume: 0.5,
          isMuted: false,
          reducedAudio: false,
        },
        vfx: {
          reducedMotion: false,
          reducedFlash: false,
          recordShotPath: false,
        },
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
  // v6 -> v7: Add selectedAmmoId field with empty defaults
  (data) => {
    const save = data as GameSave;
    return {
      ...save,
      version: 7,
      selectedAmmoId: save.selectedAmmoId || {},
    };
  },
  // v7 -> v8: No schema changes needed for daily challenge (separate storage)
  (data) => {
    const save = data as GameSave;
    return {
      ...save,
      version: 8,
    };
  },
  // v8 -> v9: Add expert sim extras settings
  (data) => {
    const save = data as GameSave;
    return {
      ...save,
      version: 9,
      settings: {
        ...save.settings,
        expertSpinDriftEnabled: save.settings.expertSpinDriftEnabled ?? false,
        expertCoriolisEnabled: save.settings.expertCoriolisEnabled ?? false,
      },
    };
  },
  // v9 -> v10: Add audio settings
  (data) => {
    const save = data as GameSave;
    return {
      ...save,
      version: 10,
      settings: {
        ...save.settings,
        audio: save.settings.audio ?? {
          masterVolume: 0.5,
          isMuted: false,
          reducedAudio: false,
        },
      },
    };
  },
  // v10 -> v11: Add VFX accessibility settings
  (data) => {
    const save = data as GameSave;
    return {
      ...save,
      version: 11,
      settings: {
        ...save.settings,
        vfx: save.settings.vfx ?? {
          reducedMotion: false,
          reducedFlash: false,
          recordShotPath: false,
        },
      },
    };
  },
  // v11 -> v12: Add recordShotPath setting
  (data) => {
    const save = data as GameSave;
    return {
      ...save,
      version: 12,
      settings: {
        ...save.settings,
        vfx: {
          ...save.settings.vfx,
          recordShotPath: save.settings.vfx?.recordShotPath ?? false,
        },
      },
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
    typeof save.selectedAmmoId === 'object' &&
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
      expertSpinDriftEnabled: false, // Expert extras off by default
      expertCoriolisEnabled: false, // Expert extras off by default
      audio: {
        masterVolume: 0.5,
        isMuted: false,
        reducedAudio: false,
      },
      vfx: {
        reducedMotion: false,
        reducedFlash: false,
        recordShotPath: false,
      },
    },
    turretStates: {},
    zeroProfiles: {},
    selectedAmmoId: {},
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

/**
 * Get selected ammo ID for a specific weapon
 * @param weaponId - The weapon ID
 * @returns Selected ammo ID, or null if none selected
 */
export function getSelectedAmmoId(weaponId: string): string | null {
  const save = loadGameSave();
  return save?.selectedAmmoId?.[weaponId] || null;
}

/**
 * Set selected ammo ID for a specific weapon
 * @param weaponId - The weapon ID
 * @param ammoId - The ammo ID to select
 * @returns Updated game save
 */
export function setSelectedAmmoId(weaponId: string, ammoId: string): GameSave {
  const save = getOrCreateGameSave();
  save.selectedAmmoId[weaponId] = ammoId;
  save.updatedAt = Date.now();
  saveGameSave(save);
  return save;
}

/**
 * Generate a deterministic seed from a date string (YYYY-MM-DD)
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns Numeric seed for deterministic random generation
 */
export function seedFromDate(dateStr: string): number {
  // Simple string hash for determinism
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get today's date string in YYYY-MM-DD format (local timezone)
 * @param overrideDate - Optional override date string for testing
 * @returns Today's date string
 */
export function getTodayDate(overrideDate?: string): string {
  if (overrideDate) {
    return overrideDate;
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get daily challenge storage data
 * @returns Daily challenge store or null if not found
 */
export function getDailyChallengeStore(): DailyChallengeStore | null {
  try {
    const raw = storage.getItem(DAILY_CHALLENGE_KEY);
    if (!raw) return null;
    
    const data = JSON.parse(raw) as DailyChallengeStore;
    
    // Basic validation
    if (!data.results || !Array.isArray(data.results)) {
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

/**
 * Save daily challenge result
 * @param result - The result to save
 */
export function saveDailyChallengeResult(result: DailyChallengeResult): void {
  const existing = getDailyChallengeStore() || { results: [], lastPlayed: null };
  
  // Remove any existing result for this date (will be replaced with new best)
  existing.results = existing.results.filter(r => r.date !== result.date);
  
  // Add new result
  existing.results.push(result);
  existing.lastPlayed = result.date;
  
  // Sort by date descending (newest first)
  existing.results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Keep only last 30 results to prevent storage bloat
  if (existing.results.length > 30) {
    existing.results = existing.results.slice(0, 30);
  }
  
  storage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(existing));
}

/**
 * Get best result for a specific date
 * @param date - Date string in YYYY-MM-DD format
 * @returns Best result or null if not completed
 */
export function getDailyChallengeResult(date: string): DailyChallengeResult | null {
  const store = getDailyChallengeStore();
  if (!store) return null;
  
  return store.results.find(r => r.date === date) || null;
}

/**
 * Get all daily challenge results
 * @returns Array of all results, sorted by date (newest first)
 */
export function getDailyChallengeResults(): DailyChallengeResult[] {
  const store = getDailyChallengeStore();
  return store?.results || [];
}

/**
 * Clear all daily challenge results
 */
export function clearDailyChallengeResults(): void {
  storage.removeItem(DAILY_CHALLENGE_KEY);
}

/**
 * Get personal best score from daily challenge results
 * @returns Best score, or 0 if no results
 */
export function getDailyChallengeBestScore(): number {
  const results = getDailyChallengeResults();
  if (results.length === 0) return 0;
  
  return Math.max(...results.map(r => r.score));
}

/**
 * Get streak count (consecutive days played)
 * @returns Number of consecutive days played
 */
export function getDailyChallengeStreak(): number {
  const results = getDailyChallengeResults();
  if (results.length === 0) return 0;
  
  const dates = results.map(r => r.date).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime(); // Newest first
  });
  
  const today = getTodayDate();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  
  // Check if played today or yesterday to start streak
  if (dates[0] !== today && dates[0] !== yesterdayStr) {
    return 0;
  }
  
  let streak = 1;
  let currentDate = dates[0];
  
  for (let i = 1; i < dates.length; i++) {
    const prevDay = new Date(currentDate);
    prevDay.setDate(prevDay.getDate() - 1);
    const prevDayStr = `${prevDay.getFullYear()}-${String(prevDay.getMonth() + 1).padStart(2, '0')}-${String(prevDay.getDate()).padStart(2, '0')}`;
    
    if (dates[i] === prevDayStr) {
      streak++;
      currentDate = prevDayStr;
    } else {
      break;
    }
  }
  
  return streak;
}

// ==================== IMPORT/EXPORT ====================

/**
 * Complete application state for import/export
 */
export interface AppState {
  version: number; // Schema version
  exportDate: string; // ISO timestamp of export
  gameSave: GameSave | null;
  dailyChallenge: DailyChallengeStore | null;
  tutorialsSeen: string[];
}

/**
 * Serialize all application state to a JSON object
 * This includes game save, daily challenge results, and tutorials seen
 * @returns Complete application state as an object
 */
export function serializeAppState(): AppState {
  const tutorialsSeen = Array.from(getTutorialsSeen());
  const dailyChallenge = getDailyChallengeStore();
  const gameSave = loadGameSave();

  return {
    version: CURRENT_SCHEMA_VERSION,
    exportDate: new Date().toISOString(),
    gameSave,
    dailyChallenge,
    tutorialsSeen,
  };
}

/**
 * Deserialize and import application state from JSON
 * Strictly validates the input and never executes arbitrary code
 * @param json - JSON string or parsed object to import
 * @returns Object with success status and error message if failed
 */
export function deserializeAppState(
  json: string | unknown,
): { success: boolean; error?: string; migrated?: boolean; fromVersion?: number } {
  let data: unknown;

  // Parse JSON if string
  if (typeof json === 'string') {
    try {
      data = JSON.parse(json);
    } catch {
      return { success: false, error: 'Invalid JSON: Could not parse file' };
    }
  } else {
    data = json;
  }

  // Validate that data is an object
  if (!data || typeof data !== 'object') {
    return { success: false, error: 'Invalid data: Not an object' };
  }

  const state = data as Partial<AppState>;

  // Check for required top-level fields
  if (typeof state.version !== 'number') {
    return { success: false, error: 'Invalid data: Missing or invalid version' };
  }

  if (!state.exportDate || typeof state.exportDate !== 'string') {
    return { success: false, error: 'Invalid data: Missing or invalid export date' };
  }

  // Validate that this is a Sharpshooter save file
  if (state.version < 1 || state.version > CURRENT_SCHEMA_VERSION) {
    return {
      success: false,
      error: `Invalid version: ${state.version}. Current version: ${CURRENT_SCHEMA_VERSION}`,
    };
  }

  // Validate and migrate game save if present
  let wasMigrated = false;
  let fromVersion: number | undefined;

  if (state.gameSave !== null && state.gameSave !== undefined) {
    if (!validateGameSave(state.gameSave)) {
      return { success: false, error: 'Invalid data: Game save validation failed' };
    }

    // Check if migration is needed and save original version
    const needsMigration = state.gameSave.version < CURRENT_SCHEMA_VERSION;
    fromVersion = state.gameSave.version;

    if (needsMigration) {
      try {
        const migrated = migrateData(
          state.gameSave,
          state.gameSave.version,
          CURRENT_SCHEMA_VERSION,
        ) as GameSave;

        if (!validateGameSave(migrated)) {
          return { success: false, error: 'Migration failed: Result is invalid' };
        }

        state.gameSave = migrated;
        wasMigrated = true;
      } catch (error) {
        return {
          success: false,
          error: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    // Save the game save
    if (!saveGameSave(state.gameSave)) {
      return { success: false, error: 'Failed to save game data' };
    }
  }

  // Validate and import daily challenge data if present
  if (state.dailyChallenge !== null && state.dailyChallenge !== undefined) {
    const dc = state.dailyChallenge;
    if (!dc.results || !Array.isArray(dc.results)) {
      return { success: false, error: 'Invalid data: Daily challenge results are invalid' };
    }

    // Validate each result
    for (const result of dc.results) {
      if (
        !result.date ||
        typeof result.date !== 'string' ||
        typeof result.score !== 'number' ||
        typeof result.stars !== 'number' ||
        typeof result.completedAt !== 'number' ||
        typeof result.groupSizeMeters !== 'number' ||
        !result.weaponId ||
        typeof result.weaponId !== 'string'
      ) {
        return { success: false, error: 'Invalid data: Daily challenge result is invalid' };
      }
    }

    storage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(state.dailyChallenge));
  }

  // Validate and import tutorials seen if present
  if (state.tutorialsSeen && Array.isArray(state.tutorialsSeen)) {
    // Validate that all tutorials are strings
    for (const tutorialId of state.tutorialsSeen) {
      if (typeof tutorialId !== 'string') {
        return { success: false, error: 'Invalid data: Tutorial IDs must be strings' };
      }
    }

    storage.setItem(TUTORIALS_KEY, JSON.stringify(state.tutorialsSeen));
  }

  return {
    success: true,
    migrated: wasMigrated,
    fromVersion,
  };
}

export {
  loadGameSave,
  saveGameSave,
  getOrCreateGameSave,
  updateLevelProgress,
  getLevelProgress,
  setSelectedWeapon,
  getSelectedWeaponId,
  clearSaveData,
  getTotalStars,
  getPackStars,
  getPackMaxStars,
  isLevelUnlocked,
  getUnlockedLevels,
  CURRENT_SCHEMA_VERSION,
} from './localStore';
export type { GameSave, LevelProgress } from './localStore';

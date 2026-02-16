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
  CURRENT_SCHEMA_VERSION,
} from './localStore';
export type { GameSave, LevelProgress } from './localStore';

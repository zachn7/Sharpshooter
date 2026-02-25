/**
 * Contracts Mode
 * 
 * Mini-campaign runs with 3-5 stages, single loadout, cumulative scoring,
 * and cosmetic rewards on completion.
 */

import { LEVELS } from './levels';
import { WEAPONS_CATALOG } from './weapons';

// Contract difficulty tier
export type ContractDifficulty = 'easy' | 'medium' | 'hard';

// Contract stage configuration
export interface ContractStage {
  levelId: string;           // Level to play
  weaponType: string;        // Required weapon type
  targetScore: number;        // Par score for this stage
  stageNumber: number;        // 1-indexed stage number
}

// Contract definition
export interface Contract {
  id: string;                 // Contract ID (e.g., 'contract-easy-123')
  name: string;               // Contract display name
  description: string;        // Contract description
  difficulty: ContractDifficulty;
  weaponType: string;         // Weapon type locked for entire run
  stages: ContractStage[];    // Stages to complete
  totalParScore: number;      // Cumulative par score for all stages
  rewards: ContractReward[];  // Rewards for completing
  seed: number;               // Seed for deterministic generation
}

// Contract stage result
export interface ContractStageResult {
  stageNumber: number;
  levelId: string;
  score: number;
  starsAwarded: number;
  shotsFired: number;
  bestDistance?: number;       // Distance from target center (best shot)
  worstMiss?: number;          // Distance from target center (worst miss)
  groupSizeMils?: number;      // Group size if applicable
  completed: boolean;
}

// Contract run summary
export interface ContractRunSummary {
  contractId: string;
  completed: boolean;
  totalScore: number;
  totalStars: number;
  totalShots: number;
  stagesCompleted: number;
  totalStages: number;
  bestShot: ContractStageResult | null;
  worstMiss: ContractStageResult | null;
  rewards: ContractReward[];
  completedAt: number;        // Timestamp
}

// Contract reward
export interface ContractReward {
  type: 'badge' | 'reticle' | 'weapon' | 'pack';
  id: string;                 // Reward ID (badge ID, skin ID, etc.)
  name: string;               // Display name
  description: string;        // Description
  icon?: string;              // Emoji or icon
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Contract generator configuration
export interface ContractGeneratorConfig {
  difficulty: ContractDifficulty;
  weaponType?: string;        // If not specified, auto-select based on difficulty
  stageCount?: number;         // 3-5 stages (default varies by difficulty)
  seed?: number;              // Seed for deterministic generation
}

/**
 * Generate a contract with deterministic stage selection
 */
export function generateContract(config: ContractGeneratorConfig): Contract {
  const {
    difficulty,
    weaponType: preferredWeaponType,
    stageCount: requestedStageCount,
    seed: providedSeed = Math.floor(Math.random() * 1000000),
  } = config;

  // Seeded random for determinism
  const rng = createSeededRNG(providedSeed);

  // Determine stage count based on difficulty
  const stageCount = requestedStageCount || getStageCountForDifficulty(difficulty);

  // Determine weapon type
  const weaponType = preferredWeaponType || getWeaponTypeForDifficulty(difficulty);

  // Select levels suitable for this weapon type
  const suitableLevels = LEVELS.filter(
    (level) =>
      level.requiredWeaponType === weaponType ||
      level.requiredWeaponType === 'any'
  );

  if (suitableLevels.length === 0) {
    throw new Error(`No suitable levels found for weapon type: ${weaponType}`);
  }

  // Pick stages with no repeats
  const selectedStageIndexes = new Set<number>();
  const stages: ContractStage[] = [];
  const totalParScore = 100 * stageCount; // 100 points par per stage

  for (let i = 0; i < stageCount && i < suitableLevels.length; i++) {
    let selectedIndex: number;
    let attempts = 0;
    const maxAttempts = 100;

    // Pick a unique level
    do {
      selectedIndex = Math.floor(rng() * suitableLevels.length);
      attempts++;
    } while (selectedStageIndexes.has(selectedIndex) && attempts < maxAttempts);

    if (attempts >= maxAttempts && selectedStageIndexes.has(selectedIndex)) {
      // Give up and use the ones we have
      break;
    }

    selectedStageIndexes.add(selectedIndex);
    const level = suitableLevels[selectedIndex];

    const targetScore = getTargetScoreForDifficulty(stageCount, i, difficulty);

    stages.push({
      levelId: level.id,
      weaponType: level.requiredWeaponType === 'any' ? weaponType : level.requiredWeaponType,
      targetScore,
      stageNumber: i + 1,
    });
  }

  // Determine rewards based on difficulty
  const rewards = generateRewards(difficulty, rng);

  const contractId = `contract-${difficulty}-${providedSeed}`;
  const weaponName = WEAPONS_CATALOG.find((w) => w.type === weaponType)?.name || weaponType;
  
  const difficultyNames: Record<string, string> = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
  };

  return {
    id: contractId,
    name: `${difficultyNames[difficulty]} Weapon Challenge`,
    description: `${stages.length}-stage ${weaponName} contract. Par score: ${totalParScore}`,
    difficulty,
    weaponType,
    stages,
    totalParScore,
    rewards,
    seed: providedSeed,
  };
}

/**
 * Get stage count based on difficulty
 */
function getStageCountForDifficulty(difficulty: ContractDifficulty): number {
  switch (difficulty) {
    case 'easy': return 3;
    case 'medium': return 4;
    case 'hard': return 5;
  }
}

/**
 * Get weapon type based on difficulty
 */
function getWeaponTypeForDifficulty(difficulty: ContractDifficulty): string {
  switch (difficulty) {
    case 'easy': return 'pistol';
    case 'medium': return 'rifle';
    case 'hard': return 'sniper';
  }
}

/**
 * Get target score for a stage based on position and difficulty
 */
function getTargetScoreForDifficulty(
  totalStages: number,
  stageIndex: number,
  difficulty: ContractDifficulty
): number {
  const baseScore = 100;
  const multiplier = difficulty === 'easy' ? 1.0 : difficulty === 'medium' ? 1.2 : 1.5;
  // Slight increase for later stages
  const stageMultiplier = 1 + (stageIndex / totalStages) * 0.2;
  return Math.floor(baseScore * multiplier * stageMultiplier);
}

/**
 * Generate rewards based on difficulty
 */
function generateRewards(
  difficulty: ContractDifficulty,
  rng: () => number
): ContractReward[] {
  const rewards: ContractReward[] = [];

  // Base reward: badge for completion
  const badges: Record<ContractDifficulty, { name: string; description: string; icon: string }> = {
    easy: {
      name: 'Rookie Badge',
      description: 'Completed an Easy contract',
      icon: '🎯',
    },
    medium: {
      name: 'Marksman Badge',
      description: 'Completed a Medium contract',
      icon: '🏆',
    },
    hard: {
      name: 'Elite Badge',
      description: 'Completed a Hard contract',
      icon: '💎',
    },
  };

  rewards.push({
    type: 'badge',
    id: `badge-${difficulty}`,
    name: badges[difficulty].name,
    description: badges[difficulty].description,
    icon: badges[difficulty].icon,
    rarity: difficulty === 'easy' ? 'common' : difficulty === 'medium' ? 'rare' : 'epic',
  });

  // Chance for reticle skin reward
  if (rng() > 0.3) {
    const skinRarity = difficulty === 'hard' ? 'rare' : 'common';
    rewards.push({
      type: 'reticle',
      id: `contract-${difficulty}-skin-${Math.floor(rng() * 1000)}`,
      name: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Contract Skin`,
      description: 'Unlocked by completing this contract',
      rarity: skinRarity as ContractReward['rarity'],
    });
  }

  return rewards;
}

/**
 * Simple seeded RNG for deterministic contract generation
 */
function createSeededRNG(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * Get contract by ID (retrieves from local storage if needed)
 */
export function getContractById(id: string): Contract | undefined {
  try {
    const stored = localStorage.getItem(`contract-${id}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return undefined;
}

/**
 * Save contract to local storage for later retrieval
 */
export function saveContract(contract: Contract): void {
  try {
    localStorage.setItem(`contract-${contract.id}`, JSON.stringify(contract));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Contract run state for in-progress runs
 */
export interface ContractRunState {
  contractId: string;
  currentStageIndex: number;       // 0-indexed
  completedStages: number;        // Count
  stages: ContractStage[];
  cumulativeScore: number;
  stageResults: ContractStageResult[];
  startedAt: number;
  completedAt: number | null;
}

/**
 * Initialize a contract run state
 */
export function initializeContractRun(contract: Contract): ContractRunState {
  return {
    contractId: contract.id,
    currentStageIndex: 0,
    completedStages: 0,
    stages: contract.stages,
    cumulativeScore: 0,
    stageResults: [],
    startedAt: Date.now(),
    completedAt: null,
  };
}

/**
 * Record a completed stage result
 */
export function recordStageResult(
  runState: ContractRunState,
  stageResult: ContractStageResult
): ContractRunState {
  return {
    ...runState,
    currentStageIndex: runState.currentStageIndex + 1,
    completedStages: runState.completedStages + 1,
    cumulativeScore: runState.cumulativeScore + stageResult.score,
    stageResults: [...runState.stageResults, stageResult],
  };
}

/**
 * Mark contract run as completed
 */
export function completeContractRun(runState: ContractRunState): ContractRunState {
  return {
    ...runState,
    completedAt: Date.now(),
  };
}

/**
 * Generate run summary from run state
 */
export function generateRunSummary(runState: ContractRunState, contract: Contract): ContractRunSummary {
  const completed = runState.completedStages === contract.stages.length;

  const totalStars = runState.stageResults.reduce((sum, result) => sum + result.starsAwarded, 0);
  const totalShots = runState.stageResults.reduce((sum, result) => sum + result.shotsFired, 0);

  // Find best shot and worst miss
  let bestShot: ContractStageResult | null = null;
  let worstMiss: ContractStageResult | null = null;

  for (const result of runState.stageResults) {
    if (result.bestDistance !== undefined && result.bestDistance !== null) {
      if (!bestShot || result.bestDistance < (bestShot.bestDistance ?? Infinity)) {
        bestShot = result;
      }
    }
    if (result.worstMiss !== undefined && result.worstMiss !== null && result.worstMiss !== 0) {
      if (!worstMiss || result.worstMiss > (worstMiss.worstMiss ?? 0)) {
        worstMiss = result;
      }
    }
  }

  return {
    contractId: runState.contractId,
    completed,
    totalScore: runState.cumulativeScore,
    totalStars,
    totalShots,
    stagesCompleted: runState.completedStages,
    totalStages: contract.stages.length,
    bestShot,
    worstMiss,
    rewards: contract.rewards,
    completedAt: runState.completedAt || Date.now(),
  };
}

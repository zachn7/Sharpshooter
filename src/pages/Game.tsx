import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { ZeroRangeShotLimitMode } from '../storage';
import type { PointerEvent } from 'react';
import { worldToCanvas, canvasToWorld } from '../utils/coordinates';
import { createStandardTarget, calculateRingScore, findHitPlate } from '../utils/scoring';
import { simulateShotToDistance, computeFinalShotParams, computeAirDensity, DEFAULT_ENVIRONMENT, calculateExpertEffects, hasExpertExtras, type ExpertEffectsParams } from '../physics';
import { getWeaponById, DEFAULT_WEAPON_ID } from '../data/weapons';
import { getAmmoById, getAmmoByWeaponType } from '../data/ammo';
import { getLevelById, DEFAULT_LEVEL_ID, calculateStars, LEVELS, type Level } from '../data/levels';
import { DRILLS, generateDrillScenario, type DrillScenario } from '../data/drills';
import { getSelectedWeaponId, updateLevelProgress, getGameSettings, updateGameSettings, getRealismScaling, getTurretState, updateTurretState, getZeroProfile, saveZeroProfile, getSelectedAmmoId, getTodayDate, seedFromDate, saveDailyChallengeResult, saveDrillResult, type TurretState } from '../storage';
import { applyTurretOffset, nextClickValue, metersToMils, computeAdjustmentForOffset, quantizeAdjustmentToClicks } from '../utils/turret';
import { createPressHoldHandler, type PressHoldHandler } from '../utils/pressHold';
import { getMilSpacingPixels, MAGNIFICATION_LEVELS, milsToMoa, type MagnificationLevel } from '../utils/reticle';
import { samplePelletImpacts, type ShotgunPatternConfig, type PelletImpact } from '../physics/shotgun';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { RangeCard } from '../components/RangeCard';
import { ReplayViewer } from '../components/ReplayViewer';
import { AudioManager, initAudioOnInteraction, isTestMode as audioIsTestMode } from '../audio';
import { exportCanvasAsPng } from '../utils/canvasExport';
import { assembleRangeCard } from '../utils/rangeCard';
import type { ShotTelemetry, PathPoint } from '../types';
import {
  stringHash,
  combineSeed,
  sampleRadialOffset,
  calculateGroupSize,
  metersToMils as dispersionMetersToMils,
} from '../physics/dispersion';
import {
  calculateSwayOffset,
  calculateRecoilImpulse,
  updateRecoilDecay,
  combineOffsets,
  isTestModeEnabled,
  type RecoilState,
} from '../physics/sway';
import { drawWindCues } from '../physics/windCues';

interface Impact {
  x: number;
  y: number;
  score: number;
  timestamp: number;
  windUsedMps: number;
  index: number;
  // Offset from target center in mils (for aiming correction)
  elevationMils: number; // Positive = shot is high
  windageMils: number;  // Positive = shot is right
  // Dispersion offsets from weapon precision (in meters)
  dispersionY: number; // Vertical dispersion (up positive)
  dispersionZ: number; // Horizontal dispersion (right positive)
  // Plate hit information (for plates mode)
  plateId?: string;    // ID of the plate that was hit (if any)
  // Shotgun pellet pattern (for shotgun weapons)
  pellets?: Array<{ x: number; y: number; score: number }>; // Individual pellet impacts and scores
}

type GameState = 'briefing' | 'running' | 'results';

const WORLD_WIDTH = 1.0; // meters
const WORLD_HEIGHT = 0.75; // 4:3 aspect ratio

/**
 * Generate a deterministic level config from seed for daily challenge
 */
function generateDailyLevelFromSeed(seed: number): Level {
  // Simple pseudo-random number generator for determinism
  const rng = (state: number) => {
    const stateInt = Math.floor(state * 2147483647.0) % 2147483647;
    const newState = (stateInt * 16807) % 2147483647;
    return {
      value: (newState - 1) / 2147483646.0,
      newState,
    };
  };
  
  let state = seed % 2147483647;
  
  const r1 = rng(state);
  state = r1.newState;
  const r2 = rng(state);
  state = r2.newState;
  const r3 = rng(state);
  state = r3.newState;
  const r4 = rng(state);
  state = r4.newState;
  const r5 = rng(state);
  state = r5.newState;
  const r6 = rng(state);
  
  const distanceM = 50 + Math.floor(Math.pow(r1.value, 0.5) * 250);
  const wind = (r2.value * 20 - 10) * (r3.value > 0.5 ? 1 : 0);
  const windMps = Math.round(wind * 10) / 10;
  const gustMps = windMps !== 0 ? Math.round(r4.value * 50) / 10 : 0;
  const temperatureC = Math.round(r5.value * 55 - 20);
  const altitudeM = Math.floor(r6.value * 3000);
  const targetMode = r6.value < 0.3 ? 'plates' : 'bullseye';
  
  // Base star thresholds (will be calculated dynamically)
  const baseScore = 30; // Expect max score from 3 shots (10 each)
  
  return {
    id: 'daily-challenge',
    packId: 'daily',
    name: 'Daily Challenge',
    description: 'Today\'s unique shooting challenge!',
    difficulty: 'medium',
    requiredWeaponType: 'any',
    distanceM,
    env: { temperatureC, altitudeM },
    windMps,
    gustMps,
    airDensityKgM3: 1.225, // Will be computed
    gravityMps2: 9.80665,
    targetMode,
    targetScale: 1.0,
    maxShots: 3,
    starThresholds: {
      one: Math.floor(baseScore * 0.5),
      two: Math.floor(baseScore * 0.75),
      three: baseScore,
    },
    unlocked: true,
  };
}

interface GameProps {
  isZeroRange?: boolean;
  shotLimitMode?: ZeroRangeShotLimitMode;
}

export function Game({ isZeroRange = false, shotLimitMode = 'unlimited' }: GameProps = {}) {
  const { levelId } = useParams<{ levelId?: string }>();
  const [searchParams] = useSearchParams();
  
  // Check for test mode (disables sway/recoil for deterministic E2E)
  const isTestMode = isTestModeEnabled(searchParams);
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Turret button refs for press-and-hold
  const elevationUpRef = useRef<HTMLButtonElement>(null);
  const elevationDownRef = useRef<HTMLButtonElement>(null);
  const windageLeftRef = useRef<HTMLButtonElement>(null);
  const windageRightRef = useRef<HTMLButtonElement>(null);
  const [recticlePosition, setReticlePosition] = useState({ x: 0.5, y: 0.5 });
  const [impacts, setImpacts] = useState<Impact[]>([]);
  const [shotTelemetry, setShotTelemetry] = useState<ShotTelemetry[]>([]);
  const [showReplay, setShowReplay] = useState(false);
  const [levelStartedAt, setLevelStartedAt] = useState(Date.now());
  const [gameState, setGameState] = useState<GameState>('briefing');
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [totalScore, setTotalScore] = useState(0);
  const [earnedStars, setEarnedStars] = useState<0 | 1 | 2 | 3>(0);
  const [groupSizeMeters, setGroupSizeMeters] = useState(0);
  
  // Sway and recoil state
  const [recoilState, setRecoilState] = useState<RecoilState | null>(null);
  
  // Reticle and magnification state
  const [magnification, setMagnification] = useState<MagnificationLevel>(1);
  
  // Turret state (loaded from storage per weapon)
  const weaponId = getSelectedWeaponId() || DEFAULT_WEAPON_ID;
  const [turretState, setTurretState] = useState<TurretState>(() => getTurretState(weaponId));
  
  const settings = useState(() => getGameSettings())[0];
  const { dragScale, windScale } = getRealismScaling(settings.realismPreset);
  
  // Get test seed from URL params for deterministic testing
  // Use useState with lazy initializer - only executed once
  const [testSeed] = useState(() => {
    const seedParam = searchParams.get('seed');
    return seedParam ? parseInt(seedParam, 10) : Date.now();
  });
  
  // Load level data
  const levelIdSafe = levelId || DEFAULT_LEVEL_ID;
  
  // Check for daily challenge
  const dateOverride = searchParams.get('dateOverride') || undefined;
  const isDailyChallenge = levelIdSafe === 'daily-challenge';
  
  // Check for drill mode
  const isDrill = searchParams.get('mode') === 'drill' && DRILLS.some(d => d.id === levelIdSafe);
  let drillScenario: DrillScenario | undefined;
  const drill = isDrill ? DRILLS.find(d => d.id === levelIdSafe) : undefined;
  
  let level: Level | undefined;
  if (isDailyChallenge) {
    const seedParam = searchParams.get('seed');
    const seed = seedParam ? parseInt(seedParam, 10) : seedFromDate(getTodayDate(dateOverride));
    level = generateDailyLevelFromSeed(seed);
  } else if (isDrill && drill) {
    // Load drill scenario and convert to level-like structure
    const seedParam = searchParams.get('seed') || '1';
    drillScenario = generateDrillScenario(drill.id, parseInt(seedParam, 10));
    level = {
      id: drill.id,
      packId: 'drills',
      name: drill.name,
      description: drill.description,
      difficulty: 'medium',
      requiredWeaponType: 'any',
      distanceM: drillScenario.distanceM,
      windMps: drillScenario.windMps,
      gustMps: drillScenario.gustMps,
      windDirectionDeg: drillScenario.windMps >= 0 ? 90 : 270,
      env: drillScenario.env,
      airDensityKgM3: 1.225,
      gravityMps2: 9.81,
      targetMode: drillScenario.targetMode,
      targets: drillScenario.plates?.map(p => ({
        id: p.id,
        centerY_M: p.x_M,
        centerZ_M: p.z_M,
        radiusM: 0.05,
        points: p.points,
      })) || [],
      maxShots: drillScenario.maxShots,
      timerSeconds: drillScenario.timeLimit,
      starThresholds: { one: drillScenario.maxShots * 5, two: drillScenario.maxShots * 8, three: drillScenario.maxShots * 10 },
      targetScale: 1.0,
      unlocked: true,
    };
  } else {
    level = getLevelById(levelIdSafe);
  }
  
  const levelMaxShots = level?.maxShots ?? 3;
  
  // Compute environment data from level env preset or use defaults
  const levelEnv = level?.env || DEFAULT_ENVIRONMENT;
  const computedAirDensity = level ? computeAirDensity(levelEnv) : 1.225;
  
  // For Zero Range, use the shot limit mode setting
  const maxShots = isZeroRange
    ? (shotLimitMode === 'three' ? 3 : Number.MAX_SAFE_INTEGER)
    : levelMaxShots;
  const [shotCount, setShotCount] = useState(maxShots);
  
  // Timer state (for timed challenges)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerActive = level?.timerSeconds !== undefined && level.timerSeconds > 0;
  
  // Timer effect
  useEffect(() => {
    // Reset timer when game state changes or level changes
    if (gameState === 'briefing' || (!level?.timerSeconds)) {
      setTimeRemaining(null);
      return;
    }
    
    // Don't run countdown if timer is not active
    if (!timerActive) {
      return;
    }
    
    // Start timer when level begins
    if (timeRemaining === null && gameState === 'running' && level?.timerSeconds) {
      setTimeRemaining(level.timerSeconds);
    }
    
    // Don't run countdown if timer has ended
    if (timeRemaining === 0) {
      return;
    }
    
    // Countdown timer
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          return 0;
        }
        return prev - 0.1; // Update every 100ms for smooth display
      });
    }, 100);
    
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, level?.timerSeconds, timerActive]);
  
  // Plates hit tracking (for plates mode)
  const [plateHits, setPlateHits] = useState<Record<string, number>>({});
  const plates = useMemo(() => level?.targets || [], [level?.targets]);
  const targetMode = level?.targetMode || 'bullseye';
  
  // Load weapon data
  const weapon = getWeaponById(weaponId) || getWeaponById(DEFAULT_WEAPON_ID);
  
  // Load selected ammo for weapon
  const selectedAmmoId = getSelectedAmmoId(weaponId);
  const selectedAmmo = selectedAmmoId ? getAmmoById(selectedAmmoId) : null;
  
  // If no ammo selected, try to get match grade for weapon type as fallback
  const effectiveAmmo = selectedAmmo || (weapon ? getAmmoByWeaponType(weapon.type).find(a => a.name.includes('Match')) || null : null);
  
  // Target configuration based on level's targetScale
  const targetConfig = createStandardTarget(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);

  // Handle canvas resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Pointer move handler
  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      const worldPoint = canvasToWorld(canvasPoint, {
        worldWidth: WORLD_WIDTH,
        worldHeight: WORLD_HEIGHT,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
      });

      setReticlePosition({ x: worldPoint.x, y: worldPoint.y });
    },
    [canvasSize]
  );

  // Convert physics path (Vec3[]) to telemetry path (PathPoint[])
  // Physics uses: x=downrange, y=up, z=right
  // Telemetry uses: x=right, y=up, t=time
  const convertPhysicsPath = useCallback((physicsPath: { x: number; y: number; z: number }[]): PathPoint[] => {
    // Sample path to max 20 points for performance
    const maxPoints = 20;
    const step = Math.ceil(physicsPath.length / maxPoints);
    
    return physicsPath
      .filter((_, i) => i % step === 0 || i === physicsPath.length - 1)
      .slice(0, maxPoints)
      .map((p, idx) => ({
        x: p.z, // Physics Z (right) becomes telemetry X
        y: p.y, // Physics Y (up) becomes telemetry Y
        t: idx * 0.1, // Approximate time (not precise, good enough for replay)
      }));
  }, []);

  // Pointer down handler (fire shot)
  const handlePointerDown = useCallback(async () => {
    if (shotCount <= 0 || !level || !weapon || gameState !== 'running') return;
    
    // Check timer - block firing if time is up
    if (timeRemaining === 0) return;

    // Initialize audio on first user interaction
    if (!audioIsTestMode()) {
      await initAudioOnInteraction();
    }

    // Play shot sound
    AudioManager.playSound('shot');

    // Convert reticle world position to physics aim coordinates (meters from target center)
    const aimX_M = (recticlePosition.x - WORLD_WIDTH / 2);
    const aimY_M = -(recticlePosition.y - WORLD_HEIGHT / 2);

    // Apply turret offset to aim
    // Elevation: positive = aim higher (up), Windage: positive = aim right
    const adjustedAim = applyTurretOffset(
      aimY_M,
      aimX_M,
      turretState,
      level.distanceM
    );

    // Calculate sway offset (continuous hand movement)
    // Only apply if not in test mode (for deterministic E2E testing)
    const swayOffset = isTestMode 
      ? { y: 0, z: 0 } 
      : calculateSwayOffset(
          performance.now() / 1000, // Convert to seconds
          settings.realismPreset,
          weapon.type,
          magnification
        );

    // Calculate current recoil offset (if any)
    // Only apply if not in test mode
    let recoilOffset = { y: 0, z: 0 };
    if (!isTestMode && recoilState) {
      recoilOffset = { y: recoilState.offsetY, z: recoilState.offsetZ };
    }

    // Combine sway and recoil offsets
    const totalOffset = combineOffsets(swayOffset, recoilOffset);

    // Convert offsets from MILs to meters at target distance
    const offsetY_Meters = (totalOffset.y * level.distanceM) / 1000;
    const offsetZ_Meters = (totalOffset.z * level.distanceM) / 1000;

    // Apply combined offset to aim
    const finalAimY_M = adjustedAim.aimY_M + offsetY_Meters;
    const finalAimZ_M = adjustedAim.aimZ_M + offsetZ_Meters;

    // Compute final shot parameters (weapon + ammo + realism preset)
    const finalParams = computeFinalShotParams(weapon, effectiveAmmo, settings.realismPreset);
    
    // Run physics simulation with aggregated parameters
    const scaledWindMps = level.windMps * windScale;
    const scaledGustMps = level.gustMps * windScale;
    
    const result = simulateShotToDistance(
      {
        distanceM: level.distanceM,
        muzzleVelocityMps: finalParams.muzzleVelocityMps,
        dragFactor: finalParams.dragFactor,
        aimY_M: finalAimY_M,
        aimZ_M: finalAimZ_M,
        dtS: 0.002,
        recordPath: settings.vfx.recordShotPath, // Record path if setting enabled
      },
      {
        windMps: scaledWindMps,
        gustMps: scaledGustMps,
        airDensityKgM3: computedAirDensity, // Use computed air density from env
        gravityMps2: level.gravityMps2,
        seed: testSeed + shotCount, // Each shot gets a different deterministic seed
      }
    );

    // Apply Expert Sim Extras (Spin Drift + Coriolis)
    // These are gameplay approximations applied AFTER basic ballistics
    // but BEFORE dispersion, as they affect the center of aim
    let expertEffectY = 0;
    let expertEffectZ = 0;
    if (hasExpertExtras()) {
      const expertParams: ExpertEffectsParams = {
        timeOfFlightS: result.timeOfFlightS,
        headingDegrees: level.headingDegrees || 0, // Default to North
        latitudeDegrees: level.latitudeDegrees || 45, // Default to mid-latitude
      };
      const expertEffects = calculateExpertEffects(
        expertParams,
        settings.expertSpinDriftEnabled,
        settings.expertCoriolisEnabled
      );
      expertEffectY = expertEffects.dY_M;
      expertEffectZ = expertEffects.dZ_M;
    }

    // Apply weapon precision dispersion (from aggregated params)
    // Generate base seed from level ID + weapon + ammo for determinism
    const baseSeed = stringHash(level.id + weapon.id + (effectiveAmmo?.id || ''));
    // Combine with test seed and shot number for per-shot randomness
    const shotSeed = combineSeed(baseSeed + testSeed, impacts.length);
    const dispersion = sampleRadialOffset(
      level.distanceM,
      (finalParams.dispersionGroupSizeM / 91.44) * 60, // Convert meters back to MOA
      shotSeed
    );

    // Apply dispersion and expert effects AFTER ballistic calculation
    // Wind/drag + expert effects affect center of aim, dispersion adds scatter around that point
    const finalImpactY = result.impactY_M + expertEffectY + dispersion.dY; // Apply expert effects and vertical dispersion
    const finalImpactZ = result.impactZ_M + expertEffectZ + dispersion.dZ; // Apply expert effects and horizontal dispersion

    // Convert physics impact back to world coordinates
    const impactX = WORLD_WIDTH / 2 + finalImpactZ;
    const impactY = WORLD_HEIGHT / 2 - finalImpactY;

    // Compute offset from target center in mils
    const elevationMils = metersToMils(level.distanceM, finalImpactY);
    const windageMils = metersToMils(level.distanceM, finalImpactZ);

    // Calculate score based on target mode
    let score: number;
    let plateId: string | undefined;
    let shotgunPellets: Array<{ x: number; y: number; score: number }> | undefined;
    
    // Check if weapon is shotgun and generate pellet pattern
    if (weapon.type === 'shotgun') {
      // Shotgun: generate pellet pattern and calculate score based on pellets
      const shotgunConfig: ShotgunPatternConfig = {
        distanceM: level.distanceM,
        pelletCount: 12, // Standard 12-gauge buckshot pellet count
        baseSpreadMils: 25, // Base spread for cylinder choke
        choke: 'cylinder', // Default choke
        seed: Date.now(), // Use timestamp as seed (will be replaced by testSeed in test mode)
      };
      
      // Use testSeed if available for deterministic testing
      const shotSeedValue = testSeed || Date.now();
      shotgunConfig.seed = combineSeed ? combineSeed(shotSeedValue, impacts.length + 1) : shotSeedValue;
      
      // Generate pellet offsets
      const pellets: PelletImpact[] = samplePelletImpacts(shotgunConfig);
      
      // Add pellet offsets to base impact position
      const baseX = impactX;
      const baseY = impactY;
      
      shotgunPellets = pellets.map(pellet => {
        // Convert pellet offset from meters to canvas pixels
        const pelletOffsetX = (pellet.dZ / level.distanceM) * (canvasSize.width / 2); // Z = horizontal on canvas
        const pelletOffsetY = -(pellet.dY / level.distanceM) * (canvasSize.height / 2); // Y = vertical, inverted
        
        const pelletCanvasX = baseX + pelletOffsetX;
        const pelletCanvasY = baseY + pelletOffsetY;
        
        // Calculate pellet score based on target mode
        let pelletScore = 0;
        if (targetMode === 'plates' && plates.length > 0) {
          // Calculate pellet score using plate detection (direct in coordinate space)
          const pelletResult = findHitPlate({ y_M: finalImpactY + pellet.dY, z_M: finalImpactZ + pellet.dZ }, plates);
          pelletScore = pelletResult.points;
        } else {
          // Bullseye mode
          pelletScore = calculateRingScore({ x: pelletCanvasX, y: pelletCanvasY }, targetConfig);
        }
        
        return { x: pelletCanvasX, y: pelletCanvasY, score: pelletScore };
      });
      
      // Calculate overall score for shotgun: use best pellet for bullseye, sum for plates
      if (targetMode === 'plates') {
        score = shotgunPellets ? shotgunPellets.reduce((sum, p) => sum + p.score, 0) : 0;
        // Track plate hits from pellets
        const pellets = shotgunPellets;
        if (pellets) {
          plates.forEach(plate => {
            const pelletHitCount = pellets.filter(p => p.score > 0).length;
            if (pelletHitCount > 0) {
              const plateId = plate.id;
              setPlateHits(prev => {
                const hits = { ...prev };
                hits[plateId] = (hits[plateId] || 0) + pelletHitCount;
                return hits;
              });
            }
          });
        }
      } else {
        // Bullseye mode: use the highest-scoring pellet as the base score
        score = shotgunPellets ? Math.max(...shotgunPellets.map(p => p.score), 0) : 0;
      }
    } else if (targetMode === 'plates' && plates.length > 0) {
      // Plates mode: check which plate was hit
      const plateResult = findHitPlate({ y_M: finalImpactY, z_M: finalImpactZ }, plates);
      score = plateResult.points;
      plateId = plateResult.plate?.id;
      
      // Update plate hit count
      if (plateId) {
        // Capture plateId in a const to avoid TypeScript closure capture issues
        const hitPlateId = plateId;
        setPlateHits(prev => {
          const hits = { ...prev };
          hits[hitPlateId] = (hits[hitPlateId] || 0) + 1;
          return hits;
        });
      }
    } else {
      // Bullseye mode: standard ring scoring
      score = calculateRingScore({ x: impactX, y: impactY }, targetConfig);

      // Play bullseye sound for perfect shots (10 points)
      if (!audioIsTestMode() && score === 10) {
        AudioManager.playSound('bullseye');
      }
    }

    // Play hit sound for successful shots (score > 0 and not a bullseye which already has its own sound)
    if (!audioIsTestMode() && score > 0 && score !== 10) {
      AudioManager.playSound('hit');
    }

    const impact: Impact = {
      x: impactX,
      y: impactY,
      score,
      timestamp: Date.now(),
      windUsedMps: result.windUsedMps,
      index: impacts.length + 1,
      elevationMils,
      windageMils,
      dispersionY: dispersion.dY,
      dispersionZ: dispersion.dZ,
      plateId,
      pellets: shotgunPellets,
    };

    const newImpacts = [...impacts, impact];
    setImpacts(newImpacts);
    const newShotCount = shotCount - 1;
    setShotCount(newShotCount);

    // Record shot telemetry
    const telemetry: ShotTelemetry = {
      shotNumber: impacts.length + 1,
      windUsedMps: result.windUsedMps,
      windDirectionDeg: level.windDirectionDeg || 0,
      elevationMils,
      windageMils,
      timeOfFlightS: result.timeOfFlightS,
      distanceM: level.distanceM,
      impactX: finalImpactZ, // Physics Z = X in world coords
      impactY: finalImpactY, // Physics Y = Y in world coords (but inverted for canvas)
      score,
      path: result.path ? convertPhysicsPath(result.path) : undefined,
    };
    setShotTelemetry(prev => [...prev, telemetry]);

    // Trigger recoil impulse if not in test mode (use aggregated params)
    if (!isTestMode && gameState === 'running') {
      const impulse = calculateRecoilImpulse(settings.realismPreset, weapon.type, finalParams.recoilImpulseMils);
      setRecoilState(impulse);
    }
    
    // Check if level is complete
    if (newShotCount === 0) {
      const finalScore = newImpacts.reduce((sum, i) => sum + i.score, 0);
      const stars = level ? calculateStars(finalScore, level.starThresholds) : 0;
      
      // Calculate group size (maximum spread between any two shots)
      const dispersionOffsets = newImpacts.map(impact => ({
        dY: impact.dispersionY,
        dZ: impact.dispersionZ,
      }));
      const groupSize = calculateGroupSize(dispersionOffsets);
      
      setTotalScore(finalScore);
      setEarnedStars(stars);
      setGroupSizeMeters(groupSize);
      setGameState('results');
      
      // Save progress for regular levels
      if (!isZeroRange && level) {
        if (isDailyChallenge) {
          // Save daily challenge result
          const today = getTodayDate(dateOverride);
          saveDailyChallengeResult({
            date: today,
            score: finalScore,
            stars: stars as 0 | 1 | 2 | 3,
            groupSizeMeters: groupSize,
            weaponId,
            ammoId: getSelectedAmmoId(weaponId),
            completedAt: Date.now(),
          });
        } else if (isDrill && drill && drillScenario) {
          // Save drill result
          const drillSeed = parseInt(searchParams.get('seed') || '1', 10);
          const timeSeconds = level.timerSeconds !== undefined && level.timerSeconds > 0
            ? Math.max(0, (Date.now() - levelStartedAt) / 1000)
            : undefined;
          
          saveDrillResult({
            drillId: drill.id,
            seed: drillSeed,
            score: finalScore,
            timeSeconds,
            completedAt: Date.now(),
            shots: newImpacts.map((impact) => ({
              score: impact.score,
              elevationMils: impact.elevationMils,
              windageMils: impact.windageMils,
            })),
          });
        } else {
          // Save regular level progress
          updateLevelProgress(level.id, finalScore, level.starThresholds);
        }
      }
    }
  }, [
    recticlePosition,
    shotCount,
    level,
    weapon,
    impacts,
    targetConfig,
    gameState,
    testSeed,
    windScale,
    turretState,
    isZeroRange,
    isTestMode,
    settings.realismPreset,
    magnification,
    recoilState,
    effectiveAmmo,
    computedAirDensity,
    plates,
    targetMode,
    timeRemaining,
    dateOverride,
    isDailyChallenge,
    isDrill,
    drill,
    drillScenario,
    levelStartedAt,
    searchParams,
    weaponId,
    settings.expertSpinDriftEnabled,
    settings.expertCoriolisEnabled,
    settings.vfx.recordShotPath,
    convertPhysicsPath,
  ]);

  // Start level handler
  const handleStartLevel = useCallback(async () => {
    // Initialize audio on button click (user gesture)
    if (!audioIsTestMode()) {
      await initAudioOnInteraction();
      AudioManager.playSound('click');
    }
    setLevelStartedAt(Date.now());
    setGameState('running');
  }, []);

  // Export result as PNG
  const handleExportPng = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      await exportCanvasAsPng(
        canvas,
        `sharpshooter-${levelId}-${Date.now()}`,
        '#1a1a2e' // Dark blue background
      );
      if (!audioIsTestMode()) {
        AudioManager.playSound('click');
      }
    } catch (error) {
      console.error('Failed to export PNG:', error);
    }
  }, [canvasRef, levelId]);

  // Turret adjustment handlers
  const handleElevationAdjust = useCallback((direction: 1 | -1) => {
    if (!audioIsTestMode()) {
      AudioManager.playSound('click');
    }
    const newElevation = nextClickValue(turretState.elevationMils, direction, 0.1);
    const newTurretState = { ...turretState, elevationMils: newElevation };
    setTurretState(newTurretState);
    updateTurretState(weaponId, newTurretState);
  }, [turretState, weaponId]);

  const handleWindageAdjust = useCallback((direction: 1 | -1) => {
    if (!audioIsTestMode()) {
      AudioManager.playSound('click');
    }
    const newWindage = nextClickValue(turretState.windageMils, direction, 0.1);
    const newTurretState = { ...turretState, windageMils: newWindage };
    setTurretState(newTurretState);
    updateTurretState(weaponId, newTurretState);
  }, [turretState, weaponId]);

  const handleResetTurret = useCallback(() => {
    if (!audioIsTestMode()) {
      AudioManager.playSound('click');
    }
    const newTurretState = { elevationMils: 0.0, windageMils: 0.0 };
    setTurretState(newTurretState);
    updateTurretState(weaponId, newTurretState);
  }, [weaponId]);

  const handleSaveZero = useCallback(() => {
    if (!level) return;
    const profile = {
      zeroDistanceM: level.distanceM,
      zeroElevationMils: turretState.elevationMils,
      zeroWindageMils: turretState.windageMils,
    };
    saveZeroProfile(weaponId, profile);
  }, [level, turretState, weaponId]);

  const handleReturnToZero = useCallback(() => {
    const profile = getZeroProfile(weaponId);
    if (profile) {
      const newTurretState = {
        elevationMils: profile.zeroElevationMils,
        windageMils: profile.zeroWindageMils,
      };
      setTurretState(newTurretState);
      updateTurretState(weaponId, newTurretState);
    }
  }, [weaponId]);

  const handleApplyCorrection = useCallback(() => {
    // Get last shot's offset
    const lastImpact = impacts[impacts.length - 1];
    if (!lastImpact || !level) return;

    // Calculate correction needed (opposite of offset)
    const correction = computeAdjustmentForOffset(
      lastImpact.elevationMils * level.distanceM * 0.001, // Convert mils back to meters
      lastImpact.windageMils * level.distanceM * 0.001,
      level.distanceM
    );

    // Apply correction quantized to 0.1 mil clicks
    const newElevation = quantizeAdjustmentToClicks(
      turretState.elevationMils + correction.elevationMils,
      0.1
    );
    const newWindage = quantizeAdjustmentToClicks(
      turretState.windageMils + correction.windageMils,
      0.1
    );

    const newTurretState = {
      elevationMils: newElevation,
      windageMils: newWindage,
    };
    setTurretState(newTurretState);
    updateTurretState(weaponId, newTurretState);
  }, [impacts, level, turretState, weaponId]);

  // Reset level handler
  const handleReset = useCallback(() => {
    setImpacts([]);
    setShotCount(maxShots);
    setTotalScore(0);
    setEarnedStars(0);
    setGroupSizeMeters(0);
    setRecoilState(null);
    setGameState('running');
  }, [maxShots]);

  // Retry level handler
  const handleRetry = useCallback(() => {
    if (!audioIsTestMode()) {
      AudioManager.playSound('click');
    }
    setImpacts([]);
    setShotTelemetry([]); // Reset telemetry on retry
    setShotCount(maxShots);
    setTotalScore(0);
    setEarnedStars(0);
    setGroupSizeMeters(0);
    setRecoilState(null);
    setGameState('briefing');
  }, [maxShots]);

  // Find next level
  const getNextLevel = useCallback(() => {
    if (!level) return null;
    const currentIndex = LEVELS.findIndex(l => l.id === level.id);
    if (currentIndex < LEVELS.length - 1) {
      return LEVELS[currentIndex + 1];
    }
    return null;
  }, [level]);

  // Next level handler
  const handleNextLevel = useCallback(() => {
    if (!audioIsTestMode()) {
      AudioManager.playSound('click');
    }
    const next = getNextLevel();
    if (next) {
      setImpacts([]);
      setShotCount(next.maxShots);
      setTotalScore(0);
      setEarnedStars(0);
      setGroupSizeMeters(0);
      setRecoilState(null);
      setGameState('briefing');
      navigate(`/game/${next.id}`);
    }
  }, [getNextLevel, navigate]);

  // Back to levels handler
  const handleBack = useCallback(() => {
    if (!audioIsTestMode()) {
      AudioManager.playSound('click');
    }
    navigate('/levels');
  }, [navigate]);

  // Cycle through reticle styles
  const handleReticleStyleCycle = useCallback(() => {
    const currentStyle = settings.reticle.style;
    const styles: Array<'simple' | 'mil' | 'tree'> = ['simple', 'mil', 'tree'];
    const currentIndex = styles.indexOf(currentStyle as 'simple' | 'mil' | 'tree');
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % styles.length;
    updateGameSettings({ reticle: { ...settings.reticle, style: styles[nextIndex] } });
    if (!audioIsTestMode()) {
      AudioManager.playSound('click');
    }
  }, [settings.reticle]);

  // Update recoil decay over time
  useEffect(() => {
    if (gameState !== 'running') return;

    let lastTime = performance.now();

    const updateLoop = () => {
      const now = performance.now();
      const dtS = (now - lastTime) / 1000; // Convert to seconds
      lastTime = now;

      // Update recoil decay using functional state update
      setRecoilState(prevRecoil => {
        if (!prevRecoil) return null;
        
        const decayed = updateRecoilDecay(prevRecoil, dtS);
        const newRecoilState = {
          offsetY: decayed.y,
          offsetZ: decayed.z,
          decayRate: prevRecoil.decayRate,
        };

        // Check if recoil has fully decayed (very small values)
        if (Math.abs(newRecoilState.offsetY) < 0.001 && Math.abs(newRecoilState.offsetZ) < 0.001) {
          return null;
        }
        return newRecoilState;
      });
    };

    const intervalId = setInterval(updateLoop, 16); // ~60 FPS
    return () => clearInterval(intervalId);
  }, [gameState]);

  // Drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Track start time for frame-rate independent animations
    const startTime = performance.now();

    const draw = (timestamp: number) => {
      // Calculate time in seconds for animations (frame-rate independent)
      const timeS = (timestamp - startTime) / 1000;
      
      // Clear canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

      const viewportConfig = {
        worldWidth: WORLD_WIDTH,
        worldHeight: WORLD_HEIGHT,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
      };

      // Draw wind cues (flags and mirage) if there's any wind
      if (level && (level.windMps !== 0 || level.gustMps > 0) && settings.showHud) {
        // Get the wind used for the most recent shot, or use baseline/gust for visual cues
        // Use baseline wind for visual indicator, scaled by realism preset
        const visualWind = level.windMps * windScale;
        
        drawWindCues(
          ctx,
          visualWind,
          timeS,
          canvasSize.width,
          canvasSize.height,
          WORLD_WIDTH,
          WORLD_HEIGHT,
          true // Show mirage
        );
      }

      // Draw targets based on target mode
      if (targetMode === 'plates' && plates.length > 0) {
        // Draw individual plate targets
        plates.forEach((plate) => {
          const center = worldToCanvas(
            { x: WORLD_WIDTH / 2 + plate.centerZ_M, y: WORLD_HEIGHT / 2 - plate.centerY_M },
            viewportConfig
          );
          const radiusPixels = plate.radiusM * (canvasSize.width / WORLD_WIDTH);

          // Draw plate circle
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(center.x, center.y, radiusPixels, 0, Math.PI * 2);
          ctx.stroke();

          // Fill with semi-transparent red if hit
          const hitCount = plateHits[plate.id] || 0;
          if (hitCount > 0) {
            ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
            ctx.fill();
          }

          // Draw plate label
          if (plate.label) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(plate.label, center.x, center.y);
          }

          // Draw points value
          ctx.fillStyle = '#ffff00';
          ctx.font = '12px sans-serif';
          ctx.fillText(`${plate.points} pts`, center.x, center.y + radiusPixels + 15);

          // Draw hit count if hit
          if (hitCount > 0) {
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(`${hitCount}x`, center.x, center.y - radiusPixels - 10);
          }
        });
      } else {
        // Draw bullseye target rings (scaled by level.targetScale)
        targetConfig.rings.forEach((ring) => {
          const center = worldToCanvas(
            { x: targetConfig.centerX, y: targetConfig.centerY },
            viewportConfig
          );
          const radiusPixels = ring.radius * (canvasSize.width / WORLD_WIDTH) * (level?.targetScale || 1);

          // Alternate colors for rings
          const ringIndex = targetConfig.rings.findIndex((r) => r.radius === ring.radius);
          ctx.strokeStyle = ringIndex % 2 === 0 ? '#ffffff' : '#e0e0e0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(center.x, center.y, radiusPixels, 0, Math.PI * 2);
          ctx.stroke();
        });
      }

      // Draw impacts
      impacts.forEach((impact) => {
        const canvasPoint = worldToCanvas({ x: impact.x, y: impact.y }, viewportConfig);

        // Draw impact marker (X)
        const size = 10;
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(canvasPoint.x - size, canvasPoint.y - size);
        ctx.lineTo(canvasPoint.x + size, canvasPoint.y + size);
        ctx.moveTo(canvasPoint.x + size, canvasPoint.y - size);
        ctx.lineTo(canvasPoint.x - size, canvasPoint.y + size);
        ctx.stroke();

        // Draw score text
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px sans-serif';
        ctx.fillText(impact.score.toString(), canvasPoint.x + 12, canvasPoint.y - 12);
      });

      // Draw reticle
      const reticleCanvas = worldToCanvas(recticlePosition, viewportConfig);
      const reticleStyle = settings.reticle.style;
      const reticleThickness = settings.reticle.thickness;
      const showCenterDot = settings.reticle.centerDot;

      if (reticleStyle === 'simple') {
        // Simple crosshair reticle
        const reticleSize = 20;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = reticleThickness;
        ctx.beginPath();
        // Crosshair
        ctx.moveTo(reticleCanvas.x - reticleSize, reticleCanvas.y);
        ctx.lineTo(reticleCanvas.x + reticleSize, reticleCanvas.y);
        ctx.moveTo(reticleCanvas.x, reticleCanvas.y - reticleSize);
        ctx.lineTo(reticleCanvas.x, reticleCanvas.y + reticleSize);
        // Circle
        ctx.arc(reticleCanvas.x, reticleCanvas.y, reticleSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        // Center dot
        if (showCenterDot) {
          ctx.beginPath();
          ctx.arc(reticleCanvas.x, reticleCanvas.y, reticleThickness, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (reticleStyle === 'mil' && level) {
        // MIL reticle with tick marks
        const milSpacingPixels = getMilSpacingPixels(
          level.distanceM,
          1,
          WORLD_WIDTH,
          canvasSize.width,
          magnification
        );

        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = reticleThickness;
        ctx.fillStyle = '#ff0000';

        // Draw center dot
        if (showCenterDot) {
          ctx.beginPath();
          ctx.arc(reticleCanvas.x, reticleCanvas.y, reticleThickness, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw horizontal MIL ticks (left and right from center)
        [-1, 1].forEach((direction) => {
          for (let i = 1; i <= 10; i++) {
            const xPos = reticleCanvas.x + (i * milSpacingPixels * direction);
            const isMajorTick = i % 5 === 0;
            const tickLength = isMajorTick ? 15 : 8;

            ctx.beginPath();
            ctx.moveTo(xPos, reticleCanvas.y - tickLength / 2);
            ctx.lineTo(xPos, reticleCanvas.y + tickLength / 2);
            ctx.stroke();

            // Draw number labels for major ticks
            if (isMajorTick && i <= 10) {
              ctx.font = '10px sans-serif';
              ctx.textAlign = 'center';
              const labelY = reticleCanvas.y + (direction === 1 ? 25 : -10);
              ctx.fillText(i.toString() + 'M', xPos, labelY);
            }
          }
        });

        // Draw vertical MIL ticks (up and down from center)
        [-1, 1].forEach((direction) => {
          for (let i = 1; i <= 10; i++) {
            const yPos = reticleCanvas.y + (i * milSpacingPixels * direction);
            const isMajorTick = i % 5 === 0;
            const tickLength = isMajorTick ? 15 : 8;

            ctx.beginPath();
            ctx.moveTo(reticleCanvas.x - tickLength / 2, yPos);
            ctx.lineTo(reticleCanvas.x + tickLength / 2, yPos);
            ctx.stroke();

            // Draw number labels for major ticks
            if (isMajorTick && i <= 10) {
              ctx.font = '10px sans-serif';
              ctx.textAlign = 'left';
              const labelX = reticleCanvas.x + 15;
              ctx.fillText(i.toString() + 'M', labelX, yPos + 3);
            }
          }
        });

        // Draw thin crosshair lines to edges
        ctx.beginPath();
        ctx.moveTo(0, reticleCanvas.y);
        ctx.lineTo(canvasSize.width, reticleCanvas.y);
        ctx.moveTo(reticleCanvas.x, 0);
        ctx.lineTo(reticleCanvas.x, canvasSize.height);
        ctx.stroke();
      }

      requestAnimationFrame(draw);
    };

    // Start the animation loop with initial timestamp
    const animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canvasSize,
    impacts,
    targetConfig,
    recticlePosition,
    level,
    magnification,
    settings.showHud,
    settings.reticle,
  ]);

  // Setup press-and-hold handlers for turret buttons (only when game is running)
  useEffect(() => {
    if (gameState !== 'running') {
      return;
    }

    const elevationUpHandler = createPressHoldHandler({
      onRepeat: () => handleElevationAdjust(1),
      initialDelay: 500,
      repeatDelay: 150,
      rampUpDuration: 1000,
      minRepeatDelay: 50,
    });

    const elevationDownHandler = createPressHoldHandler({
      onRepeat: () => handleElevationAdjust(-1),
      initialDelay: 500,
      repeatDelay: 150,
      rampUpDuration: 1000,
      minRepeatDelay: 50,
    });

    const windageLeftHandler = createPressHoldHandler({
      onRepeat: () => handleWindageAdjust(-1),
      initialDelay: 500,
      repeatDelay: 150,
      rampUpDuration: 1000,
      minRepeatDelay: 50,
    });

    const windageRightHandler = createPressHoldHandler({
      onRepeat: () => handleWindageAdjust(1),
      initialDelay: 500,
      repeatDelay: 150,
      rampUpDuration: 1000,
      minRepeatDelay: 50,
    });

    const elevationUpBtn = elevationUpRef.current;
    const elevationDownBtn = elevationDownRef.current;
    const windageLeftBtn = windageLeftRef.current;
    const windageRightBtn = windageRightRef.current;

    // Attach handlers using pointer events
    const addPointerListeners = (btn: HTMLButtonElement | null, handler: PressHoldHandler) => {
      if (!btn) return;
      btn.addEventListener('pointerdown', handler.start);
      btn.addEventListener('pointerup', handler.stop);
      btn.addEventListener('pointerleave', handler.stop);
      btn.addEventListener('pointercancel', handler.stop);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    };

    const removePointerListeners = (
      btn: HTMLButtonElement | null,
      handler: PressHoldHandler
    ) => {
      if (!btn) return;
      btn.removeEventListener('pointerdown', handler.start);
      btn.removeEventListener('pointerup', handler.stop);
      btn.removeEventListener('pointerleave', handler.stop);
      btn.removeEventListener('pointercancel', handler.stop);
      const preventContext = (e: Event) => e.preventDefault();
      btn.removeEventListener('contextmenu', preventContext);
    };

    addPointerListeners(elevationUpBtn, elevationUpHandler);
    addPointerListeners(elevationDownBtn, elevationDownHandler);
    addPointerListeners(windageLeftBtn, windageLeftHandler);
    addPointerListeners(windageRightBtn, windageRightHandler);

    return () => {
      elevationUpHandler.stop();
      elevationDownHandler.stop();
      windageLeftHandler.stop();
      windageRightHandler.stop();
      removePointerListeners(elevationUpBtn, elevationUpHandler);
      removePointerListeners(elevationDownBtn, elevationDownHandler);
      removePointerListeners(windageLeftBtn, windageLeftHandler);
      removePointerListeners(windageRightBtn, windageRightHandler);
    };
  }, [gameState, handleElevationAdjust, handleWindageAdjust]);

  // Show briefing screen
  if (gameState === 'briefing' && level && weapon) {
    return (
      <div className="game-page" data-testid="game-page">
        <div className="game-header">
          <button onClick={handleBack} className="back-button-in-game" data-testid="back-button">
            ← Back
          </button>
          <h2>{level.name}</h2>
        </div>
        
        <div className="game-container">
          <div className="level-briefing" data-testid="level-briefing">
            <h3>Mission Briefing</h3>
            <div className="briefing-content">
              <div className="briefing-section">
                <h4>Weapon</h4>
                <p>{weapon.name}</p>
              </div>
              
              <div className="briefing-section">
                <h4>Target Distance</h4>
                <p>{level.distanceM}m</p>
              </div>
              
              <div className="briefing-section">
                <h4>Wind Conditions</h4>
                {settings.showNumericWind ? (
                  <>
                    <p>Baseline: {level.windMps} m/s</p>
                    {level.gustMps > 0 && <p>Gust range: ±{level.gustMps} m/s</p>}
                  </>
                ) : (
                  <p>Visual indicators only (flags + mirage)</p>
                )}
              </div>
              
              <div className="briefing-section">
                <h4>Mission</h4>
                <p>{level.description}</p>
              </div>
              
              <div className="briefing-section">
                <h4>Star Thresholds</h4>
                <p>★ {level.starThresholds.one}pts | ★★ {level.starThresholds.two}pts | ★★★ {level.starThresholds.three}pts</p>
              </div>
            </div>
            
            <button
              onClick={handleStartLevel}
              className="level-start-button"
              data-testid="start-level"
            >
              Start Mission
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show results screen
  if (gameState === 'results' && level) {
    const nextLevel = getNextLevel();
    return (
      <div className="game-page" data-testid="game-page">
        <div className="game-header">
          <button onClick={handleBack} className="back-button-in-game" data-testid="back-button">
            ← Back
          </button>
          <h2>Mission Complete</h2>
        </div>
        
        <div className="game-container">
          <div className="results-screen" data-testid="results-screen">
            <h3>Results</h3>
            
            <div className="score-display">
              <div className="total-score">
                <span className="score-label">Total Score</span>
                <span className="score-value" data-testid="total-score">{totalScore}</span>
              </div>
              
              {!isZeroRange && (
                <div className="stars-display">
                  <span className="score-label">Stars Earned</span>
                  <span className="stars-value" data-testid="stars-earned">
                    {earnedStars > 0 ? '★'.repeat(earnedStars) : '☆☆☆'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="results-summary">
              <p>Shots fired: {level.maxShots}</p>
              <p>Weapon: {weapon?.name}</p>
              {impacts.length >= 2 && (
                <p data-testid="group-size">
                  Group Size: {(groupSizeMeters * 100).toFixed(1)} cm
                  ({dispersionMetersToMils(groupSizeMeters, level.distanceM).toFixed(1)} MILs)
                </p>
              )}
            </div>

            {/* Range Card */}
            {shotTelemetry.length > 0 && (
              <RangeCard
                rangeCard={assembleRangeCard(
                  level.id,
                  level.name,
                  level.distanceM,
                  weaponId,
                  shotTelemetry,
                  levelStartedAt,
                  Date.now()
                )}
              />
            )}

            {/* Replay Viewer Controls */}
            {shotTelemetry.length > 0 && (
              <>
                <button
                  onClick={() => setShowReplay(!showReplay)}
                  className="results-button replay-toggle-button"
                  data-testid="replay-open"
                >
                  {showReplay ? '▼' : '▶'} {showReplay ? 'Hide' : 'Show'} Replay
                </button>
                
                {showReplay && (
                  <ReplayViewer
                    shots={shotTelemetry}
                    canvasRef={canvasRef}
                    metersToPixelsRatio={canvasSize.width / WORLD_WIDTH}
                    centerX={canvasSize.width / 2}
                    centerY={canvasSize.height / 2}
                    visible={true}
                    onToggle={() => setShowReplay(false)}
                  />
                )}
              </>
            )}

            {/* Export Button */}
            {impacts.length > 0 && (
              <button
                onClick={handleExportPng}
                className="results-button export-png-button"
                data-testid="export-png"
              >
                📷 Export PNG
              </button>
            )}

            <div className="results-actions">
              <button
                onClick={handleRetry}
                className="results-button retry-button"
                data-testid="retry-button"
              >
                Retry
              </button>
              
              {nextLevel && (
                <button
                  onClick={handleNextLevel}
                  className="results-button next-level-button"
                  data-testid="next-level"
                >
                  Next Level: {nextLevel.name}
                </button>
              )}
              
              <button
                onClick={handleBack}
                className="results-button back-to-levels-button"
                data-testid="back-to-levels"
              >
                Back to Levels
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!level || !weapon) {
    return (
      <div className="game-page" data-testid="game-page">
        <div className="game-header">
          <button onClick={handleBack} className="back-button-in-game" data-testid="back-button">
            ← Back
          </button>
          <h2>{!level ? 'Select Level' : 'Select Weapon'}</h2>
        </div>
        <div className="game-container">
          <div className="cta-container" data-testid="friendly-cta">
            <p>{!level ? 'Please select a level from the Levels page.' : 'Please select a weapon from the Weapons page.'}</p>
            <button
              onClick={handleBack}
              className="cta-button"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page" data-testid="game-page">
      <div className="game-header">
        <button onClick={handleBack} className="back-button-in-game" data-testid="back-button">
          ← Back
        </button>
        <h2>{level.name}</h2>
        <div className="game-stats">
          <span className="stat" data-testid="shot-count">
            {isZeroRange && shotLimitMode === 'unlimited'
              ? 'Shots: ∞'
              : `Shots: ${shotCount}/${level.maxShots}`}
          </span>
          <span className="stat">Score: {impacts.reduce((sum, i) => sum + i.score, 0)}</span>
          {timeRemaining !== null && (
            <span className="stat" data-testid="timer">
              Time: <span className={timeRemaining <= 5 ? 'timer-warning' : ''}>{
                timeRemaining > 0 ? `${Math.ceil(timeRemaining)}s` : '0s'
              }</span>
            </span>
          )}
          {targetMode === 'plates' && plates.length > 0 && (
            <span className="stat" data-testid="plates-mode">
              Mode: Plates
            </span>
          )}
        </div>
        <div className="reticle-controls">
          <button
            onClick={handleReticleStyleCycle}
            className="control-button"
            data-testid="reticle-mode-toggle"
            title="Toggle reticle mode"
          >
            {settings.reticle.style === 'simple' ? 'Crosshair' : settings.reticle.style === 'mil' ? 'MIL Reticle' : 'Tree Reticle'}
          </button>
          <button
            onClick={() => {
              const currentIndex = MAGNIFICATION_LEVELS.indexOf(magnification);
              const nextIndex = (currentIndex + 1) % MAGNIFICATION_LEVELS.length;
              setMagnification(MAGNIFICATION_LEVELS[nextIndex]);
            }}
            className="control-button"
            data-testid="magnification-control"
            title={`Magnification: ${magnification}x`}
          >
            {magnification}x
          </button>
        </div>
      </div>
      
      {/* Wind HUD Panel */}
      {level && settings.showHud && (
        <div className="wind-hud" data-testid="wind-cues">
          <div className="wind-display">
            <div className="wind-header">
              <span>Wind</span>
              <div className={`wind-arrow ${level.windMps >= 0 ? 'right' : 'left'}`} data-testid="wind-arrow">
                {level.windMps >= 0 ? '→' : '←'}
              </div>
            </div>
            <div className="wind-details">
              {settings.showNumericWind ? (
                <>
                  <span className="wind-baseline" data-testid="wind-numeric">Baseline: <strong>{level.windMps > 0 ? '+' : ''}{(level.windMps * windScale).toFixed(1)} m/s</strong></span>
                  <span className="wind-gust" data-testid="wind-numeric">Gust: ±{(level.gustMps * windScale).toFixed(1)} m/s</span>
                </>
              ) : (
                <span className="wind-visual">Visual cues only</span>
              )}
              {dragScale !== 1 && <span className="wind-preset">Preset: {settings.realismPreset}</span>}
            </div>
          </div>
          {/* Environment HUD - shows temperature and altitude */}
          <div className="env-hud" data-testid="env-summary">
            <div className="env-header">
              <span>Environment</span>
            </div>
            <div className="env-details">
              {settings.showNumericWind || settings.realismPreset !== 'arcade' ? (
                <>
                  <span className="env-temp">Temp: <strong>{levelEnv.temperatureC}°C</strong></span>
                  <span className="env-alt">Alt: <strong>{levelEnv.altitudeM}m</strong></span>
                  {settings.realismPreset !== 'arcade' && (
                    <span className="env-density">ρ: {computedAirDensity.toFixed(3)} kg/m³</span>
                  )}
                </>
              ) : (
                <span className="env-visual">Std conditions</span>
              )}
            </div>
          </div>
          
          {/* Expert Extras Badge - shown when any expert extra is enabled */}
          {settings.realismPreset === 'expert' && (settings.expertSpinDriftEnabled || settings.expertCoriolisEnabled) && (
            <div className="expert-extras-badge" data-testid="expert-extras-badge" title="Expert Sim Extras enabled: gameplay approximations for additional challenge">
              <div className="expert-extras-header">
                <span>🎯 Expert Extras</span>
                <span className="expert-extras-status">ON</span>
              </div>
              <div className="expert-extras-list">
                {settings.expertSpinDriftEnabled && (
                  <span className="expert-extra-item" title="Sim extras: Rightward bullet curve from rotation">
                    Spin Drift
                  </span>
                )}
                {settings.expertCoriolisEnabled && (
                  <span className="expert-extra-item" title="Sim extras: Earth rotation-based deflections">
                    Coriolis
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Turret Dialing UI */}
      {level && settings.showHud && (
        <div className="turret-hud" data-testid="turret-hud">
          <div className="turret-display">
            <div className="turret-header">
              <span>Turret</span>
              <button
                onClick={handleResetTurret}
                className="reset-turret-button"
                data-testid="reset-turret"
                title="Reset turret to zero"
              >
                Reset
              </button>
            </div>
            
            {/* Elevation Controls */}
            <div className="turret-control-group">
              <span className="turret-label">Elevation</span>
              <div className="turret-dial-controls">
                <button
                  ref={elevationDownRef}
                  onClick={() => handleElevationAdjust(-1)}
                  className="dial-button"
                  data-testid="elevation-down"
                  title="Elevation Down (-) (hold for rapid fire)"
                >
                  −
                </button>
                <span className="dial-value" data-testid="elevation-value">
                  {turretState.elevationMils >= 0 ? '+' : ''}{turretState.elevationMils.toFixed(1)}
                </span>
                <button
                  ref={elevationUpRef}
                  onClick={() => handleElevationAdjust(1)}
                  className="dial-button"
                  data-testid="elevation-up"
                  title="Elevation Up (+) (hold for rapid fire)"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Windage Controls */}
            <div className="turret-control-group">
              <span className="turret-label">Windage</span>
              <div className="turret-dial-controls">
                <button
                  ref={windageLeftRef}
                  onClick={() => handleWindageAdjust(-1)}
                  className="dial-button"
                  data-testid="windage-left"
                  title="Windage Left (-) (hold for rapid fire)"
                >
                  −
                </button>
                <span className="dial-value" data-testid="windage-value">
                  {turretState.windageMils >= 0 ? '+' : ''}{turretState.windageMils.toFixed(1)}
                </span>
                <button
                  ref={windageRightRef}
                  onClick={() => handleWindageAdjust(1)}
                  className="dial-button"
                  data-testid="windage-right"
                  title="Windage Right (+) (hold for rapid fire)"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Zero Profile Actions */}
            <div className="turret-actions">
              <button
                onClick={handleSaveZero}
                className="zero-action-button save-zero"
                data-testid="save-zero"
                title="Save current turret settings as zero profile"
              >
                Save Zero
              </button>
              <button
                onClick={handleReturnToZero}
                className="zero-action-button return-zero"
                data-testid="return-to-zero"
                title="Return to saved zero profile"
              >
                Return to Zero
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="level-info-bar" data-testid="level-info-bar">
        <span>Weapon: {weapon.name}</span>
        {effectiveAmmo && (
          <span data-testid="ammo-name">Ammo: {effectiveAmmo.name}</span>
        )}
        <span>{level.distanceM}m</span>
        <span>Range: {level.difficulty}</span>
        {targetMode === 'plates' && plates.length > 0 && (
          <span data-testid="plate-hit-count">
            Plate Hits: {Object.values(plateHits).reduce((sum, count) => sum + count, 0)}/{impacts.filter(i => i.plateId).length}
          </span>
        )}
      </div>
      
      {/* Impact Offset Panel */}
      {impacts.length > 0 && settings.showHud && (
        <div className="impact-offset-panel" data-testid="impact-offset-panel">
          <div className="impact-offset-header">
            <span>Impact Offset</span>
            {impacts.length > 0 && (
              <span className="last-shot-label">(Last Shot)</span>
            )}
          </div>
          <div className="impact-offset-values">
            <div className="offset-row">
              <span className="offset-label">Elevation:</span>
              <span className={`offset-value ${impacts[impacts.length - 1].elevationMils > 0 ? 'positive' : impacts[impacts.length - 1].elevationMils < 0 ? 'negative' : 'zero'}`}>
                {settings.display.offsetUnit === 'moa'
                  ? `${impacts[impacts.length - 1].elevationMils >= 0 ? '+' : ''}${milsToMoa(impacts[impacts.length - 1].elevationMils).toFixed(1)} MOA`
                  : `${impacts[impacts.length - 1].elevationMils >= 0 ? '+' : ''}${impacts[impacts.length - 1].elevationMils.toFixed(1)} MIL`}
              </span>
            </div>
            <div className="offset-row">
              <span className="offset-label">Windage:</span>
              <span className={`offset-value ${impacts[impacts.length - 1].windageMils > 0 ? 'positive' : impacts[impacts.length - 1].windageMils < 0 ? 'negative' : 'zero'}`}>
                {settings.display.offsetUnit === 'moa'
                  ? `${impacts[impacts.length - 1].windageMils >= 0 ? '+' : ''}${milsToMoa(impacts[impacts.length - 1].windageMils).toFixed(1)} MOA`
                  : `${impacts[impacts.length - 1].windageMils >= 0 ? '+' : ''}${impacts[impacts.length - 1].windageMils.toFixed(1)} MIL`}
              </span>
            </div>
          </div>
          {/* Apply Correction button - only available in Arcade mode */}
          {settings.realismPreset === 'arcade' && (
            <button
              onClick={handleApplyCorrection}
              className="apply-correction-button"
              data-testid="apply-correction"
              title="Apply correction to turret (Arcade only)"
            >
              Apply Correction
            </button>
          )}
        </div>
      )}
      
      <div className="game-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="game-canvas"
          data-testid="game-canvas"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
        />
        
        {/* Time's Up Banner */}
        {timeRemaining === 0 && (
          <div className="time-up-banner" data-testid="time-up-banner">
            <h2>Time's Up!</h2>
            <p>Shooting blocked - press Reset to try again</p>
          </div>
        )}
      </div>
      
      {/* Mobile Fire Button */}
      {settings.mobile.showFireButton && gameState === 'running' && (
        <button
          onClick={handlePointerDown}
          className="fire-button mobile-fire-button"
          data-testid="fire-button"
          onPointerUp={(e) => e.stopPropagation()}
          title="Fire (tap to shoot)"
        >
          🔥
        </button>
      )}
      
      {/* Shot History */}
      {impacts.length > 0 && settings.showHud && (
        <div className="shot-history" data-testid="shot-history">
          <h4>Shot History</h4>
          <div className="shot-list">
            {impacts.map((impact) => (
              <div key={impact.index} className="shot-row" data-testid={`shot-row-${impact.index}`} {...(impact.pellets && impact.pellets.length > 0 && { 'data-testid': 'shotgun-multi-impacts' })}>
                <span className="shot-number">#{impact.index}</span>
                <span className="shot-score">{impact.score} pts</span>
                {impact.pellets && impact.pellets.length > 0 && (
                  <span className="shot-pellets" title={`${impact.pellets.length} pellets`}>
                    🔫 {impact.pellets.length}
                  </span>
                )}
                <span className={`shot-wind ${impact.windUsedMps > 0 ? 'right' : impact.windUsedMps < 0 ? 'left' : 'neutral'}`}>
              {impact.windUsedMps > 0 ? '→' : impact.windUsedMps < 0 ? '←' : '•'} {impact.windUsedMps.toFixed(1)} m/s
            </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="game-controls">
        <button
          onClick={handleReset}
          disabled={shotCount === maxShots}
          className="game-button"
          data-testid="reset-level-button"
        >
          Reset Level
        </button>
        <span className="instructions">Move mouse/touch to aim, click/tap to fire</span>
      </div>

      {/* Tutorial Overlay - shows on first play of tutorial levels */}
      {level && (
        <TutorialOverlay
          key={level.id}
          levelId={level.id}
          onDismiss={() => {}}
        />
      )}
    </div>
  );
}

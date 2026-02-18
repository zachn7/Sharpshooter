import { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { PointerEvent } from 'react';
import { worldToCanvas, canvasToWorld } from '../utils/coordinates';
import { createStandardTarget, calculateRingScore } from '../utils/scoring';
import { simulateShotToDistance } from '../physics';
import { getWeaponById, DEFAULT_WEAPON_ID } from '../data/weapons';
import { getLevelById, DEFAULT_LEVEL_ID, calculateStars, LEVELS } from '../data/levels';
import { getSelectedWeaponId, updateLevelProgress, getGameSettings, getRealismScaling } from '../storage';

interface Impact {
  x: number;
  y: number;
  score: number;
  timestamp: number;
  windUsedMps: number;
  index: number;
}

type GameState = 'briefing' | 'running' | 'results';

const WORLD_WIDTH = 1.0; // meters
const WORLD_HEIGHT = 0.75; // 4:3 aspect ratio

export function Game() {
  const { levelId } = useParams<{ levelId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [recticlePosition, setReticlePosition] = useState({ x: 0.5, y: 0.5 });
  const [impacts, setImpacts] = useState<Impact[]>([]);
  const [gameState, setGameState] = useState<GameState>('briefing');
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [totalScore, setTotalScore] = useState(0);
  const [earnedStars, setEarnedStars] = useState<0 | 1 | 2 | 3>(0);
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
  const level = getLevelById(levelIdSafe);
  const maxShots = level?.maxShots ?? 3;
  const [shotCount, setShotCount] = useState(maxShots);
  
  // Load weapon data
  const weaponId = getSelectedWeaponId() || DEFAULT_WEAPON_ID;
  const weapon = getWeaponById(weaponId) || getWeaponById(DEFAULT_WEAPON_ID);
  
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

  // Pointer down handler (fire shot)
  const handlePointerDown = useCallback(() => {
    if (shotCount <= 0 || !level || !weapon || gameState !== 'running') return;

    // Convert reticle world position to physics aim coordinates (meters from target center)
    const aimX_M = (recticlePosition.x - WORLD_WIDTH / 2);
    const aimY_M = -(recticlePosition.y - WORLD_HEIGHT / 2);

    // Run physics simulation with level and weapon parameters
    // Apply realism scaling based on preset
    const scaledDragFactor = weapon.params.dragFactor * dragScale;
    const scaledWindMps = level.windMps * windScale;
    const scaledGustMps = level.gustMps * windScale;
    
    const result = simulateShotToDistance(
      {
        distanceM: level.distanceM,
        muzzleVelocityMps: weapon.params.muzzleVelocityMps,
        dragFactor: scaledDragFactor,
        aimY_M,
        aimZ_M: aimX_M,
        dtS: 0.002,
      },
      {
        windMps: scaledWindMps,
        gustMps: scaledGustMps,
        airDensityKgM3: level.airDensityKgM3,
        gravityMps2: level.gravityMps2,
        seed: testSeed + shotCount, // Each shot gets a different deterministic seed
      }
    );

    // Convert physics impact back to world coordinates
    const impactX = WORLD_WIDTH / 2 + result.impactZ_M;
    const impactY = WORLD_HEIGHT / 2 - result.impactY_M;

    const impact: Impact = {
      x: impactX,
      y: impactY,
      score: calculateRingScore({ x: impactX, y: impactY }, targetConfig),
      timestamp: Date.now(),
      windUsedMps: result.windUsedMps,
      index: impacts.length + 1,
    };

    const newImpacts = [...impacts, impact];
    setImpacts(newImpacts);
    const newShotCount = shotCount - 1;
    setShotCount(newShotCount);
    
    // Check if level is complete
    if (newShotCount === 0) {
      const finalScore = newImpacts.reduce((sum, i) => sum + i.score, 0);
      const stars = level ? calculateStars(finalScore, level.starThresholds) : 0;
      
      setTotalScore(finalScore);
      setEarnedStars(stars);
      setGameState('results');
      
      // Save progress
      updateLevelProgress(level.id, finalScore, level.starThresholds);
    }
  }, [recticlePosition, shotCount, level, weapon, impacts, targetConfig, gameState, testSeed, dragScale, windScale]);

  // Start level handler
  const handleStartLevel = useCallback(() => {
    setGameState('running');
  }, []);

  // Reset level handler
  const handleReset = useCallback(() => {
    setImpacts([]);
    setShotCount(maxShots);
    setTotalScore(0);
    setEarnedStars(0);
    setGameState('running');
  }, [maxShots]);

  // Retry level handler
  const handleRetry = useCallback(() => {
    setImpacts([]);
    setShotCount(maxShots);
    setTotalScore(0);
    setEarnedStars(0);
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
    const next = getNextLevel();
    if (next) {
      setImpacts([]);
      setShotCount(next.maxShots);
      setTotalScore(0);
      setEarnedStars(0);
      setGameState('briefing');
      navigate(`/game/${next.id}`);
    }
  }, [getNextLevel, navigate]);

  // Back to levels handler
  const handleBack = useCallback(() => {
    navigate('/levels');
  }, [navigate]);



  // Drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

      const viewportConfig = {
        worldWidth: WORLD_WIDTH,
        worldHeight: WORLD_HEIGHT,
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
      };

      // Draw wind flags (visual indicator)
      if (level && (level.windMps !== 0 || level.gustMps > 0)) {
        const flagY = canvasSize.height * 0.15;
        const flagScale = Math.min(canvasSize.width, canvasSize.height) / 800;
        
        // Draw 2 wind flags
        [0.15, 0.85].forEach((relX, _idx) => {
          const flagX = canvasSize.width * relX;
          
          // Determine wind direction and strength
          const baselineWind = level.windMps;
          const maxWind = Math.abs(baselineWind) + level.gustMps;
          const windStrength = Math.min(maxWind / 15, 1); // Normalize 0-1 for visual
          
          // Flag pole
          ctx.strokeStyle = '#666';
          ctx.lineWidth = 2 * flagScale;
          ctx.beginPath();
          ctx.moveTo(flagX, canvasSize.height * 0.05);
          ctx.lineTo(flagX, flagY);
          ctx.stroke();
          
          // Flag size based on wind strength
          const flagLength = 30 * flagScale * (0.5 + 0.5 * windStrength);
          const flagHeight = 20 * flagScale;
          
          // Flag color based on wind direction (positive=right, negative=left)
          ctx.fillStyle = baselineWind >= 0 ? '#4a9eff' : '#ff6b4a';
          ctx.beginPath();
          ctx.moveTo(flagX, flagY);
          
          // Curved flag based on wind direction
          const windDirection = baselineWind >= 0 ? 1 : -1;
          const controlX1 = flagX + windDirection * flagLength * 0.5;
          const controlY1 = flagY - flagHeight * 0.3;
          const controlX2 = flagX + windDirection * flagLength * 0.7;
          const controlY2 = flagY + flagHeight * 0.3;
          const endX = flagX + windDirection * flagLength;
          
          ctx.quadraticCurveTo(controlX1, controlY1, endX, controlY2);
          ctx.quadraticCurveTo(controlX2, flagY + flagHeight * 0.5, flagX, flagY + flagHeight);
          ctx.fill();
        });
      }

      // Draw target rings (scaled by level.targetScale)
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
      const reticleSize = 20;

      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Crosshair
      ctx.moveTo(reticleCanvas.x - reticleSize, reticleCanvas.y);
      ctx.lineTo(reticleCanvas.x + reticleSize, reticleCanvas.y);
      ctx.moveTo(reticleCanvas.x, reticleCanvas.y - reticleSize);
      ctx.lineTo(reticleCanvas.x, reticleCanvas.y + reticleSize);
      // Circle
      ctx.arc(reticleCanvas.x, reticleCanvas.y, reticleSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      requestAnimationFrame(draw);
    };

    const animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [canvasSize, impacts, targetConfig, recticlePosition, level]);

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
                <p>Baseline: {level.windMps} m/s</p>
                {level.gustMps > 0 && <p>Gust range: ±{level.gustMps} m/s</p>}
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
              
              <div className="stars-display">
                <span className="score-label">Stars Earned</span>
                <span className="stars-value" data-testid="stars-earned">
                  {earnedStars > 0 ? '★'.repeat(earnedStars) : '☆☆☆'}
                </span>
              </div>
            </div>
            
            <div className="results-summary">
              <p>Shots fired: {level.maxShots}</p>
              <p>Weapon: {weapon?.name}</p>
            </div>
            
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
            Shots: {shotCount}/{level.maxShots}
          </span>
          <span className="stat">Score: {impacts.reduce((sum, i) => sum + i.score, 0)}</span>
        </div>
      </div>
      
      {/* Wind HUD Panel */}
      {level && settings.showHud && (
        <div className="wind-hud" data-testid="wind-hud">
          <div className="wind-display">
            <div className="wind-header">
              <span>Wind</span>
              <div className={`wind-arrow ${level.windMps >= 0 ? 'right' : 'left'}`} data-testid="wind-arrow">
                {level.windMps >= 0 ? '→' : '←'}
              </div>
            </div>
            <div className="wind-details">
              <span className="wind-baseline">Baseline: <strong>{level.windMps > 0 ? '+' : ''}{(level.windMps * windScale).toFixed(1)} m/s</strong></span>
              <span className="wind-gust">Gust: ±{(level.gustMps * windScale).toFixed(1)} m/s</span>
              {dragScale !== 1 && <span className="wind-preset">Preset: {settings.realismPreset}</span>}
            </div>
          </div>
        </div>
      )}
      
      <div className="level-info-bar" data-testid="level-info-bar">
        <span>Weapon: {weapon.name}</span>
        <span>{level.distanceM}m</span>
        <span>Range: {level.difficulty}</span>
      </div>
      
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
      </div>
      
      {/* Shot History */}
      {impacts.length > 0 && settings.showHud && (
        <div className="shot-history" data-testid="shot-history">
          <h4>Shot History</h4>
          <div className="shot-list">
            {impacts.map((impact) => (
              <div key={impact.index} className="shot-row" data-testid={`shot-row-${impact.index}`}>
                <span className="shot-number">#{impact.index}</span>
                <span className="shot-score">{impact.score} pts</span>
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
    </div>
  );
}

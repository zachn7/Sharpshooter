import { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { PointerEvent } from 'react';
import { worldToCanvas, canvasToWorld } from '../utils/coordinates';
import { createStandardTarget, calculateRingScore } from '../utils/scoring';
import { simulateShotToDistance } from '../physics';
import { getWeaponById, DEFAULT_WEAPON_ID } from '../data/weapons';
import { getLevelById, DEFAULT_LEVEL_ID, calculateStars } from '../data/levels';
import { getSelectedWeaponId, updateLevelProgress } from '../storage';

interface Impact {
  x: number;
  y: number;
  score: number;
  timestamp: number;
}

const WORLD_WIDTH = 1.0; // meters
const WORLD_HEIGHT = 0.75; // 4:3 aspect ratio

export function Game() {
  const { levelId } = useParams<{ levelId?: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [recticlePosition, setReticlePosition] = useState({ x: 0.5, y: 0.5 });
  const [impacts, setImpacts] = useState<Impact[]>([]);
  const [levelComplete, setLevelComplete] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  
  // Load level data
  const levelIdSafe = levelId || DEFAULT_LEVEL_ID;
  const level = getLevelById(levelIdSafe);
  const maxShots = level?.maxShots ?? 3;
  const [shotCount, setShotCount] = useState(maxShots);
  
  // Load weapon data
  const weaponId = getSelectedWeaponId();
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
    if (shotCount <= 0 || !level || !weapon) return;
    if (levelComplete) return;

    // Convert reticle world position to physics aim coordinates (meters from target center)
    const aimX_M = (recticlePosition.x - WORLD_WIDTH / 2);
    const aimY_M = -(recticlePosition.y - WORLD_HEIGHT / 2);

    // Run physics simulation with level and weapon parameters
    const result = simulateShotToDistance(
      {
        distanceM: level.distanceM,
        muzzleVelocityMps: weapon.params.muzzleVelocityMps,
        dragFactor: weapon.params.dragFactor,
        aimY_M,
        aimZ_M: aimX_M,
        dtS: 0.002,
      },
      {
        windMps: level.windMps,
        gustMps: level.gustMps,
        airDensityKgM3: level.airDensityKgM3,
        gravityMps2: level.gravityMps2,
        seed: Date.now(), // Each shot gets a different seed
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
    };

    const newImpacts = [...impacts, impact];
    setImpacts(newImpacts);
    const newShotCount = shotCount - 1;
    setShotCount(newShotCount);
    
    // Check if level is complete
    if (newShotCount === 0) {
      setLevelComplete(true);
      
      // Save progress
      const totalScore = newImpacts.reduce((sum, i) => sum + i.score, 0);
      updateLevelProgress(level.id, totalScore, level.starThresholds);
    }
  }, [recticlePosition, shotCount, level, weapon, impacts, targetConfig, levelComplete]);

  // Reset level handler
  const handleReset = useCallback(() => {
    setImpacts([]);
    setShotCount(maxShots);
    setLevelComplete(false);
  }, [maxShots]);

  // Back to levels handler
  const handleBack = useCallback(() => {
    navigate('/levels');
  }, [navigate]);

  const totalScore = impacts.reduce((sum, impact) => sum + impact.score, 0);
  const earnedStars = level ? calculateStars(totalScore, level.starThresholds) : 0;

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
  }, [canvasSize, impacts, targetConfig, recticlePosition, level?.targetScale]);

  if (!level || !weapon) {
    return (
      <div className="game-page" data-testid="game-page">
        <div className="game-header">
          <button onClick={handleBack} className="back-button-in-game" data-testid="back-button">
            ← Back
          </button>
          <h2>Loading...</h2>
        </div>
        <div className="game-container">
          <p>Loading level data...</p>
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
          <span className="stat">Score: {totalScore}</span>
          {levelComplete && (
            <span className="stat stars" data-testid="stars-earned">
              {earnedStars > 0 ? '★'.repeat(earnedStars) : '☆☆☆'}
            </span>
          )}
        </div>
      </div>
      
      <div className="level-info-bar" data-testid="level-info-bar">
        <span>Weapon: {weapon.name}</span>
        <span>{level.distanceM}m</span>
        <span>Wind: {level.windMps} m/s</span>
        {level.gustMps > 0 && <span>Gust: ±{level.gustMps} m/s</span>}
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

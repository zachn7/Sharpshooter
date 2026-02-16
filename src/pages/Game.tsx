import { useRef, useEffect, useState, useCallback } from 'react';
import type { PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { worldToCanvas, canvasToWorld } from '../utils/coordinates';
import { createStandardTarget, calculateRingScore } from '../utils/scoring';

interface Impact {
  x: number;
  y: number;
  score: number;
  timestamp: number;
}

const MAX_SHOTS = 3;
const WORLD_WIDTH = 1.0; // meters
const WORLD_HEIGHT = 0.75; // 4:3 aspect ratio

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [recticlePosition, setReticlePosition] = useState({ x: 0.5, y: 0.5 });
  const [impacts, setImpacts] = useState<Impact[]>([]);
  const [shotCount, setShotCount] = useState(MAX_SHOTS);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

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
    if (shotCount <= 0) return;

    const impact: Impact = {
      x: recticlePosition.x,
      y: recticlePosition.y,
      score: calculateRingScore(recticlePosition, targetConfig),
      timestamp: Date.now(),
    };

    setImpacts((prev) => [...prev, impact]);
    setShotCount((prev) => prev - 1);
  }, [recticlePosition, shotCount, targetConfig]);

  // Reset level handler
  const handleReset = useCallback(() => {
    setImpacts([]);
    setShotCount(MAX_SHOTS);
  }, []);

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

      // Draw target rings
      targetConfig.rings.forEach((ring) => {
        const center = worldToCanvas(
          { x: targetConfig.centerX, y: targetConfig.centerY },
          viewportConfig
        );
        const radiusPixels = ring.radius * (canvasSize.width / WORLD_WIDTH);

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
  }, [canvasSize, impacts, targetConfig, recticlePosition]);

  const totalScore = impacts.reduce((sum, impact) => sum + impact.score, 0);

  return (
    <div className="game-page" data-testid="game-page">
      <div className="game-header">
        <Link to="/" className="back-button-in-game" data-testid="back-button">
          ← Back
        </Link>
        <h2>Sharpshooter</h2>
        <div className="game-stats">
          <span className="stat" data-testid="shot-count">
            Shots: {shotCount}/{MAX_SHOTS}
          </span>
          <span className="stat">Score: {totalScore}</span>
        </div>
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
          disabled={shotCount === MAX_SHOTS}
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

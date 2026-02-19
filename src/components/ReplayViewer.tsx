/**
 * Replay Viewer Component
 * 
 * Overlays shot path traces on the target canvas for visualizing shot trajectories.
 */

import { useEffect, useCallback } from 'react';
import type { ShotTelemetry, PathPoint } from '../types';

interface ReplayViewerProps {
  shots: ShotTelemetry[];
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  metersToPixelsRatio: number; // Meters to pixels conversion
  centerX: number; // Center X in pixels
  centerY: number; // Center Y in pixels
  visible: boolean;
  onToggle: () => void;
}

export function ReplayViewer({
  shots,
  canvasRef,
  metersToPixelsRatio,
  centerX,
  centerY,
  visible,
  onToggle,
}: ReplayViewerProps) {
  /**
   * Draw shot path on canvas
   * @param ctx - Canvas 2D context
   * @param path - Array of path points
   * @param color - Trace color
   */
  const drawPath = useCallback((
    ctx: CanvasRenderingContext2D,
    path: PathPoint[],
    color: string
  ): void => {
    if (path.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Dashed line for path

    // Move to first point (convert from meters to pixels, from center)
    const startX = centerX + path[0].x * metersToPixelsRatio;
    const startY = centerY - path[0].y * metersToPixelsRatio; // Y is inverted in canvas
    ctx.moveTo(startX, startY);

    // Draw to each subsequent point
    for (let i = 1; i < path.length; i++) {
      const x = centerX + path[i].x * metersToPixelsRatio;
      const y = centerY - path[i].y * metersToPixelsRatio;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Draw impact point
    const lastPoint = path[path.length - 1];
    const impactX = centerX + lastPoint.x * metersToPixelsRatio;
    const impactY = centerY - lastPoint.y * metersToPixelsRatio;
    
    ctx.beginPath();
    ctx.arc(impactX, impactY, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [centerX, centerY, metersToPixelsRatio]);

  // Draw traces when visibility or shots change
  useEffect(() => {
    const drawTraces = (): void => {
      const canvas = canvasRef.current;
      if (!canvas || !visible) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Colors: red, blue, green, orange, purple for different shots
      const colors = ['#ff4444', '#4444ff', '#44aa44', '#ffaa00', '#aa44ff'];

      // Draw each shot path
      shots.forEach((shot, index) => {
        if (shot.path && shot.path.length > 0) {
          const color = colors[index % colors.length];
          drawPath(ctx, shot.path, color);
        }
      });
    };

    if (visible) {
      // Schedule draw after render to avoid accessing refs during render
      const timer = setTimeout(drawTraces, 0);
      return () => clearTimeout(timer);
    }
  }, [visible, shots, canvasRef, drawPath]);

  const shotsWithPaths = shots.filter((s) => s.path && s.path.length > 0).length;

  return (
    <div className="replay-viewer" data-testid="replay-viewer">
      <div className="replay-viewer-controls">
        <button
          className={`replay-toggle ${visible ? 'active' : ''}`}
          onClick={onToggle}
          data-testid="replay-toggle"
          aria-pressed={visible}
        >
          {visible ? 'Hide' : 'Show'} Shot Traces
        </button>
        {shotsWithPaths > 0 && (
          <span className="traces-count">
            {shotsWithPaths} trace{shotsWithPaths !== 1 ? 's' : ''} available
          </span>
        )}
      </div>
      {visible && shotsWithPaths === 0 && (
        <p className="no-traces">
          No shot traces available. Enable "Record Shot Path" in settings to save trajectories.
        </p>
      )}
      {visible && shotsWithPaths > 0 && (
        <p className="traces-info">
          Shot traces show the projectile path. Different colors represent different shots.
        </p>
      )}
    </div>
  );
}
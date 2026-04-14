import { useEffect, useMemo, useRef } from 'react';
import type { ShotTelemetry } from '../types';

interface ReplayViewerProps {
  shots: ShotTelemetry[];
  visible: boolean;
  onToggle: () => void;
}

const CANVAS_WIDTH = 520;
const CANVAS_HEIGHT = 390;
const COLORS = ['#ff6b6b', '#4dabf7', '#69db7c', '#ffd43b', '#b197fc'];

export function ReplayViewer({ shots, visible, onToggle }: ReplayViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shotsWithPaths = useMemo(
    () => shots.filter((shot) => shot.path && shot.path.length > 0),
    [shots]
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const maxOffset = Math.max(
      0.25,
      ...shotsWithPaths.flatMap((shot) => [
        ...(shot.path ?? []).map((point) => Math.abs(point.x)),
        ...(shot.path ?? []).map((point) => Math.abs(point.y)),
        Math.abs(shot.impactX),
        Math.abs(shot.impactY),
      ])
    );
    const scale = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.36 / maxOffset;

    drawReferenceTarget(ctx, centerX, centerY);

    shotsWithPaths.forEach((shot, index) => {
      const color = COLORS[index % COLORS.length];
      const path = shot.path ?? [];
      if (path.length === 0) {
        return;
      }

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      path.forEach((point, pointIndex) => {
        const x = centerX + point.x * scale;
        const y = centerY - point.y * scale;
        if (pointIndex === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      const impactX = centerX + shot.impactX * scale;
      const impactY = centerY - shot.impactY * scale;
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(impactX, impactY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = '12px sans-serif';
      ctx.fillText(`#${shot.shotNumber}`, impactX + 8, impactY - 8);
    });
  }, [shotsWithPaths, visible]);

  return (
    <div className="replay-viewer" data-testid="replay-viewer">
      <div className="replay-viewer-controls">
        <button
          className={`replay-toggle ${visible ? 'active' : ''}`}
          onClick={onToggle}
          data-testid="replay-toggle"
          aria-pressed={visible}
        >
          {visible ? 'Hide' : 'Show'} Replay
        </button>
        {shotsWithPaths.length > 0 && (
          <span className="traces-count">
            {shotsWithPaths.length} replay trace{shotsWithPaths.length === 1 ? '' : 's'} loaded
          </span>
        )}
      </div>

      {visible && shotsWithPaths.length === 0 && (
        <p className="no-traces">
          No replay data was recorded for these shots. New runs save trajectories by default now.
        </p>
      )}

      {visible && shotsWithPaths.length > 0 && (
        <div className="replay-preview">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="replay-preview-canvas"
            data-testid="replay-preview-canvas"
          />
          <p className="traces-info">
            Top-down-ish shot trace view: center is point of aim, colored lines show flight paths, dots mark impacts.
          </p>
        </div>
      )}
    </div>
  );
}

function drawReferenceTarget(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
  const radii = [24, 48, 72, 96, 120];
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;

  radii.forEach((radius) => {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.beginPath();
  ctx.moveTo(centerX - 130, centerY);
  ctx.lineTo(centerX + 130, centerY);
  ctx.moveTo(centerX, centerY - 130);
  ctx.lineTo(centerX, centerY + 130);
  ctx.stroke();
}

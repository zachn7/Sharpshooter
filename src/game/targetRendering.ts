import type { PlateTarget } from '../data/levels';

export function drawTargetShape(
  ctx: CanvasRenderingContext2D,
  target: PlateTarget,
  centerX: number,
  centerY: number,
  radiusPixels: number,
  hitCount: number
) {
  const stroke = hitCount > 0 ? '#ff9b7d' : '#ffffff';
  const fill = hitCount > 0 ? 'rgba(255, 107, 107, 0.35)' : 'rgba(255, 255, 255, 0.08)';

  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.fillStyle = fill;
  ctx.lineWidth = 3;

  switch (target.targetType ?? 'plate') {
    case 'bottle':
      drawBottle(ctx, centerX, centerY, radiusPixels);
      break;
    case 'can':
      drawCan(ctx, centerX, centerY, radiusPixels);
      break;
    case 'dummy':
      drawDummy(ctx, centerX, centerY, radiusPixels);
      break;
    case 'steel':
      drawSteel(ctx, centerX, centerY, radiusPixels);
      break;
    case 'clay':
      drawClay(ctx, centerX, centerY, radiusPixels);
      break;
    case 'plate':
    default:
      drawPlate(ctx, centerX, centerY, radiusPixels);
      break;
  }

  ctx.restore();
}

function drawPlate(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawClay(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = ctx.fillStyle === '#ffffff' ? '#f59e0b' : 'rgba(245, 158, 11, 0.45)';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.2, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawBottle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x - r * 0.35, y - r * 0.8, r * 0.7, r * 1.3, r * 0.14);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(x - r * 0.16, y - r * 1.15, r * 0.32, r * 0.42, r * 0.08);
  ctx.fill();
  ctx.stroke();
}

function drawCan(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x - r * 0.45, y - r * 0.75, r * 0.9, r * 1.5, r * 0.18);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - r * 0.45, y - r * 0.45);
  ctx.lineTo(x + r * 0.45, y - r * 0.45);
  ctx.moveTo(x - r * 0.45, y + r * 0.45);
  ctx.lineTo(x + r * 0.45, y + r * 0.45);
  ctx.stroke();
}

function drawDummy(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y - r * 0.75, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(x - r * 0.45, y - r * 0.45, r * 0.9, r * 1.3, r * 0.18);
  ctx.fill();
  ctx.stroke();
}

function drawSteel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.85, y - r * 0.2);
  ctx.lineTo(x + r * 0.55, y + r);
  ctx.lineTo(x - r * 0.55, y + r);
  ctx.lineTo(x - r * 0.85, y - r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export interface ViewportConfig {
  worldWidth: number;
  worldHeight: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function createZoomedViewport(
  baseWorldWidth: number,
  baseWorldHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  magnification: number
): ViewportConfig {
  return {
    worldWidth: baseWorldWidth / magnification,
    worldHeight: baseWorldHeight / magnification,
    canvasWidth,
    canvasHeight,
  };
}

export function getViewportWorldBounds(viewport: ViewportConfig) {
  const centerX = 0.5;
  const centerY = 0.375;
  const halfWidth = viewport.worldWidth / 2;
  const halfHeight = viewport.worldHeight / 2;

  return {
    minX: centerX - halfWidth,
    maxX: centerX + halfWidth,
    minY: centerY - halfHeight,
    maxY: centerY + halfHeight,
  };
}

export function clampToViewport(
  point: { x: number; y: number },
  viewport: ViewportConfig
) {
  const bounds = getViewportWorldBounds(viewport);

  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, point.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, point.y)),
  };
}

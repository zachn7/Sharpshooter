interface WorldPoint {
  x: number;
  y: number;
}

interface CanvasPoint {
  x: number;
  y: number;
}

interface ViewportConfig {
  worldWidth: number;
  worldHeight: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function worldToCanvas(worldPoint: WorldPoint, config: ViewportConfig): CanvasPoint {
  const scaleX = config.canvasWidth / config.worldWidth;
  const scaleY = config.canvasHeight / config.worldHeight;

  // Invert Y since canvas Y increases downward, world Y increases upward
  return {
    x: worldPoint.x * scaleX,
    y: config.canvasHeight - worldPoint.y * scaleY,
  };
}

export function canvasToWorld(canvasPoint: CanvasPoint, config: ViewportConfig): WorldPoint {
  const scaleX = config.canvasWidth / config.worldWidth;
  const scaleY = config.canvasHeight / config.worldHeight;

  // Invert Y since canvas Y increases downward, world Y increases upward
  return {
    x: canvasPoint.x / scaleX,
    y: (config.canvasHeight - canvasPoint.y) / scaleY,
  };
}

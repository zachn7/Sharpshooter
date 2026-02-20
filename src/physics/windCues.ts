import { getWindAtFlagPositions, type WindSamplingContext } from './windLayers';

/**
 * Visual wind cues (flags and mirage)
 * 
 * Provides canvas rendering functions for visual wind indicators:
 * - Flags that lean with wind direction and animate with gusts
 * - Mirage shimmer lines that drift to indicate wind direction
 * - Layered wind flags (near/mid/far) for multi-segment wind profiles
 */

export interface WindCueState {
  timeS: number; // Time in seconds for animation
  windUsedMps: number; // Actual wind used for the shot
}

export interface FlagConfig {
  x: number; // World X position
  y: number; // World Y position
  scale: number; // Size multiplier
}

/**
 * Default flag positions in world coordinates
 */
export const DEFAULT_FLAGS: FlagConfig[] = [
  { x: 0.15, y: 0.2, scale: 1.0 },   // Top-left
  { x: 0.85, y: 0.2, scale: 1.0 },   // Top-right
  { x: 0.5, y: 0.15, scale: 0.8 },   // Top-center (smaller)
];

/**
 * Draw a wind flag on the canvas
 * 
 * @param ctx - Canvas 2D context
 * @param flag - Flag configuration
 * @param windUsedMps - Wind speed in m/s (positive = right, negative = left)
 * @param timeS - Time in seconds for animation
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param worldWidth - World width in meters
 * @param worldHeight - World height in meters
 */
export function drawWindFlag(
  ctx: CanvasRenderingContext2D,
  flag: FlagConfig,
  windUsedMps: number,
  timeS: number,
  canvasWidth: number,
  canvasHeight: number,
  worldWidth: number,
  worldHeight: number
): void {
  // Scale factors
  const scaleX = canvasWidth / worldWidth;
  const scaleY = canvasHeight / worldHeight;
  
  // Flag dimensions (in meters, scaled by flag.scale)
  const poleHeight = 0.08 * flag.scale;
  const flagWidth = 0.06 * flag.scale;
  const flagHeight = 0.04 * flag.scale;
  
  // Convert to canvas coordinates
  const poleX = flag.x * scaleX;
  const poleBottomY = flag.y * scaleY;
  const poleTopY = poleBottomY - poleHeight * scaleY;
  
  // Calculate flag angle based on wind
  // Positive wind = flag points right, negative = flag points left
  const windSpeed = Math.abs(windUsedMps);
  const windDirection = windUsedMps >= 0 ? 1 : -1;
  
  // Flag angle: more wind = more lean (max 45 degrees)
  const maxAngle = Math.PI / 4; // 45 degrees
  const angle = (minMax(windSpeed / 10, 0, 1)) * maxAngle * windDirection;
  
  // Animation: flutter effect based on time and wind speed
  const flutterFreq = 3 + windSpeed; // Faster wind = faster flutter
  const flutterAmp = 0.02 * windSpeed; // Amplitude based on wind speed
  const flutter = Math.sin(timeS * flutterFreq) * flutterAmp;
  
  // Draw pole
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 2 * scaleX;
  ctx.beginPath();
  ctx.moveTo(poleX, poleBottomY);
  ctx.lineTo(poleX, poleTopY);
  ctx.stroke();
  
  // Draw flag
  ctx.save();
  ctx.translate(poleX, poleTopY);
  ctx.rotate(angle + flutter);
  
  // Flag gradient for depth
  const gradient = ctx.createLinearGradient(0, 0, flagWidth * scaleX, 0);
  gradient.addColorStop(0, '#ff4444');
  gradient.addColorStop(1, '#cc0000');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-flagWidth * scaleX, -flagHeight * scaleY / 2);
  ctx.lineTo(-flagWidth * scaleX, flagHeight * scaleY / 2);
  ctx.closePath();
  ctx.fill();
  
  // Flag outline
  ctx.strokeStyle = '#880000';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Draw mirage shimmer lines
 * Mirage is heat haze that appears as horizontal shimmering lines
 * Drift opposite to wind direction (looks more realistic)
 * 
 * @param ctx - Canvas 2D context
 * @param windUsedMps - Wind speed in m/s
 * @param timeS - Time in seconds for animation
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 */
export function drawMirage(
  ctx: CanvasRenderingContext2D,
  windUsedMps: number,
  timeS: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  const windSpeed = Math.abs(windUsedMps);
  if (windSpeed < 0.5) return; // Don't show mirage in calm winds
  
  // Mirage drifts opposite to wind
  const driftDirection = windUsedMps >= 0 ? -1 : 1;
  const driftSpeed = (windSpeed / 20) * canvasWidth; // Pixels per second
  
  // Number of shimmer lines (more with more wind)
  const numLines = Math.floor(minMax(windSpeed / 2, 3, 10));
  
  // Draw horizontal shimmer lines near the target area (center-bottom)
  const targetArea = {
    x: canvasWidth * 0.2,
    y: canvasHeight * 0.7,
    width: canvasWidth * 0.6,
    height: canvasHeight * 0.2,
  };
  
  ctx.save();
  ctx.globalAlpha = 0.15 + (windSpeed / 30); // More visible with stronger wind
  
  for (let i = 0; i < numLines; i++) {
    // Create shimmer effect with varying phases
    const phaseOffset = i * 0.7;
    const x = (targetArea.x + (timeS * driftSpeed * driftDirection + phaseOffset * 100) % targetArea.width);
    const wrappedX = x < targetArea.x ? x + targetArea.width : (x > targetArea.x + targetArea.width ? x - targetArea.width : x);
    
    const y = targetArea.y + (i / numLines) * targetArea.height;
    const lineWidth = 20 + Math.sin(timeS * 2 + phaseOffset) * 10 + windSpeed * 2;
    
    // Shimmer line with gradient
    const gradient = ctx.createLinearGradient(wrappedX - lineWidth / 2, 0, wrappedX + lineWidth / 2, 0);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(wrappedX - lineWidth / 2, y, lineWidth, 2 + windSpeed * 0.5);
  }
  
  ctx.restore();
}

/**
 * Draw all wind cues (flags and mirage)
 * 
 * @param ctx - Canvas 2D context
 * @param windUsedMps - Wind speed in m/s
 * @param timeS - Time in seconds
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param worldWidth - World width in meters
 * @param worldHeight - World height in meters
 * @param showMirage - Whether to show mirage (can be disabled for performance)
 */
export function drawWindCues(
  ctx: CanvasRenderingContext2D,
  windUsedMps: number,
  timeS: number,
  canvasWidth: number,
  canvasHeight: number,
  worldWidth: number,
  worldHeight: number,
  showMirage: boolean = true
): void {
  // Draw flags
  for (const flag of DEFAULT_FLAGS) {
    drawWindFlag(ctx, flag, windUsedMps, timeS, canvasWidth, canvasHeight, worldWidth, worldHeight);
  }
  
  // Draw mirage (if enabled)
  if (showMirage) {
    drawMirage(ctx, windUsedMps, timeS, canvasWidth, canvasHeight);
  }
}

/**
 * Draw layered wind cues (near/mid/far flags) for wind profiles
 * Shows multiple flags representing wind at different distances
 * 
 * @param ctx - Canvas 2D context
 * @param windContext - Wind sampling context with profile
 * @param targetDistanceM - Total distance to target
 * @param timeS - Time in seconds for animation
 * @param canvasWidth - Canvas width in pixels
 * @param canvasHeight - Canvas height in pixels
 * @param worldWidth - World width in meters
 * @param worldHeight - World height in meters
 * @param showMirage - Whether to show mirage
 */
export function drawLayeredWindCues(
  ctx: CanvasRenderingContext2D,
  windContext: WindSamplingContext,
  targetDistanceM: number,
  timeS: number,
  canvasWidth: number,
  canvasHeight: number,
  worldWidth: number,
  worldHeight: number,
  showMirage: boolean = true
): void {
  // Get wind at near, mid, and far positions
  const { near, mid, far } = getWindAtFlagPositions(targetDistanceM, windContext);
  
  // Layered flag positions (arranged vertically to show different ranges)
  const layerFlags: FlagConfig[] = [
    { x: 0.15, y: 0.25, scale: 0.9 },   // Near (left, higher)
    { x: 0.5, y: 0.18, scale: 1.0 },    // Mid (center)
    { x: 0.85, y: 0.25, scale: 0.9 },  // Far (right, higher)
  ];
  
  const windSamples = [near, mid, far];
  
  // Draw each flag with its corresponding wind
  layerFlags.forEach((flag, index) => {
    const windSample = windSamples[index];
    drawWindFlag(ctx, flag, windSample.windSpeed, timeS, canvasWidth, canvasHeight, worldWidth, worldHeight);
  });
  
  // Draw mirage based on far wind (most impactful)
  if (showMirage) {
    drawMirage(ctx, far.windSpeed, timeS, canvasWidth, canvasHeight);
  }
}

/**
 * Get default showNumericWind value for a preset
 * Arcade: true (shows numeric wind by default)
 * Realistic: false (uses visual cues by default)
 * Expert: false (hardcore mode - no numbers)
 */
export function getDefaultShowNumericWind(preset: 'arcade' | 'realistic' | 'expert'): boolean {
  return preset === 'arcade';
}

/**
 * Check if layered wind rendering should be used
 * Returns true if windContext has a windProfile
 */
export function shouldUseLayeredWindCues(windContext: WindSamplingContext): boolean {
  return !!(windContext.windProfile && windContext.windProfile.length > 0);
}

/**
 * Utility: Clamp value between min and max
 */
function minMax(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Canvas export utilities
 * 
 * Provides functionality to export canvas content to PNG images.
 */

/**
 * Export canvas to PNG data URL
 * @param canvas - HTMLCanvasElement to export
 * @param backgroundColor - Background color (hex or rgba), defaults to transparent
 * @returns Promise resolving to PNG data URL
 */
export async function canvasToPng(
  canvas: HTMLCanvasElement,
  backgroundColor: string = 'transparent'
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary canvas to apply background color
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const ctx = tempCanvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get 2D context'));
        return;
      }

      // Fill background if not transparent
      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      }

      // Draw original canvas onto temp canvas
      ctx.drawImage(canvas, 0, 0);

      // Export to PNG
      const dataUrl = tempCanvas.toDataURL('image/png');
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Download PNG data URL as file
 * @param dataUrl - PNG data URL
 * @param filename - Filename to save as (without extension)
 */
export function downloadPng(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export and download canvas as PNG
 * @param canvas - HTMLCanvasElement to export
 * @param filename - Filename prefix (timestamp will be appended)
 * @param backgroundColor - Background color (optional)
 */
export async function exportCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename: string,
  backgroundColor?: string
): Promise<void> {
  try {
    const dataUrl = await canvasToPng(canvas, backgroundColor);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    downloadPng(dataUrl, `${filename}-${timestamp}`);
  } catch (error) {
    throw new Error(`Failed to export canvas: ${error}`);
  }
}

/**
 * Create composite image from multiple canvases stacked vertically
 * @param canvases - Array of canvases to stack
 * @returns Promise resolving to new canvas element
 */
export async function stackCanvases(
  canvases: HTMLCanvasElement[]
): Promise<HTMLCanvasElement> {
  if (canvases.length === 0) {
    throw new Error('No canvases to stack');
  }

  // Calculate total height and max width
  const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0);
  const maxWidth = Math.max(...canvases.map((c) => c.width));

  // Create composite canvas
  const composite = document.createElement('canvas');
  composite.width = maxWidth;
  composite.height = totalHeight;
  const ctx = composite.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  // Draw each canvas onto composite
  let yOffset = 0;
  for (const canvas of canvases) {
    ctx.drawImage(canvas, 0, yOffset);
    yOffset += canvas.height;
  }

  return composite;
}

/**
 * Capture DOM element as canvas using html2canvas (optional)
 * Note: This is a placeholder for future implementation
 * For now, use canvasToPng directly
 * 
 * @param element - DOM element to capture
 * @returns Promise resolving to canvas
 */
export async function captureDomAsCanvas(
  _element: HTMLElement
): Promise<HTMLCanvasElement> {
  // Placeholder: would need html2canvas library for this
  throw new Error('DOM capture requires html2canvas library (not included for FREE-only build)');
}
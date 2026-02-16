import { useRef, useEffect } from 'react';

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple placeholder drawing
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('Game Area - Coming Soon!', canvas.width / 2, canvas.height / 2);
  }, []);

  return (
    <div className="game-page" data-testid="game-page">
      <h2>Game</h2>
      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="game-canvas"
          data-testid="game-canvas"
        />
      </div>
    </div>
  );
}

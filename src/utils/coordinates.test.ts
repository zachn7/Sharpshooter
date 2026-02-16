import { describe, it, expect } from 'vitest';
import { worldToCanvas, canvasToWorld } from './coordinates';

describe('coordinates', () => {
  const config = {
    worldWidth: 1.0,
    worldHeight: 0.75,
    canvasWidth: 800,
    canvasHeight: 600,
  };

  describe('worldToCanvas', () => {
    it('converts world origin to bottom-left canvas corner', () => {
      const worldPoint = { x: 0, y: 0 };
      const canvasPoint = worldToCanvas(worldPoint, config);
      expect(canvasPoint.x).toBe(0);
      expect(canvasPoint.y).toBe(600); // Bottom of canvas
    });

    it('converts world origin to bottom-right canvas corner', () => {
      const worldPoint = { x: 1.0, y: 0 };
      const canvasPoint = worldToCanvas(worldPoint, config);
      expect(canvasPoint.x).toBe(800);
      expect(canvasPoint.y).toBe(600); // Bottom of canvas
    });

    it('converts world origin to top-left canvas corner', () => {
      const worldPoint = { x: 0, y: 0.75 };
      const canvasPoint = worldToCanvas(worldPoint, config);
      expect(canvasPoint.x).toBe(0);
      expect(canvasPoint.y).toBe(0); // Top of canvas
    });

    it('converts world center to canvas center', () => {
      const worldPoint = { x: 0.5, y: 0.375 };
      const canvasPoint = worldToCanvas(worldPoint, config);
      expect(canvasPoint.x).toBe(400);
      expect(canvasPoint.y).toBe(300);
    });

    it('scales coordinates proportionally', () => {
      const worldPoint = { x: 1.0, y: 0.75 };
      const canvasPoint = worldToCanvas(worldPoint, config);
      expect(canvasPoint.x).toBe(800);
      expect(canvasPoint.y).toBe(0); // Top of canvas
    });
  });

  describe('canvasToWorld', () => {
    it('converts canvas origin to world origin', () => {
      const canvasPoint = { x: 0, y: 600 };
      const worldPoint = canvasToWorld(canvasPoint, config);
      expect(worldPoint.x).toBe(0);
      expect(worldPoint.y).toBe(0);
    });

    it('converts canvas center to world center', () => {
      const canvasPoint = { x: 400, y: 300 };
      const worldPoint = canvasToWorld(canvasPoint, config);
      expect(worldPoint.x).toBe(0.5);
      expect(worldPoint.y).toBe(0.375);
    });

    it('converts canvas top-left to world top-left', () => {
      const canvasPoint = { x: 0, y: 0 };
      const worldPoint = canvasToWorld(canvasPoint, config);
      expect(worldPoint.x).toBe(0);
      expect(worldPoint.y).toBe(0.75);
    });
  });

  describe('round-trip conversion', () => {
    it('worldToCanvas then canvasToWorld returns original world point', () => {
      const originalWorld = { x: 0.375, y: 0.25 };
      const canvas = worldToCanvas(originalWorld, config);
      const resultWorld = canvasToWorld(canvas, config);
      expect(resultWorld.x).toBeCloseTo(originalWorld.x, 6);
      expect(resultWorld.y).toBeCloseTo(originalWorld.y, 6);
    });

    it('canvasToWorld then worldToCanvas returns original canvas point', () => {
      const originalCanvas = { x: 450, y: 250 };
      const world = canvasToWorld(originalCanvas, config);
      const resultCanvas = worldToCanvas(world, config);
      expect(resultCanvas.x).toBeCloseTo(originalCanvas.x, 6);
      expect(resultCanvas.y).toBeCloseTo(originalCanvas.y, 6);
    });
  });
});

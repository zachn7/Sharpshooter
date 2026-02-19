/**
 * Frame-rate independent game loop hook
 * 
 * Provides a consistent time-based update mechanism using requestAnimationFrame
 * with delta-time clamping for stability across different frame rates.
 * 
 * @example
 * useRafLoop(({ deltaMs, deltaS, totalTimeMs, timestampMs }) => {
 *   // Update game state based on delta time
 *   position.x += velocity.x * deltaS;
 *   position.y += velocity.y * deltaS;
 * }, [gameState, velocity]); // Dependencies control when callback changes
 */

import { useRef, useEffect, useCallback } from 'react';
import type { GameLoopMetrics } from './rafLoop';
import { clampDelta, DEFAULT_MAX_DELTA_MS } from './rafLoop';

/**
 * Configuration options for useRafLoop
 */
export interface UseRafLoopOptions {
  /** Maximum delta time in milliseconds (default: 50ms) */
  maxDeltaMs?: number;
  /** Whether to start the loop immediately (default: true) */
  play?: boolean;
  /** Callback when loop starts */
  onStart?: () => void;
  /** Callback when loop stops */
  onStop?: () => void;
}

/**
 * Frame callback type
 */
export type FrameCallback = (metrics: GameLoopMetrics) => void;

/**
 * useRafLoop hook return value
 */
export interface UseRafLoopReturn {
  /** Start the loop */
  start: () => void;
  /** Stop the loop */
  stop: () => void;
  /** Check if loop is running */
  isActive: () => boolean;
}

/**
 * Frame-rate independent game loop hook
 * 
 * Provides a requestAnimationFrame-based loop with delta-time tracking,
 * clamping to prevent physics explosions, and start/stop control.
 * 
 * Key features:
 * - Clamped delta time: Prevents huge physics jumps after tab switch
 * - Fractional delta: Provides deltaS (seconds) for physics calculations
 * - Total time tracking: Useful for animations and time-based effects
 * - Start/stop control: Can pause/resume the loop as needed
 * 
 * @param callback - Function to call each frame with timing metrics
 * @param options - Configuration options
 * @returns Object with start, stop, and isActive methods
 */
export function useRafLoop(
  callback: FrameCallback,
  options: UseRafLoopOptions = {}
): UseRafLoopReturn {
  const { maxDeltaMs = DEFAULT_MAX_DELTA_MS, play = true, onStart, onStop } = options;
  
  // Track request ID for cleanup
  const requestIdRef = useRef<number | null>(null);
  
  // Track timing state
  const previousTimeRef = useRef<number | null>(null);
  const totalTimeMsRef = useRef(0);
  const isActiveRef = useRef(play);
  
  // Stable callback reference to avoid recreating loop unnecessarily
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Update play state ref
  useEffect(() => {
    isActiveRef.current = play;
  }, [play]);

  // Effect to set up the loop function
  useEffect(() => {
    const loop = (timestamp: number) => {
      // Handle first frame
      if (previousTimeRef.current === null) {
        previousTimeRef.current = timestamp;
        totalTimeMsRef.current = 0;
        requestIdRef.current = requestAnimationFrame(loop);
        return;
      }

      // Calculate delta time (clamped)
      const rawDeltaMs = timestamp - previousTimeRef.current;
      const deltaMs = clampDelta(rawDeltaMs, maxDeltaMs);
      
      // Update timing state
      previousTimeRef.current = timestamp;
      totalTimeMsRef.current += deltaMs;
      
      // Prepare metrics
      const metrics: GameLoopMetrics = {
        deltaMs,
        deltaS: deltaMs / 1000, // Convert to seconds for physics
        totalTimeMs: totalTimeMsRef.current,
        timestampMs: timestamp,
      };

      // Call the callback
      callbackRef.current(metrics);
      
      // Continue loop if active
      if (isActiveRef.current) {
        requestIdRef.current = requestAnimationFrame(loop);
      }
    };

    // Start the loop
    if (play) {
      requestIdRef.current = requestAnimationFrame(loop);
      return () => {
        if (requestIdRef.current !== null) {
          cancelAnimationFrame(requestIdRef.current);
        }
      };
    }
  }, [play, maxDeltaMs, onStart, onStop]); // Note: callbackRef and isActiveRef are refs

  // Start the loop
  const start = useCallback(() => {
    if (isActiveRef.current) return;
    
    isActiveRef.current = true;
    previousTimeRef.current = null; // Reset timing on restart
    totalTimeMsRef.current = 0;
    
    // Restart the loop
    const restartLoop = (timestamp: number) => {
      if (!isActiveRef.current) return;
      previousTimeRef.current = timestamp;
      totalTimeMsRef.current = 0;
      requestIdRef.current = requestAnimationFrame(restartLoop);
      
      // Call the frame logic
      const runFrame = (ts: number) => {
        if (!isActiveRef.current) return;
        
        if (previousTimeRef.current === null) {
          previousTimeRef.current = ts;
          requestIdRef.current = requestAnimationFrame(runFrame);
          return;
        }
        
        const rawDeltaMs = ts - previousTimeRef.current;
        const deltaMs = clampDelta(rawDeltaMs, maxDeltaMs);
        
        previousTimeRef.current = ts;
        totalTimeMsRef.current += deltaMs;
        
        const metrics: GameLoopMetrics = {
          deltaMs,
          deltaS: deltaMs / 1000,
          totalTimeMs: totalTimeMsRef.current,
          timestampMs: ts,
        };
        
        callbackRef.current(metrics);
        
        if (isActiveRef.current) {
          requestIdRef.current = requestAnimationFrame(runFrame);
        }
      };
      
      requestIdRef.current = requestAnimationFrame(runFrame);
    };
    
    requestIdRef.current = requestAnimationFrame(restartLoop);
    
    onStart?.();
  }, [maxDeltaMs, onStart]);

  // Stop the loop
  const stop = useCallback(() => {
    if (!isActiveRef.current) return;
    
    isActiveRef.current = false;
    if (requestIdRef.current !== null) {
      cancelAnimationFrame(requestIdRef.current);
      requestIdRef.current = null;
    }
    
    onStop?.();
  }, [onStop]);

  // Check if active
  const isActive = useCallback(() => {
    return isActiveRef.current;
  }, []);

  // Start/stop loop based on play prop changes (outside the main effect)
  useEffect(() => {
    // The main effect handles initial start/stop based on play prop
    // This effect ensures state is kept in sync
    isActiveRef.current = play;
  }, [play]);

  return { start, stop, isActive };
}

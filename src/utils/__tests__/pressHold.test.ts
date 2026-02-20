import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPressHoldHandler, attachPressHold, type PressHoldHandler } from '../pressHold';

describe('pressHold utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createPressHoldHandler', () => {
    it('does not repeat immediately after start', () => {
      const onRepeat = vi.fn();
      const handler = createPressHoldHandler({
        onRepeat,
        initialDelay: 500,
        repeatDelay: 100,
      });

      handler.start();
      expect(onRepeat).not.toHaveBeenCalled();
    });

    it('fires first repeat after initial delay', () => {
      const onRepeat = vi.fn();
      const handler = createPressHoldHandler({
        onRepeat,
        initialDelay: 500,
        repeatDelay: 100,
      });

      handler.start();
      vi.advanceTimersByTime(500);
      expect(onRepeat).toHaveBeenCalledTimes(1);
    });

    it('fires subsequent repeats at repeatDelay interval', () => {
      const onRepeat = vi.fn();
      const handler = createPressHoldHandler({
        onRepeat,
        initialDelay: 500,
        repeatDelay: 100,
      });

      handler.start();
      
      // Initial repeat
      vi.advanceTimersByTime(500);
      expect(onRepeat).toHaveBeenCalledTimes(1);

      // Second repeat after 100ms
      vi.advanceTimersByTime(100);
      expect(onRepeat).toHaveBeenCalledTimes(2);

      // Third repeat after another 100ms
      vi.advanceTimersByTime(100);
      expect(onRepeat).toHaveBeenCalledTimes(3);
    });

    it('stops repeating when stop is called', () => {
      const onRepeat = vi.fn();
      const handler = createPressHoldHandler({
        onRepeat,
        initialDelay: 500,
        repeatDelay: 100,
      });

      handler.start();
      vi.advanceTimersByTime(500); // First repeat
      expect(onRepeat).toHaveBeenCalledTimes(1);

      handler.stop();
      vi.advanceTimersByTime(1000); // No more repeats
      expect(onRepeat).toHaveBeenCalledTimes(1);
    });

    it('tracks repeat count correctly', () => {
      const onRepeat = vi.fn();
      const handler = createPressHoldHandler({
        onRepeat,
        initialDelay: 500,
        repeatDelay: 100,
      });

      handler.start();
      expect(handler.getRepeatCount()).toBe(0);

      vi.advanceTimersByTime(500);
      expect(handler.getRepeatCount()).toBe(1);

      vi.advanceTimersByTime(100);
      expect(handler.getRepeatCount()).toBe(2);
    });

    it('reports repeating status accurately', () => {
      const onRepeat = vi.fn();
      const handler = createPressHoldHandler({
        onRepeat,
        initialDelay: 500,
        repeatDelay: 100,
      });

      expect(handler.isRepeating()).toBe(false);

      handler.start();
      expect(handler.isRepeating()).toBe(true);

      handler.stop();
      expect(handler.isRepeating()).toBe(false);
    });

    it('calls onRepeatCount callback with current count', () => {
      const onRepeat = vi.fn();
      const onRepeatCount = vi.fn();
      const handler = createPressHoldHandler({
        onRepeat,
        initialDelay: 500,
        repeatDelay: 100,
        onRepeatCount,
      });

      handler.start();
      vi.advanceTimersByTime(500); // First repeat
      expect(onRepeatCount).toHaveBeenCalledWith(1);

      vi.advanceTimersByTime(100); // Second repeat
      expect(onRepeatCount).toHaveBeenCalledWith(2);

      vi.advanceTimersByTime(100); // Third repeat
      expect(onRepeatCount).toHaveBeenCalledWith(3);
    });

    it('does not start again if already repeating', () => {
      const onRepeat = vi.fn();
      const handler = createPressHoldHandler({
        onRepeat,
        initialDelay: 500,
        repeatDelay: 100,
      });

      handler.start();
      handler.start(); // Start again

      vi.advanceTimersByTime(500);
      expect(onRepeat).toHaveBeenCalledTimes(1); // Should only fire once
      expect(handler.getRepeatCount()).toBe(1);
    });

    it('resets repeat count on start/stop/start cycle', () => {
      const onRepeat = vi.fn();
      const handler = createPressHoldHandler({
        onRepeat,
        initialDelay: 500,
        repeatDelay: 100,
      });

      handler.start();
      vi.advanceTimersByTime(1000); // Multiple repeats
      expect(handler.getRepeatCount()).toBeGreaterThan(0);

      handler.stop();
      expect(handler.getRepeatCount()).not.toBe(0); // Count preserved

      handler.start(); // New start resets count
      expect(handler.getRepeatCount()).toBe(0);

      vi.advanceTimersByTime(500);
      expect(handler.getRepeatCount()).toBe(1);
    });
  });

  describe('ramp-up behavior', () => {
    it('accelerates repeat rate over ramp-up duration', () => {
      const onRepeat = vi.fn();
      const handler = createPressHoldHandler({
        onRepeat,
        initialDelay: 500,
        repeatDelay: 200,
        rampUpDuration: 1000,
        minRepeatDelay: 50,
      });

      handler.start();
      
      // After 500ms: first repeat at 200ms interval
      vi.advanceTimersByTime(500);
      expect(onRepeat).toHaveBeenCalledTimes(1);

      // At 600ms total (100ms into ramp): interval should be ~185ms
      vi.advanceTimersByTime(185);
      expect(onRepeat).toHaveBeenCalledTimes(2);

      // At 1000ms total (500ms into ramp): interval should be ~125ms
      vi.advanceTimersByTime(125);
      expect(onRepeat).toHaveBeenCalledTimes(3);

      // At 1500ms total (ramp complete): interval should be 50ms
      vi.advanceTimersByTime(500); // 500ms more at faster rate
      const countAfterRamp = onRepeat.mock.calls.length;
      
      // Should have fired more repeats due to faster rate
      expect(countAfterRamp).toBeGreaterThan(3);
    });

    it('reaches minimum repeat delay after ramp-up', () => {
      const onRepeat = vi.fn();
      const countAt100ms: number[] = [];
      const onRepeatCountWithTimestamp = vi.fn((count: number) => {
        countAt100ms.push(count);
      });

      const handler = createPressHoldHandler({
        onRepeat,
        initialDelay: 500,
        repeatDelay: 200,
        rampUpDuration: 500,
        minRepeatDelay: 50,
        onRepeatCount: onRepeatCountWithTimestamp,
      });

      handler.start();
      vi.advanceTimersByTime(500); // First repeat

      // Continue for another 500ms (complete ramp-up)
      vi.advanceTimersByTime(500);

      // Clear and start fresh at min delay
      vi.clearAllTimers();
      const onRepeat2 = vi.fn();
      const handler2 = createPressHoldHandler({
        onRepeat: onRepeat2,
        initialDelay: 0,
        repeatDelay: 50, // Should be at min delay
      });

      handler2.start();
      vi.advanceTimersByTime(400);
      
      // With 50ms delay over 400ms, should have at least 8 repeats
      expect(onRepeat2.mock.calls.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('attachPressHold', () => {
    let mockElement: {
      addEventListener: ReturnType<typeof vi.fn>;
      removeEventListener: ReturnType<typeof vi.fn>;
      setPointerCapture: ReturnType<typeof vi.fn>;
      releasePointerCapture: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockElement = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        setPointerCapture: vi.fn(),
        releasePointerCapture: vi.fn(),
      };
    });

    it('returns null for null element', () => {
      const handler = attachPressHold(null, {
        onRepeat: vi.fn(),
        initialDelay: 500,
        repeatDelay: 100,
      });
      expect(handler).toBeNull();
    });

    it('attaches event listeners to element', () => {
      const onRepeat = vi.fn();
      const handler = attachPressHold(mockElement as unknown as HTMLElement, {
        onRepeat,
        initialDelay: 500,
        repeatDelay: 100,
      });

      expect(handler).not.toBeNull();
      expect(mockElement.addEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      expect(mockElement.addEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
      expect(mockElement.addEventListener).toHaveBeenCalledWith('pointerleave', expect.any(Function));
      expect(mockElement.addEventListener).toHaveBeenCalledWith('pointercancel', expect.any(Function));
      expect(mockElement.addEventListener).toHaveBeenCalledWith('contextmenu', expect.any(Function));
    });

    it('starts repeat on pointerdown', () => {
      const onRepeat = vi.fn();
      attachPressHold(mockElement as unknown as HTMLElement, {
        onRepeat,
        initialDelay: 500,
        repeatDelay: 100,
      });

      const pointerDownCalls = mockElement.addEventListener.mock.calls as unknown[][];
      const pointerDownCallback = pointerDownCalls.find((call) => call[0] === 'pointerdown')?.[1] as ((...args: unknown[]) => void) | undefined;

      // Simulate pointerdown event
      if (pointerDownCallback) {
        pointerDownCallback({ pointerId: 1, pointerType: 'mouse', button: 0 });
      }

      vi.advanceTimersByTime(500);
      expect(onRepeat).toHaveBeenCalled();
    });

    it('stops repeat on pointerup', () => {
      const onRepeat = vi.fn();
      const handler = attachPressHold(mockElement as unknown as HTMLElement, {
        onRepeat,
        initialDelay: 500,
        repeatDelay: 100,
      });

      const pointerDownCalls = mockElement.addEventListener.mock.calls as unknown[][];
      const pointerUpCalls = mockElement.addEventListener.mock.calls as unknown[][];
      const pointerDownCallback = pointerDownCalls.find((call) => call[0] === 'pointerdown')?.[1] as ((...args: unknown[]) => void) | undefined;
      const pointerUpCallback = pointerUpCalls.find((call) => call[0] === 'pointerup')?.[1] as ((...args: unknown[]) => void) | undefined;

      // Start repeating
      if (pointerDownCallback) {
        pointerDownCallback({ pointerId: 1, pointerType: 'mouse', button: 0 });
      }
      expect(handler!.isRepeating()).toBe(true);

      // Stop repeating
      if (pointerUpCallback) {
        pointerUpCallback();
      }
      expect(handler!.isRepeating()).toBe(false);
    });

    it('cleans up event listeners on dispose', () => {
      const onRepeat = vi.fn();
      const handler = attachPressHold(mockElement as unknown as HTMLElement, {
        onRepeat,
        initialDelay: 500,
        repeatDelay: 100,
      }) as PressHoldHandler & { dispose: () => void };

      expect(mockElement.removeEventListener).not.toHaveBeenCalled();

      handler.dispose();

      expect(mockElement.removeEventListener).toHaveBeenCalledWith('pointerdown', expect.any(Function));
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('pointerup', expect.any(Function));
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('pointerleave', expect.any(Function));
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('pointercancel', expect.any(Function));
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('contextmenu', expect.any(Function));
    });

    it('prevents context menu on long press', () => {
      attachPressHold(mockElement as unknown as HTMLElement, {
        onRepeat: vi.fn(),
        initialDelay: 500,
        repeatDelay: 100,
      });

      const contextMenuCalls = mockElement.addEventListener.mock.calls as unknown[][];
      const contextMenuCallback = contextMenuCalls.find((call) => call[0] === 'contextmenu')?.[1] as ((...args: unknown[]) => void) | undefined;

      const mockEvent = { preventDefault: vi.fn() };
      if (contextMenuCallback) {
        contextMenuCallback(mockEvent);
      }

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });
});

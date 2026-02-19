import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AudioManager,
  DEFAULT_AUDIO_SETTINGS,
  initAudioOnInteraction,
  isTestMode,
  type SoundType,
} from '../AudioManager';

// Mock window.AudioContext
class MockAudioContext {
  state: AudioContextState = 'running';
  destination: Record<string, unknown> = {};
  sampleRate = 48000;
  suspended = false;

  createGain() {
    return {
      connect: vi.fn(),
      gain: { value: 0 },
    };
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        value: 440,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createBuffer() {
    return {
      duration: 0.1,
      getChannelData: () => new Float32Array(100),
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 1000 },
      Q: { value: 1 },
      connect: vi.fn(),
    };
  }

  suspend() {
    this.suspended = true;
    this.state = 'suspended';
  }

  async resume() {
    this.suspended = false;
    this.state = 'running';
  }
}

// Save original AudioContext
let originalAudioContext: typeof AudioContext | undefined;

extendWindow();

function extendWindow() {
  if (!(window as { AudioContext?: typeof AudioContext }).AudioContext) {
    (window as { AudioContext?: typeof AudioContext, webkitAudioContext?: typeof AudioContext }).AudioContext = MockAudioContext;
    (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext = MockAudioContext;
  }
}

describe('AudioManager', () => {
  beforeEach(() => {
    // Reset AudioManager state
    AudioManager.setTestMode(false);

    // Mock window.AudioContext
    const win = window as { AudioContext: typeof AudioContext, webkitAudioContext: typeof AudioContext };
    originalAudioContext = win.AudioContext;
    win.AudioContext = MockAudioContext;
    win.webkitAudioContext = MockAudioContext;
  });

  afterEach(() => {
    // Restore original AudioContext
    const win = window as { AudioContext: typeof AudioContext, webkitAudioContext: typeof AudioContext };
    win.AudioContext = originalAudioContext || MockAudioContext;
    win.webkitAudioContext = originalAudioContext || MockAudioContext;
  });

  describe('test mode', () => {
    it('should start with test mode disabled', () => {
      // Play a sound - should fail gracefully but not throw
      expect(() => AudioManager.playSound('shot')).not.toThrow();
    });

    it('should disable audio when test mode is enabled', () => {
      AudioManager.setTestMode(true);
      expect(AudioManager.isEnabled()).toBe(false);
    });

    it('should not initialize in test mode', async () => {
      AudioManager.setTestMode(true);
      await AudioManager.initialize();
      expect(AudioManager.isEnabled()).toBe(false);
    });

    it('should no-op all sounds in test mode', () => {
      AudioManager.setTestMode(true);
      const soundTypes: SoundType[] = ['shot', 'hit', 'bullseye', 'click', 'error'];
      
      soundTypes.forEach((type) => {
        expect(() => AudioManager.playSound(type)).not.toThrow();
      });
    });
  });

  describe('default settings', () => {
    it('should have correct default settings', () => {
      expect(DEFAULT_AUDIO_SETTINGS).toEqual({
        masterVolume: 0.5,
        isMuted: false,
        reducedAudio: false,
      });
    });

    it('should start with default settings', () => {
      const settings = AudioManager.getSettings();
      expect(settings).toEqual(DEFAULT_AUDIO_SETTINGS);
    });
  });

  describe('settings management', () => {
    it('should update master volume', () => {
      AudioManager.updateSettings({ masterVolume: 0.8 });
      const settings = AudioManager.getSettings();
      expect(settings.masterVolume).toBe(0.8);
    });

    it('should update mute state', () => {
      AudioManager.updateSettings({ isMuted: true });
      const settings = AudioManager.getSettings();
      expect(settings.isMuted).toBe(true);
    });

    it('should update reduced audio state', () => {
      AudioManager.updateSettings({ reducedAudio: true });
      const settings = AudioManager.getSettings();
      expect(settings.reducedAudio).toBe(true);
    });

    it('should merge settings updates', () => {
      // Reset to defaults first
      AudioManager.updateSettings({ ...DEFAULT_AUDIO_SETTINGS });
      
      // Now test merging
      AudioManager.updateSettings({ masterVolume: 0.7, isMuted: true });
      const settings = AudioManager.getSettings();
      expect(settings.masterVolume).toBe(0.7);
      expect(settings.isMuted).toBe(true);
      expect(settings.reducedAudio).toBe(false); // unchanged
    });

    it('should return a copy of settings', () => {
      const settings1 = AudioManager.getSettings();
      const settings2 = AudioManager.getSettings();
      expect(settings1).not.toBe(settings2);
      expect(settings1).toEqual(settings2);
    });
  });

  describe('sound playback', () => {
    it('should play shot sound', () => {
      expect(() => AudioManager.playSound('shot')).not.toThrow();
    });

    it('should play hit sound', () => {
      expect(() => AudioManager.playSound('hit')).not.toThrow();
    });

    it('should play bullseye sound', () => {
      expect(() => AudioManager.playSound('bullseye')).not.toThrow();
    });

    it('should play click sound', () => {
      expect(() => AudioManager.playSound('click')).not.toThrow();
    });

    it('should play error sound', () => {
      expect(() => AudioManager.playSound('error')).not.toThrow();
    });
  });

  describe('initialization', () => {
    it('should initialize AudioContext', async () => {
      await AudioManager.initialize();
      expect(AudioManager.isEnabled()).toBe(true);
    });

    it('should not re-initialize if already initialized', async () => {
      await AudioManager.initialize();
      await AudioManager.initialize(); // Second call should be no-op
      expect(AudioManager.isEnabled()).toBe(true);
    });
  });

  describe('isTestMode', () => {
    it('should return true when testMode is in URL', () => {
      // Mock URL with testMode
      Object.defineProperty(window, 'location', {
        value: {
          search: '?testMode=1',
        },
        writable: true,
      });

      expect(isTestMode()).toBe(true);
    });

    it('should return false when testMode is not in URL', () => {
      Object.defineProperty(window, 'location', {
        value: {
          search: '',
        },
        writable: true,
      });

      expect(isTestMode()).toBe(false);
    });
  });

  describe('initAudioOnInteraction', () => {
    it('should call AudioManager.initialize', async () => {
      const spy = vi.spyOn(AudioManager, 'initialize');
      await initAudioOnInteraction();
      expect(spy).toHaveBeenCalled();
    });
  });
});
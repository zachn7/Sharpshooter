/**
 * AudioManager - Web Audio API sound effects system
 * 
 * Provides synthesized sound effects for gameplay without requiring
 * external audio files. All sounds are generated using Web Audio API oscillators.
 * 
 * IMPORTANT: AudioContext is only created/resumed after a user gesture.
 * In testMode, audio is completely disabled and all SFX calls are no-ops.
 */

/**
 * Audio configuration settings
 */
export interface AudioSettings {
  /** Master volume (0.0 to 1.0) */
  masterVolume: number;
  /** Whether audio is muted */
  isMuted: boolean;
  /** Whether to use reduced audio (quieter sounds) */
  reducedAudio: boolean;
}

/**
 * Default audio settings
 */
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  masterVolume: 0.5,
  isMuted: false,
  reducedAudio: false,
};

/**
 * Sound effect types
 */
export type SoundType = 'shot' | 'hit' | 'bullseye' | 'click' | 'error';

/**
 * Sound event data
 */
export interface SoundEvent {
  type: SoundType;
  timestamp: number;
}

/**
 * Singleton AudioManager class
 * 
 * Manages Web Audio Context and synthesized sound effects.
 * All methods are safe to call when audio is disabled or not available.
 */
class AudioManagerClass {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private settings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
  private isTestMode: boolean = false;
  private isInitialized: boolean = false;

  /**
   * Set test mode - disables all audio
   */
  setTestMode(enabled: boolean): void {
    this.isTestMode = enabled;
    if (enabled && this.context) {
      // Suspend context in test mode
      this.context.suspend();
    }
  }

  /**
   * Update audio settings
   */
  updateSettings(settings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    if (this.masterGain) {
      // Apply volume settings
      const volume = this.settings.isMuted ? 0 : this.settings.masterVolume;
      const reducedMultiplier = this.settings.reducedAudio ? 0.3 : 1.0;
      this.masterGain.gain.value = volume * reducedMultiplier;
    }
  }

  /**
   * Get current audio settings
   */
  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Initialize audio context
   * Must be called after a user gesture (click, keypress, etc.)
   */
  async initialize(): Promise<void> {
    // Skip initialization in test mode
    if (this.isTestMode) {
      return;
    }

    // Don't initialize if already done
    if (this.isInitialized && this.context) {
      return;
    }

    try {
      // Create AudioContext
      const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('AudioContext not supported');
      }
      this.context = new AudioContextClass();
      
      // Create master gain node
      this.masterGain = this.context.createGain();
      
      // Connect master gain to output
      this.masterGain.connect(this.context.destination);
      
      // Apply initial volume settings
      const volume = this.settings.isMuted ? 0 : this.settings.masterVolume;
      const reducedMultiplier = this.settings.reducedAudio ? 0.3 : 1.0;
      this.masterGain.gain.value = volume * reducedMultiplier;
      
      // Resume context (required after user gesture)
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.warn('[AudioManager] Failed to initialize audio:', error);
      this.context = null;
      this.masterGain = null;
    }
  }

  /**
   * Check if audio is enabled
   */
  isEnabled(): boolean {
    return !this.isTestMode && this.isInitialized && this.context !== null;
  }

  /**
   * Play a sound effect
   * Safe to call even if audio is disabled
   */
  playSound(type: SoundType): void {
    // Early exit in test mode or if not initialized
    if (!this.isEnabled()) {
      return;
    }

    try {
      switch (type) {
        case 'shot':
          this.playShotSound();
          break;
        case 'hit':
          this.playHitSound();
          break;
        case 'bullseye':
          this.playBullseyeSound();
          break;
        case 'click':
          this.playClickSound();
          break;
        case 'error':
          this.playErrorSound();
          break;
        default:
          console.warn(`[AudioManager] Unknown sound type: ${type}`);
      }
    } catch (error) {
      console.warn('[AudioManager] Error playing sound:', error);
    }
  }

  /**
   * Synthesize shot sound (gunshot)
   */
  private playShotSound(): void {
    if (!this.context || !this.masterGain) return;

    const now = this.context.currentTime;
    const duration = 0.3;

    // Create noise burst for gunshot
    const bufferSize = this.context.sampleRate * duration;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.context.createBufferSource();
    noise.buffer = buffer;

    // Create filter for gunshot character
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1500;
    filter.Q.value = 1;

    // Create envelope
    const envelope = this.context.createGain();
    envelope.gain.setValueAtTime(0.8, now);
    envelope.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Connect and play
    noise.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + duration);

    // Add low rumble
    const oscillator = this.context.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(80, now);
    oscillator.frequency.exponentialRampToValueAtTime(30, now + 0.2);

    const oscGain = this.context.createGain();
    oscGain.gain.setValueAtTime(0.4, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    oscillator.connect(oscGain);
    oscGain.connect(this.masterGain);
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }

  /**
   * Synthesize hit sound (steel ping)
   */
  private playHitSound(): void {
    if (!this.context || !this.masterGain) return;

    const now = this.context.currentTime;
    const duration = 0.4;

    // Create metallic ping
    const oscillator = this.context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + duration);

    // Add harmonics for metallic quality
    const osc2 = this.context.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1600, now);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + duration);
    osc2.start(now);
    osc2.stop(now + duration);
  }

  /**
   * Synthesize bullseye sound (pleasant chime)
   */
  private playBullseyeSound(): void {
    if (!this.context || !this.masterGain) return;

    const now = this.context.currentTime;
    const duration = 0.6;
    const ctx = this.context; // Non-null after check
    const master = this.masterGain; // Non-null after check

    // Create major chord for triumph
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;

      const gain = ctx.createGain();
      const offset = i * 0.05;
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.3, now + offset + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      oscillator.connect(gain);
      gain.connect(master);

      oscillator.start(now + offset);
      oscillator.stop(now + duration);
    });
  }

  /**
   * Synthesize UI click sound (subtle)
   */
  private playClickSound(): void {
    if (!this.context || !this.masterGain) return;

    const now = this.context.currentTime;
    const duration = 0.05;

    const oscillator = this.context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, now);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(gain);
    gain.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  /**
   * Synthesize error sound
   */
  private playErrorSound(): void {
    if (!this.context || !this.masterGain) return;

    const now = this.context.currentTime;
    const duration = 0.2;

    const oscillator = this.context.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.linearRampToValueAtTime(150, now + duration);

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.connect(gain);
    gain.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }
}

/**
 * Singleton instance
 */
export const AudioManager = new AudioManagerClass();

/**
 * Initialize audio on first user interaction
 * Should be called from a button click or keydown handler
 */
export async function initAudioOnInteraction(): Promise<void> {
  await AudioManager.initialize();
}

/**
 * Check if we're in test mode
 */
export function isTestMode(): boolean {
  if (typeof window === 'undefined') return true;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('testMode');
}
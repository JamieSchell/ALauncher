/**
 * Sound Service
 * Handles sound effects and audio playback in the launcher
 */

class SoundService {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.5;

  /**
   * Initialize the sound service
   */
  async initialize(): Promise<void> {
    // Preload common sounds if needed
    // For now, sounds can be loaded on demand
  }

  /**
   * Play a sound effect
   * @param soundName - Name of the sound to play
   * @param url - URL to the sound file
   */
  async play(soundName: string, url?: string): Promise<void> {
    if (!this.enabled) return;

    try {
      let audio = this.sounds.get(soundName);

      if (!audio && url) {
        audio = new Audio(url);
        audio.volume = this.volume;
        this.sounds.set(soundName, audio);
      }

      if (audio) {
        // Reset to beginning if already playing
        audio.currentTime = 0;
        await audio.play();
      }
    } catch (error) {
      // Silently fail if audio playback is blocked or unavailable
      console.debug('Sound playback failed:', error);
    }
  }

  /**
   * Stop a playing sound
   * @param soundName - Name of the sound to stop
   */
  stop(soundName: string): void {
    const audio = this.sounds.get(soundName);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    this.sounds.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  /**
   * Set the master volume
   * @param volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((audio) => {
      audio.volume = this.volume;
    });
  }

  /**
   * Get the current master volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Enable or disable sound
   * @param enabled - Whether sound should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * Check if sound is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Preload a sound
   * @param soundName - Name to identify the sound
   * @param url - URL to the sound file
   */
  async preload(soundName: string, url: string): Promise<void> {
    if (this.sounds.has(soundName)) return;

    try {
      const audio = new Audio();
      audio.volume = this.volume;
      audio.src = url;
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve(undefined), { once: true });
        audio.addEventListener('error', reject, { once: true });
      });
      this.sounds.set(soundName, audio);
    } catch (error) {
      console.debug('Sound preloading failed:', error);
    }
  }

  /**
   * Unload a sound from memory
   * @param soundName - Name of the sound to unload
   */
  unload(soundName: string): void {
    const audio = this.sounds.get(soundName);
    if (audio) {
      audio.pause();
      audio.src = '';
      this.sounds.delete(soundName);
    }
  }

  /**
   * Unload all sounds
   */
  unloadAll(): void {
    this.stopAll();
    this.sounds.forEach((audio) => {
      audio.src = '';
    });
    this.sounds.clear();
  }
}

// Export singleton instance
export const soundService = new SoundService();

export default soundService;

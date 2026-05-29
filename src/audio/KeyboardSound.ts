/**
 * Low-latency typing audio using the Web Audio API.
 * Loads a single keyboard sound file and plays short random
 * snippets on each keypress so rapid typing sounds natural.
 */
export class KeyboardSound {
  private ctx: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  private loaded = false;

  constructor(private src: string) {}

  /** Decode the MP3 once; safe to call multiple times. */
  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const res = await fetch(this.src);
      const arrayBuffer = await res.arrayBuffer();
      this.ctx = new AudioContext();
      this.buffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.loaded = true;
    } catch (e) {
      console.warn('Keyboard sound failed to load:', e);
    }
  }

  /** Play a short random snippet (~60–120 ms). */
  play(): void {
    if (!this.ctx || !this.buffer) return;

    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;

    // Slight pitch variance per key for realism
    src.playbackRate.value = 0.92 + Math.random() * 0.16;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.35;

    src.connect(gain);
    gain.connect(this.ctx.destination);

    const dur = this.buffer.duration;
    const offset = Math.random() * Math.max(0, dur - 0.12);
    src.start(0, offset, 0.06 + Math.random() * 0.06);

    // Auto-cleanup
    src.onended = () => {
      src.disconnect();
      gain.disconnect();
    };
  }
}

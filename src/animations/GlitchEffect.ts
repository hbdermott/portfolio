/**
 * Temporary glitch visual effect for the terminal.
 * Heavy static burst, screen shake, chromatic spike.
 */
export class GlitchEffect {
  private intensity = 0;
  private decay = 0.92;

  trigger(): void {
    this.intensity = 1.0;
  }

  update(): void {
    this.intensity *= this.decay;
    if (this.intensity < 0.01) this.intensity = 0;
  }

  isActive(): boolean {
    return this.intensity > 0;
  }

  getIntensity(): number {
    return this.intensity;
  }
}

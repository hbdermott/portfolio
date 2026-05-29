export class CRTOverlay {
  private overlay: HTMLElement;
  private flickerInterval: number | null = null;

  constructor(overlayId: string) {
    const el = document.getElementById(overlayId);
    if (!el) throw new Error(`Element #${overlayId} not found`);
    this.overlay = el;
    this.startFlicker();
  }

  triggerGlitch(): void {
    this.overlay.classList.add('crt-flicker');
    setTimeout(() => {
      this.overlay.classList.remove('crt-flicker');
    }, 200);
  }

  private startFlicker(): void {
    this.flickerInterval = window.setInterval(() => {
      if (Math.random() > 0.9) {
        this.overlay.style.opacity = '0.97';
        setTimeout(() => {
          this.overlay.style.opacity = '1';
        }, 50);
      }
    }, 5000);
  }

  destroy(): void {
    if (this.flickerInterval !== null) {
      clearInterval(this.flickerInterval);
    }
  }
}

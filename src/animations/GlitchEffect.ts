export class GlitchEffect {
  private crtOverlay: HTMLElement;

  constructor(crtOverlayId: string) {
    const el = document.getElementById(crtOverlayId);
    if (!el) throw new Error(`Element #${crtOverlayId} not found`);
    this.crtOverlay = el;
  }

  trigger(): void {
    this.crtOverlay.style.filter = 'hue-rotate(90deg) saturate(200%)';
    this.crtOverlay.style.transform = 'translateX(2px)';

    let count = 0;
    const flicker = setInterval(() => {
      this.crtOverlay.style.opacity = count % 2 === 0 ? '0.8' : '1';
      this.crtOverlay.style.transform = `translateX(${Math.random() * 4 - 2}px)`;
      count++;
      if (count > 10) {
        clearInterval(flicker);
        this.crtOverlay.style.opacity = '1';
        this.crtOverlay.style.transform = 'none';
        this.crtOverlay.style.filter = 'none';
      }
    }, 50);
  }
}

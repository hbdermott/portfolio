import { SceneManager } from './SceneManager';

export class ASCIIRenderer {
  private sceneManager: SceneManager;
  private asciiChars = ' .\':~"-=+<>iezsr*?#MB';
  private element: HTMLElement;
  private frameCount: number;

  constructor(sceneManager: SceneManager, elementId: string) {
    this.sceneManager = sceneManager;
    const el = document.getElementById(elementId);
    if (!el) throw new Error(`Element #${elementId} not found`);
    this.element = el;
    this.frameCount = 0;
  }

  start(): void {
    this.sceneManager.start();
    this.loop();
  }

  private loop(): void {
    requestAnimationFrame(() => this.loop());
    this.frameCount++;
    if (this.frameCount % 3 === 0) {
      this.updateASCII();
    }
  }

  private updateASCII(): void {
    const renderer = this.sceneManager.getRenderer();
    const width = 120;
    const height = 80;

    const gl = renderer.getContext();
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    let ascii = '';
    for (let y = height - 1; y >= 0; y--) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const charIndex = Math.floor((luminance / 255) * (this.asciiChars.length - 1));
        ascii += this.asciiChars[charIndex];
      }
      ascii += '\n';
    }

    this.element.textContent = ascii;
  }
}

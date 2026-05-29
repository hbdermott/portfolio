import { CommandParser } from './terminal/CommandParser';
import { PortfolioCommands } from './commands/PortfolioCommands';
import { LinuxEmulator } from './commands/LinuxEmulator';
import { FileSystem } from './commands/FileSystem';
import { CanvasTerminal } from './terminal/CanvasTerminal';
import { GLTFScene } from './room/GLTFScene';
import { CRTShader } from './crt/CRTShader';
import { CRTOverlay } from './crt/CRTOverlay';

function main(): void {
  // Initialize command system
  const fileSystem = new FileSystem();
  const portfolioCommands = new PortfolioCommands();
  const linuxEmulator = new LinuxEmulator(fileSystem);

  const commandParser = new CommandParser(
    portfolioCommands.getCommands(),
    linuxEmulator.getCommands()
  );

  // Create canvas-based terminal (renders to a texture)
  const terminal = new CanvasTerminal(commandParser);

  // Create 3D scene with GLTF model
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error('Canvas container not found');
    return;
  }

  const gltfScene = new GLTFScene(container, terminal);
  gltfScene.start();

  // ─── CRT Effects ───
  // WebGL shader overlay (scanlines, barrel distortion, chromatic aberration, vignette, noise, flicker)
  const crtShader = new CRTShader('crt-shader-canvas');
  crtShader.start();

  // CSS overlay (scanlines, aperture grille, noise, flicker animations, phosphor glow)
  const crtOverlay = new CRTOverlay('crt-overlay');

  // Wire glitch command to trigger both shader and CSS effects
  const originalGlitch = portfolioCommands.getCommands().get('glitch');
  if (originalGlitch) {
    portfolioCommands.getCommands().set('glitch', (args) => {
      crtShader.setGlitchIntensity(1.0);
      crtOverlay.triggerGlitch();
      // Reset glitch after 500ms
      setTimeout(() => crtShader.setGlitchIntensity(0.0), 500);
      return originalGlitch(args);
    });
  }

  console.log('CRT Terminal Portfolio with GLTF Model + CRT effects initialized');
}

window.addEventListener('DOMContentLoaded', () => {
  main();
});

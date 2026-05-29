import { Terminal } from './terminal/Terminal';
import { CommandParser } from './terminal/CommandParser';
import { PortfolioCommands } from './commands/PortfolioCommands';
import { LinuxEmulator } from './commands/LinuxEmulator';
import { FileSystem } from './commands/FileSystem';
import { CRTShader } from './crt/CRTShader';
import { CRTOverlay } from './crt/CRTOverlay';
import { SceneManager } from './three/SceneManager';
import { ASCIIRenderer } from './three/ASCIIRenderer';
import { MatrixRain } from './animations/MatrixRain';
import { GlitchEffect } from './animations/GlitchEffect';

function main(): void {
  const fileSystem = new FileSystem();
  const portfolioCommands = new PortfolioCommands();
  const linuxEmulator = new LinuxEmulator(fileSystem);

  const commandParser = new CommandParser(
    portfolioCommands.getCommands(),
    linuxEmulator.getCommands()
  );

  const crtShader = new CRTShader('crt-shader-canvas');
  const crtOverlay = new CRTOverlay('crt-overlay');
  crtShader.start();

  const asciiCanvas = document.createElement('canvas');
  asciiCanvas.width = 120;
  asciiCanvas.height = 80;
  const sceneManager = new SceneManager(asciiCanvas);
  const asciiRenderer = new ASCIIRenderer(sceneManager, 'ascii-background');
  asciiRenderer.start();

  const matrixRain = new MatrixRain('screen-glass');
  const glitchEffect = new GlitchEffect('crt-overlay');

  const terminal = new Terminal('terminal', commandParser);

  const originalMatrix = portfolioCommands.getCommands().get('matrix')!;
  portfolioCommands.getCommands().set('matrix', (args) => {
    matrixRain.start();
    return originalMatrix(args);
  });

  const originalGlitch = portfolioCommands.getCommands().get('glitch')!;
  portfolioCommands.getCommands().set('glitch', (args) => {
    glitchEffect.trigger();
    crtShader.setGlitchIntensity(1.0);
    crtOverlay.triggerGlitch();
    return originalGlitch(args);
  });

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('#terminal')) {
      terminal.focus();
    }
  });

  console.log('CRT Terminal Portfolio initialized');
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    main();
  }, 500);
});

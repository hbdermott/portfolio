import { CommandParser } from './terminal/CommandParser';
import { PortfolioCommands } from './commands/PortfolioCommands';
import { LinuxEmulator } from './commands/LinuxEmulator';
import { FileSystem } from './commands/FileSystem';
import { CanvasTerminal } from './terminal/CanvasTerminal';
import { GLTFScene } from './room/GLTFScene';

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

  console.log('CRT Terminal Portfolio with GLTF Model initialized');
}

window.addEventListener('DOMContentLoaded', () => {
  main();
});

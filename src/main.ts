import { CommandParser } from './terminal/CommandParser';
import { PortfolioCommands } from './commands/PortfolioCommands';
import { LinuxEmulator } from './commands/LinuxEmulator';
import { FileSystem } from './commands/FileSystem';
import { CanvasTerminal } from './terminal/CanvasTerminal';
import { RoomScene } from './room/RoomScene';
import { MatrixRain3D } from './animations/MatrixRain3D';

function main(): void {
  // Initialize command system
  const fileSystem = new FileSystem();
  const portfolioCommands = new PortfolioCommands();
  const linuxEmulator = new LinuxEmulator(fileSystem);

  const commandParser = new CommandParser(
    portfolioCommands.getCommands(),
    linuxEmulator.getCommands()
  );

  // Create canvas-based terminal
  const terminal = new CanvasTerminal(commandParser);

  // Create 3D room scene
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error('Canvas container not found');
    return;
  }

  const roomScene = new RoomScene(container, terminal);
  roomScene.start();

  // Hook up 3D effects to commands
  const scene = roomScene.getScene();
  const matrixRain = new MatrixRain3D(scene);

  const originalMatrix = portfolioCommands.getCommands().get('matrix')!;
  portfolioCommands.getCommands().set('matrix', (args) => {
    matrixRain.start();
    return originalMatrix(args);
  });

  console.log('3D CRT Terminal Portfolio initialized');
}

window.addEventListener('DOMContentLoaded', () => {
  main();
});

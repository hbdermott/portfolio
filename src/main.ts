import { CommandParser } from './terminal/CommandParser';
import { PortfolioCommands } from './commands/PortfolioCommands';
import { LinuxEmulator } from './commands/LinuxEmulator';
import { FileSystem } from './commands/FileSystem';
import { CanvasTerminal } from './terminal/CanvasTerminal';
import { GLTFScene } from './room/GLTFScene';
import { CommandMenu, type CommandGroup } from './ui/CommandMenu';
import { playBootSound } from './audio/BootSound';

function main(): void {
  // Play boot sound on load
  playBootSound('/OldPCBoot.mp3');

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
  portfolioCommands.bindTerminal(terminal);

  // Create 3D scene with GLTF model
  const container = document.getElementById('canvas-container');
  if (!container) {
    console.error('Canvas container not found');
    return;
  }

  const gltfScene = new GLTFScene(container, terminal);
  gltfScene.start();

  // Command menu overlay — grouped by category with color coding
  const commandGroups: CommandGroup[] = [
    {
      name: 'Portfolio',
      color: '#33ff33',
      commands: ['about', 'experience', 'skills', 'help'],
    },
    {
      name: 'Explore',
      color: '#33aaff',
      commands: [
        { name: 'projects', flags: ['--detail CRTTerminalPortfolio', '--detail Tale.ink'] },
        { name: 'contact', flags: ['--mail', '--github', '--linkedin', '--copy-email'] },
      ],
    },
    {
      name: 'Effects & Games',
      color: '#ffaa00',
      commands: ['matrix', 'glitch', 'snake', 'pong'],
    },
    {
      name: 'Linux',
      color: '#8888ff',
      commands: ['ls', 'cd', 'pwd', 'cat', 'mkdir', 'touch', 'rm', 'echo', 'whoami', 'date', 'uname', 'clear', 'exit'],
    },
  ];
  new CommandMenu(commandGroups, (cmd) => terminal.injectCommand(cmd));

  console.log('CRT Terminal Portfolio initialized');
}

window.addEventListener('DOMContentLoaded', () => {
  main();
});

import type { CommandHandler, CommandResult } from '../types';
import { aboutContent, projects, experience, skills, contactInfo } from '../data/portfolio';
import type { CanvasTerminal } from '../terminal/CanvasTerminal';

export class PortfolioCommands {
  private commands: Map<string, CommandHandler>;
  private terminal: CanvasTerminal | null = null;

  constructor() {
    this.commands = new Map();
    this.registerCommands();
  }

  bindTerminal(terminal: CanvasTerminal): void {
    this.terminal = terminal;
  }

  getCommands(): Map<string, CommandHandler> {
    return this.commands;
  }

  private registerCommands(): void {
    this.commands.set('help', () => {
      return {
        lines: [
           'Portfolio Commands:',
           '  about       - About me',
           '  projects    - View my projects',
           '  experience  - Work experience',
           '  skills      - Technical skills',
           '  contact     - Contact information',
           '  help        - Show this help message',
           '  clear       - Clear terminal',
           '  matrix      - Matrix rain effect',
           '  glitch      - Glitch effect',
           '  snake       - Play Snake',
           '  pong        - Play Pong',
           '',
            'Linux Commands:',
            '  ls, cd, pwd, cat, mkdir, touch, rm',
            '  echo, whoami, date, uname, exit, mail',
           '',
           'Tip: Use projects --detail <name> for more info',
        ]
      };
    });

    this.commands.set('about', () => {
      return {
        lines: [
          '',
          '╔══════════════════════════════════════════════════════╗',
          '║                     ABOUT ME                        ║',
          '╚══════════════════════════════════════════════════════╝',
          '',
          ...aboutContent,
          '',
        ],
        type: 'cyan',
      } as CommandResult;
    });

    this.commands.set('projects', (args) => {
      if (args.includes('--detail') || args.includes('-d')) {
        const detailIdx = args.findIndex(a => a === '--detail' || a === '-d');
        const projectName = args[detailIdx + 1];
        if (!projectName) {
          return { lines: ['Usage: projects --detail <project-name>'], error: true };
        }
        const project = projects.find(p => p.name.toLowerCase().replace(/\s+/g, '') === projectName.toLowerCase());
        if (!project) {
          return { lines: [`Project '${projectName}' not found. Available: ${projects.map(p => p.name).join(', ')}`], error: true };
        }
        return {
          lines: [
            '',
            `┌─ Project: ${project.name}`,
            `│ Technologies: ${project.technologies.join(', ')}`,
            '│',
            `│ ${project.detail}`,
            '└─────────────────────────────────────────────────────',
            '',
          ],
          type: 'orange',
        } as CommandResult;
      }

      const lines: string[] = [
        '',
        '╔══════════════════════════════════════════════════════╗',
        '║                     PROJECTS                        ║',
        '╚══════════════════════════════════════════════════════╝',
        '',
      ];
      for (const project of projects) {
        lines.push(`  ${project.name}`);
        lines.push(`    ${project.description}`);
        lines.push(`    Tech: ${project.technologies.join(', ')}`);
        lines.push('');
      }
      lines.push('  Use projects --detail <name> for more info');
      lines.push('');
      return { lines, type: 'orange' } as CommandResult;
    });

    this.commands.set('experience', () => {
      const lines: string[] = [
        '',
        '╔══════════════════════════════════════════════════════╗',
        '║                  WORK EXPERIENCE                     ║',
        '╚══════════════════════════════════════════════════════╝',
        '',
      ];
      for (const entry of experience) {
        lines.push(`  ${entry.company}`);
        lines.push(`    ${entry.role}  |  ${entry.dates}`);
        for (const bullet of entry.bullets) {
          lines.push(`    • ${bullet}`);
        }
        lines.push('');
      }
      return { lines, type: 'yellow' } as CommandResult;
    });

    this.commands.set('skills', () => {
      const lines: string[] = [
        '',
        '╔══════════════════════════════════════════════════════╗',
        '║                    TECHNICAL SKILLS                  ║',
        '╚══════════════════════════════════════════════════════╝',
        '',
      ];
      for (const [category, items] of Object.entries(skills)) {
        lines.push(`  [ ${category} ]`);
        lines.push(`    ${items.join('  ·  ')}`);
        lines.push('');
      }
      return { lines, type: 'magenta' } as CommandResult;
    });

    this.commands.set('contact', (args) => {
      // --mail → trigger mailto: (behaves like clicking a mailto link)
      if (args.includes('--mail')) {
        window.location.href = `mailto:${contactInfo.email}`;
        return { lines: [`Opening mailto:${contactInfo.email}...`] };
      }

      // --github → open GitHub profile in new tab
      if (args.includes('--github')) {
        window.open(`${contactInfo.github}`, '_blank');
        return { lines: [`Opening ${contactInfo.github}...`] };
      }

      // --linkedin → open LinkedIn profile in new tab
      if (args.includes('--linkedin')) {
        window.open(`${contactInfo.linkedin}`, '_blank');
        return { lines: [`Opening ${contactInfo.linkedin}...`] };
      }

      if (args.includes('--copy-email') || args.includes('-c')) {
        navigator.clipboard.writeText(contactInfo.email).then(() => {
          // Async - handled by return message
        });
        return { lines: [`Email ${contactInfo.email} copied to clipboard!`] };
      }

      return {
        lines: [
          '',
          '╔══════════════════════════════════════════════════════╗',
          '║                   CONTACT INFO                       ║',
          '╚══════════════════════════════════════════════════════╝',
          '',
          `  Email:    ${contactInfo.email}`,
          `  GitHub:   ${contactInfo.github}`,
          `  LinkedIn: ${contactInfo.linkedin}`,
          '',
          'Flags:',
          '  --mail        Open mailto link',
          '  --github      Open GitHub profile',
          '  --linkedin    Open LinkedIn profile',
          '  --copy-email  Copy email to clipboard',
          '',
        ],
        type: 'white',
      } as CommandResult;
    });

    this.commands.set('clear', () => {
      return { lines: [], clear: true };
    });

    this.commands.set('matrix', () => {
      this.terminal?.startMatrixRain();
      return { lines: ['Initiating matrix sequence...'] };
    });

    this.commands.set('glitch', () => {
      this.terminal?.triggerGlitch();
      return { lines: ['System glitch detected...'] };
    });

    this.commands.set('snake', () => {
      this.terminal?.startSnake();
      return { lines: ['Launching SNAKE... Use arrow keys or WASD. Ctrl+C to quit.'] };
    });

    this.commands.set('pong', () => {
      this.terminal?.startPong();
      return { lines: ['Launching PONG... Move mouse to play. Ctrl+C to quit.'] };
    });
  }
}

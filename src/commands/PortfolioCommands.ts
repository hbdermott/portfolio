import type { CommandHandler } from '../types';
import { aboutContent, projects, experience, skills, contactInfo } from '../data/portfolio';

export class PortfolioCommands {
  private commands: Map<string, CommandHandler>;

  constructor() {
    this.commands = new Map();
    this.registerCommands();
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
          '',
          'Linux Commands:',
          '  ls, cd, pwd, cat, mkdir, touch, rm',
          '  echo, whoami, date, uname',
          '',
          'Tip: Use projects --detail <name> for more info',
        ]
      };
    });

    this.commands.set('about', () => {
      return { lines: aboutContent };
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
            `Project: ${project.name}`,
            `Technologies: ${project.technologies.join(', ')}`,
            '',
            project.detail,
          ]
        };
      }

      const lines = ['Projects:'];
      for (const project of projects) {
        lines.push(`  ${project.name} - ${project.description}`);
        lines.push(`    Tech: ${project.technologies.join(', ')}`);
        lines.push('');
      }
      lines.push('Use projects --detail <name> for more information');
      return { lines };
    });

    this.commands.set('experience', () => {
      const lines: string[] = ['Work Experience:'];
      for (const entry of experience) {
        lines.push(`  ${entry.company} - ${entry.role}`);
        lines.push(`  ${entry.dates}`);
        for (const bullet of entry.bullets) {
          lines.push(`    - ${bullet}`);
        }
        lines.push('');
      }
      return { lines };
    });

    this.commands.set('skills', () => {
      const lines: string[] = ['Skills:'];
      for (const [category, items] of Object.entries(skills)) {
        lines.push(`  ${category}:`);
        lines.push(`    ${items.join(', ')}`);
        lines.push('');
      }
      return { lines };
    });

    this.commands.set('contact', (args) => {
      if (args.includes('--copy-email') || args.includes('-c')) {
        navigator.clipboard.writeText(contactInfo.email).then(() => {
          // Async - handled by return message
        });
        return { lines: [`Email ${contactInfo.email} copied to clipboard!`] };
      }

      return {
        lines: [
          'Contact Information:',
          `  Email: ${contactInfo.email}`,
          `  GitHub: ${contactInfo.github}`,
          `  LinkedIn: ${contactInfo.linkedin}`,
          '',
          'Use contact --copy-email to copy email to clipboard',
        ]
      };
    });

    this.commands.set('clear', () => {
      return { lines: [] };
    });

    this.commands.set('matrix', () => {
      return { lines: ['Initiating matrix sequence...'] };
    });

    this.commands.set('glitch', () => {
      return { lines: ['System glitch detected...'] };
    });
  }
}

import type { CommandHandler } from '../types';
import { FileSystem } from './FileSystem';

export class LinuxEmulator {
  private fs: FileSystem;
  private commands: Map<string, CommandHandler>;

  constructor(fs: FileSystem) {
    this.fs = fs;
    this.commands = new Map();
    this.registerCommands();
  }

  getCommands(): Map<string, CommandHandler> {
    return this.commands;
  }

  private registerCommands(): void {
    this.commands.set('ls', (args) => {
      const path = args.find(a => !a.startsWith('-')) || '.';
      const result = this.fs.listDirectory(path);
      if (result.error) {
        return { lines: [result.error], error: true };
      }
      return { lines: result.lines };
    });

    this.commands.set('cd', (args) => {
      const path = args[0] || '~';
      const resolvedPath = path === '~' ? '/home/user' : path;
      const error = this.fs.changeDirectory(resolvedPath);
      if (error) {
        return { lines: [error], error: true };
      }
      return { lines: [] };
    });

    this.commands.set('pwd', () => {
      return { lines: [this.fs.getCurrentPath()] };
    });

    this.commands.set('cat', (args) => {
      if (args.length === 0) {
        return { lines: ['cat: missing file operand'], error: true };
      }
      const lines: string[] = [];
      for (const file of args) {
        const result = this.fs.readFile(file);
        if (result.error) {
          lines.push(result.error);
        } else {
          lines.push(...result.content.split('\n'));
        }
      }
      return { lines };
    });

    this.commands.set('mkdir', (args) => {
      if (args.length === 0) {
        return { lines: ['mkdir: missing operand'], error: true };
      }
      const errors: string[] = [];
      for (const dir of args) {
        const error = this.fs.makeDirectory(dir);
        if (error) errors.push(error);
      }
      return { lines: errors, error: errors.length > 0 };
    });

    this.commands.set('touch', (args) => {
      if (args.length === 0) {
        return { lines: ['touch: missing file operand'], error: true };
      }
      const errors: string[] = [];
      for (const file of args) {
        const error = this.fs.createFile(file);
        if (error) errors.push(error);
      }
      return { lines: errors, error: errors.length > 0 };
    });

    this.commands.set('rm', (args) => {
      const recursive = args.includes('-r') || args.includes('-rf');
      const paths = args.filter(a => !a.startsWith('-'));
      if (paths.length === 0) {
        return { lines: ['rm: missing operand'], error: true };
      }
      const errors: string[] = [];
      for (const path of paths) {
        const error = this.fs.remove(path, recursive);
        if (error) errors.push(error);
      }
      return { lines: errors, error: errors.length > 0 };
    });

    this.commands.set('echo', (args) => {
      return { lines: [args.join(' ')] };
    });

    this.commands.set('whoami', () => {
      return { lines: ['user'] };
    });

    this.commands.set('date', () => {
      return { lines: [new Date().toString()] };
    });

    this.commands.set('uname', () => {
      return { lines: ['Linux'] };
    });

    this.commands.set('exit', () => {
      return {
        lines: [
          '',
          '   _____                 _ _               _   ',
          '  / ____|               | | |             | |  ',
          ' | |  __  ___   ___   __| | |__  _   _  __| |  ',
          ' | | |_ |/ _ \ / _ \ / _` | \'_ \| | | |/ _` |  ',
          ' | |__| | (_) | (_) | (_| | |_) | |_| | (_| |  ',
          '  \_____|\___/ \___/ \__,_|_.__/ \__, |\__,_|  ',
          '                                  __/ |       ',
          '                                 |___/        ',
          '',
          'Shutting down system...',
        ],
      };
    });
  }
}

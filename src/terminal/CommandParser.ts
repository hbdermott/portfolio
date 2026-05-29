import type { CommandHandler, CommandResult } from '../types';

export class CommandParser {
  private portfolioCommands: Map<string, CommandHandler>;
  private linuxCommands: Map<string, CommandHandler>;

  constructor(
    portfolioCommands: Map<string, CommandHandler>,
    linuxCommands: Map<string, CommandHandler>
  ) {
    this.portfolioCommands = portfolioCommands;
    this.linuxCommands = linuxCommands;
  }

  parse(input: string): CommandResult {
    const trimmed = input.trim();
    if (!trimmed) {
      return { lines: [] };
    }

    const tokens = trimmed.split(/\s+/);
    const command = tokens[0].toLowerCase();
    const args = tokens.slice(1);

    if (this.portfolioCommands.has(command)) {
      const handler = this.portfolioCommands.get(command)!;
      return handler(args);
    }

    if (this.linuxCommands.has(command)) {
      const handler = this.linuxCommands.get(command)!;
      return handler(args);
    }

    return {
      lines: [`command not found: ${command}. Type 'help' for available commands.`],
      error: true
    };
  }
}

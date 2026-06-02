export interface CommandResult {
  lines: string[];
  error?: boolean;
  clear?: boolean;
  type?: 'output' | 'error' | 'dim' | 'prompt' | 'cyan' | 'yellow' | 'magenta' | 'orange' | 'white' | 'blue';
}

export type CommandHandler = (args: string[]) => CommandResult;

export interface FileSystemNode {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileSystemNode[];
}

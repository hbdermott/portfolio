export interface CommandResult {
  lines: string[];
  error?: boolean;
  clear?: boolean;
}

export type CommandHandler = (args: string[]) => CommandResult;

export interface FileSystemNode {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileSystemNode[];
}

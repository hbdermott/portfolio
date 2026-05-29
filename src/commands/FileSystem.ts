import type { FileSystemNode } from '../types';

export class FileSystem {
  private root: FileSystemNode;
  private currentPath: string;

  constructor() {
    this.root = {
      name: '/',
      type: 'directory',
      children: [
        {
          name: 'home',
          type: 'directory',
          children: [
            {
              name: 'user',
              type: 'directory',
              children: [
                { name: 'welcome.txt', type: 'file', content: "Welcome to Hunter Dermott's terminal portfolio!\nType 'help' to get started." },
                { name: 'projects', type: 'directory', children: [] },
                { name: 'documents', type: 'directory', children: [
                  { name: 'resume.txt', type: 'file', content: "Hunter Dermott's Resume\n\nSoftware Engineer" }
                ]}
              ]
            }
          ]
        },
        {
          name: 'etc',
          type: 'directory',
          children: [
            { name: 'hostname', type: 'file', content: 'portfolio' }
          ]
        }
      ]
    };
    this.currentPath = '/home/user';
  }

  getCurrentPath(): string {
    return this.currentPath;
  }

  resolvePath(path: string): string {
    if (path.startsWith('/')) {
      return this.normalizePath(path);
    }
    return this.normalizePath(`${this.currentPath}/${path}`);
  }

  changeDirectory(path: string): string | null {
    const resolved = this.resolvePath(path);
    const node = this.getNode(resolved);
    if (!node) {
      return `cd: no such file or directory: ${path}`;
    }
    if (node.type !== 'directory') {
      return `cd: not a directory: ${path}`;
    }
    this.currentPath = resolved;
    return null;
  }

  listDirectory(path = '.'): { lines: string[]; error?: string } {
    const resolved = path === '.' ? this.currentPath : this.resolvePath(path);
    const node = this.getNode(resolved);
    if (!node) {
      return { lines: [], error: `ls: cannot access '${path}': No such file or directory` };
    }
    if (node.type !== 'directory') {
      return { lines: [node.name], error: undefined };
    }
    const lines = (node.children || []).map(child => {
      if (child.type === 'directory') {
        return `${child.name}/`;
      }
      return child.name;
    });
    return { lines, error: undefined };
  }

  readFile(path: string): { content: string; error?: string } {
    const resolved = this.resolvePath(path);
    const node = this.getNode(resolved);
    if (!node) {
      return { content: '', error: `cat: ${path}: No such file or directory` };
    }
    if (node.type !== 'file') {
      return { content: '', error: `cat: ${path}: Is a directory` };
    }
    return { content: node.content || '', error: undefined };
  }

  makeDirectory(path: string): string | null {
    const resolved = this.resolvePath(path);
    const parentPath = resolved.substring(0, resolved.lastIndexOf('/')) || '/';
    const name = resolved.substring(resolved.lastIndexOf('/') + 1);
    const parent = this.getNode(parentPath);
    if (!parent || parent.type !== 'directory') {
      return `mkdir: cannot create directory '${path}': No such file or directory`;
    }
    if (!parent.children) parent.children = [];
    if (parent.children.find(c => c.name === name)) {
      return `mkdir: cannot create directory '${path}': File exists`;
    }
    parent.children.push({ name, type: 'directory', children: [] });
    return null;
  }

  createFile(path: string): string | null {
    const resolved = this.resolvePath(path);
    const parentPath = resolved.substring(0, resolved.lastIndexOf('/')) || '/';
    const name = resolved.substring(resolved.lastIndexOf('/') + 1);
    const parent = this.getNode(parentPath);
    if (!parent || parent.type !== 'directory') {
      return `touch: cannot touch '${path}': No such file or directory`;
    }
    if (!parent.children) parent.children = [];
    if (!parent.children.find(c => c.name === name)) {
      parent.children.push({ name, type: 'file', content: '' });
    }
    return null;
  }

  remove(path: string, recursive = false): string | null {
    const resolved = this.resolvePath(path);
    if (resolved === '/' || resolved === '/home' || resolved === '/home/user') {
      return `rm: cannot remove '${path}': Permission denied`;
    }
    const parentPath = resolved.substring(0, resolved.lastIndexOf('/')) || '/';
    const name = resolved.substring(resolved.lastIndexOf('/') + 1);
    const parent = this.getNode(parentPath);
    if (!parent || parent.type !== 'directory' || !parent.children) {
      return `rm: cannot remove '${path}': No such file or directory`;
    }
    const idx = parent.children.findIndex(c => c.name === name);
    if (idx === -1) {
      return `rm: cannot remove '${path}': No such file or directory`;
    }
    const node = parent.children[idx];
    if (node.type === 'directory' && (node.children?.length || 0) > 0 && !recursive) {
      return `rm: cannot remove '${path}': Is a directory`;
    }
    parent.children.splice(idx, 1);
    return null;
  }

  private normalizePath(path: string): string {
    const parts = path.split('/').filter(p => p);
    const stack: string[] = [];
    for (const part of parts) {
      if (part === '..') {
        stack.pop();
      } else if (part !== '.' && part !== '') {
        stack.push(part);
      }
    }
    return '/' + stack.join('/');
  }

  private getNode(path: string): FileSystemNode | null {
    if (path === '/') return this.root;
    const parts = path.split('/').filter(p => p);
    let current: FileSystemNode = this.root;
    for (const part of parts) {
      if (current.type !== 'directory' || !current.children) {
        return null;
      }
      const found = current.children.find(c => c.name === part);
      if (!found) return null;
      current = found;
    }
    return current;
  }
}

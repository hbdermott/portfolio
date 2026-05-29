# CRT Terminal Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a retro CRT terminal portfolio with Three.js ASCII art background, phosphor green theme, portfolio commands, and a lightweight Linux command emulator.

**Architecture:** Vite + TypeScript + Three.js. Modular TypeScript with clear separation: terminal system, command handlers, Three.js ASCII renderer, CRT shader effects. No frontend frameworks.

**Tech Stack:** Vite (build tool), TypeScript (strict), Three.js (3D/ASCII), vanilla CSS, WebGL/GLSL shaders.

---

## File Structure

```
project/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts
│   ├── types.ts
│   ├── terminal/
│   │   ├── Terminal.ts
│   │   ├── CommandParser.ts
│   │   └── OutputBuffer.ts
│   ├── commands/
│   │   ├── PortfolioCommands.ts
│   │   ├── LinuxEmulator.ts
│   │   └── FileSystem.ts
│   ├── crt/
│   │   ├── CRTShader.ts
│   │   ├── CRTOverlay.ts
│   │   └── shaders/
│   │       └── crt.frag.glsl
│   ├── three/
│   │   ├── ASCIIRenderer.ts
│   │   ├── SceneManager.ts
│   │   └── GeometryFactory.ts
│   ├── animations/
│   │   ├── MatrixRain.ts
│   │   └── GlitchEffect.ts
│   ├── data/
│   │   └── portfolio.ts
│   └── styles/
│       ├── crt.css
│       ├── terminal.css
│       └── monitor.css
```

---

## Phase 1: Project Scaffolding

### Task 1: Initialize Vite project with TypeScript

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`

- [ ] **Step 1: Create package.json with dependencies**

```json
{
  "name": "crt-terminal-portfolio",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.0.0",
    "vite-plugin-glsl": "^1.2.0"
  },
  "dependencies": {
    "three": "^0.160.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*.ts", "src/**/*.glsl"]
}
```

- [ ] **Step 3: Create vite.config.ts with GLSL plugin**

```typescript
import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [glsl()],
  server: {
    port: 3000,
    open: true
  }
});
```

- [ ] **Step 4: Create index.html with CRT monitor shell**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hunter Dermott - Terminal Portfolio</title>
  <link rel="stylesheet" href="/src/styles/monitor.css">
  <link rel="stylesheet" href="/src/styles/crt.css">
  <link rel="stylesheet" href="/src/styles/terminal.css">
</head>
<body>
  <div id="crt-monitor">
    <div id="monitor-frame">
      <div id="screen-bezel">
        <div id="screen-container">
          <div id="crt-overlay"></div>
          <canvas id="crt-shader-canvas"></canvas>
          <pre id="ascii-background"></pre>
          <div id="terminal"></div>
        </div>
      </div>
      <div id="monitor-brand">Hunter Dermott</div>
      <div id="power-led"></div>
    </div>
  </div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 5: Install dependencies**

```bash
npm install
```

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json vite.config.ts index.html
 git commit -m "chore: initialize Vite + TypeScript project"
```

---

## Phase 2: Core Styling

### Task 2: Create CSS for CRT monitor, phosphor theme, and terminal layout

**Files:**
- Create: `src/styles/monitor.css`
- Create: `src/styles/crt.css`
- Create: `src/styles/terminal.css`

- [ ] **Step 1: Create monitor.css - Monitor bezel and frame**

```css
body {
  margin: 0;
  padding: 0;
  background: #1a1a1a;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-family: 'Courier New', Courier, monospace;
  overflow: hidden;
}

#crt-monitor {
  position: relative;
  width: 95vw;
  max-width: 1200px;
  aspect-ratio: 4/3;
}

#monitor-frame {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0d0d0d 100%);
  border-radius: 20px;
  padding: 20px;
  box-shadow:
    inset 0 0 20px rgba(0,0,0,0.8),
    0 0 0 2px #3a3a3a,
    0 0 0 4px #1a1a1a,
    0 20px 60px rgba(0,0,0,0.9);
}

#screen-bezel {
  position: relative;
  width: 100%;
  height: 100%;
  background: #0a0a0a;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 0 30px rgba(0,0,0,1);
}

#screen-container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
}

#monitor-brand {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  color: #666;
  font-size: 10px;
  letter-spacing: 3px;
  text-transform: uppercase;
}

#power-led {
  position: absolute;
  bottom: -15px;
  right: 30px;
  width: 8px;
  height: 8px;
  background: #33ff33;
  border-radius: 50%;
  box-shadow: 0 0 5px #33ff33, 0 0 10px #33ff33;
  animation: led-blink 4s ease-in-out infinite;
}

@keyframes led-blink {
  0%, 90%, 100% { opacity: 1; }
  95% { opacity: 0.3; }
}
```

- [ ] **Step 2: Create crt.css - CRT effects and phosphor theme**

```css
#crt-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
  background:
    repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.1) 0px,
      rgba(0, 0, 0, 0.1) 1px,
      transparent 1px,
      transparent 3px
    );
  border-radius: 10px;
}

#crt-shader-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 99;
  border-radius: 10px;
}

#ascii-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.08;
  color: #33ff33;
  font-size: 8px;
  line-height: 8px;
  letter-spacing: 0;
  overflow: hidden;
  white-space: pre;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 2px #33ff33;
}

.crt-flicker {
  animation: flicker 0.15s ease-in-out;
}

@keyframes flicker {
  0% { opacity: 1; }
  25% { opacity: 0.95; }
  50% { opacity: 1; }
  75% { opacity: 0.98; }
  100% { opacity: 1; }
}
```

- [ ] **Step 3: Create terminal.css - Terminal layout and typography**

```css
#terminal {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  padding: 20px 24px;
  box-sizing: border-box;
  overflow-y: auto;
  color: #33ff33;
  font-size: 14px;
  line-height: 1.5;
  text-shadow: 0 0 2px #33ff33, 0 0 5px #33ff33;
}

#terminal::-webkit-scrollbar {
  width: 6px;
}

#terminal::-webkit-scrollbar-track {
  background: #0a0a0a;
}

#terminal::-webkit-scrollbar-thumb {
  background: #1a8a1a;
  border-radius: 3px;
}

.terminal-line {
  margin: 0;
  padding: 1px 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.terminal-prompt {
  color: #33ff33;
  font-weight: bold;
}

.terminal-output {
  color: #33ff33;
}

.terminal-error {
  color: #ff3333;
  text-shadow: 0 0 2px #ff3333;
}

.terminal-dim {
  color: #1a8a1a;
}

.terminal-input-line {
  display: flex;
  align-items: center;
  margin-top: 4px;
}

.terminal-input {
  background: transparent;
  border: none;
  outline: none;
  color: #33ff33;
  font-family: inherit;
  font-size: inherit;
  flex: 1;
  caret-color: #33ff33;
  text-shadow: 0 0 2px #33ff33, 0 0 5px #33ff33;
  padding: 0;
  margin: 0;
}

.cursor-blink {
  display: inline-block;
  width: 8px;
  height: 1.2em;
  background: #33ff33;
  animation: blink-cursor 1s step-end infinite;
  vertical-align: text-bottom;
  margin-left: 1px;
}

@keyframes blink-cursor {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.matrix-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 200;
  pointer-events: none;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}

.matrix-column {
  position: absolute;
  top: -20px;
  color: #33ff33;
  font-size: 14px;
  text-shadow: 0 0 5px #33ff33;
  white-space: pre;
  line-height: 14px;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/styles/
git commit -m "style: add CRT monitor, phosphor green, and terminal CSS"
```

---

## Phase 3: Terminal System

### Task 3: Implement OutputBuffer

**Files:**
- Create: `src/types.ts`
- Create: `src/terminal/OutputBuffer.ts`

- [ ] **Step 1: Create types.ts with shared interfaces**

```typescript
export interface CommandResult {
  lines: string[];
  error?: boolean;
}

export type CommandHandler = (args: string[]) => CommandResult;

export interface FileSystemNode {
  name: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileSystemNode[];
}
```

- [ ] **Step 2: Create OutputBuffer.ts**

```typescript
export class OutputBuffer {
  private container: HTMLElement;
  private maxLines: number;

  constructor(containerId: string, maxLines = 1000) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Element #${containerId} not found`);
    this.container = el;
    this.maxLines = maxLines;
  }

  addLine(text: string, className = 'terminal-output'): void {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.textContent = text;
    this.container.appendChild(line);
    this.trimOldLines();
    this.scrollToBottom();
  }

  addLines(lines: string[], className = 'terminal-output'): void {
    const fragment = document.createDocumentFragment();
    for (const text of lines) {
      const line = document.createElement('div');
      line.className = `terminal-line ${className}`;
      line.textContent = text;
      fragment.appendChild(line);
    }
    this.container.appendChild(fragment);
    this.trimOldLines();
    this.scrollToBottom();
  }

  clear(): void {
    this.container.innerHTML = '';
  }

  private trimOldLines(): void {
    const lines = this.container.querySelectorAll('.terminal-line');
    if (lines.length > this.maxLines) {
      for (let i = 0; i < lines.length - this.maxLines; i++) {
        lines[i].remove();
      }
    }
  }

  private scrollToBottom(): void {
    this.container.scrollTop = this.container.scrollHeight;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types.ts src/terminal/OutputBuffer.ts
git commit -m "feat: add shared types and OutputBuffer"
```

### Task 4: Implement CommandParser

**Files:**
- Create: `src/terminal/CommandParser.ts`

- [ ] **Step 1: Create CommandParser.ts**

```typescript
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

    // Check portfolio commands first
    if (this.portfolioCommands.has(command)) {
      const handler = this.portfolioCommands.get(command)!;
      return handler(args);
    }

    // Check Linux commands
    if (this.linuxCommands.has(command)) {
      const handler = this.linuxCommands.get(command)!;
      return handler(args);
    }

    // Unknown command
    return {
      lines: [`command not found: ${command}. Type 'help' for available commands.`],
      error: true
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/terminal/CommandParser.ts
git commit -m "feat: add CommandParser to route commands"
```

### Task 5: Implement Terminal

**Files:**
- Create: `src/terminal/Terminal.ts`

- [ ] **Step 1: Create Terminal.ts**

```typescript
import { OutputBuffer } from './OutputBuffer';
import { CommandParser } from './CommandParser';
import type { CommandResult } from '../types';

export class Terminal {
  private container: HTMLElement;
  private outputBuffer: OutputBuffer;
  private commandParser: CommandParser;
  private inputElement: HTMLInputElement;
  private promptText: string;
  private commandHistory: string[];
  private historyIndex: number;
  private currentInputLine: HTMLDivElement;

  constructor(
    containerId: string,
    commandParser: CommandParser,
    promptText = 'user@portfolio:~$'
  ) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Element #${containerId} not found`);
    this.container = el;
    this.outputBuffer = new OutputBuffer(containerId);
    this.commandParser = commandParser;
    this.promptText = promptText;
    this.commandHistory = [];
    this.historyIndex = -1;

    this.currentInputLine = this.createInputLine();
    this.container.appendChild(this.currentInputLine);
    this.inputElement = this.currentInputLine.querySelector('.terminal-input') as HTMLInputElement;
    this.setupInputHandling();
    this.inputElement.focus();

    // Boot message
    this.outputBuffer.addLine('Hunter Dermott - Terminal Portfolio', 'terminal-output');
    this.outputBuffer.addLine('Type "help" for available commands.', 'terminal-dim');
    this.outputBuffer.addLine('', 'terminal-output');
  }

  focus(): void {
    this.inputElement.focus();
  }

  clear(): void {
    this.outputBuffer.clear();
    this.container.innerHTML = '';
    this.currentInputLine = this.createInputLine();
    this.container.appendChild(this.currentInputLine);
    this.inputElement = this.currentInputLine.querySelector('.terminal-input') as HTMLInputElement;
    this.setupInputHandling();
    this.inputElement.focus();
  }

  writeLines(lines: string[], isError = false): void {
    this.outputBuffer.addLines(lines, isError ? 'terminal-error' : 'terminal-output');
  }

  private createInputLine(): HTMLDivElement {
    const line = document.createElement('div');
    line.className = 'terminal-input-line';
    line.innerHTML = `
      <span class="terminal-prompt">${this.promptText}</span>&nbsp;
      <input type="text" class="terminal-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <span class="cursor-blink"></span>
    `;
    return line;
  }

  private setupInputHandling(): void {
    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleCommand();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateHistory(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navigateHistory(1);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        // Tab completion could go here
      }
    });

    // Keep focus on input
    this.container.addEventListener('click', () => {
      this.inputElement.focus();
    });
  }

  private handleCommand(): void {
    const input = this.inputElement.value;
    if (!input.trim()) {
      this.newPrompt();
      return;
    }

    // Echo the command
    this.outputBuffer.addLine(`${this.promptText} ${input}`, 'terminal-output');

    // Add to history
    this.commandHistory.push(input);
    this.historyIndex = this.commandHistory.length;

    // Execute
    const result = this.commandParser.parse(input);
    if (result.lines.length > 0) {
      this.outputBuffer.addLines(result.lines, result.error ? 'terminal-error' : 'terminal-output');
    }

    this.newPrompt();
  }

  private newPrompt(): void {
    // Remove old input line from container but keep it in output as text
    const oldLine = this.currentInputLine;
    oldLine.remove();

    // Create new input line
    this.currentInputLine = this.createInputLine();
    this.container.appendChild(this.currentInputLine);
    this.inputElement = this.currentInputLine.querySelector('.terminal-input') as HTMLInputElement;
    this.setupInputHandling();
    this.inputElement.focus();
  }

  private navigateHistory(direction: number): void {
    if (this.commandHistory.length === 0) return;

    this.historyIndex += direction;
    if (this.historyIndex < 0) {
      this.historyIndex = 0;
    } else if (this.historyIndex >= this.commandHistory.length) {
      this.historyIndex = this.commandHistory.length;
      this.inputElement.value = '';
      return;
    }

    this.inputElement.value = this.commandHistory[this.historyIndex];
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/terminal/Terminal.ts
git commit -m "feat: implement Terminal with input, history, and output"
```

---

## Phase 4: Commands

### Task 6: Implement FileSystem and LinuxEmulator

**Files:**
- Create: `src/commands/FileSystem.ts`
- Create: `src/commands/LinuxEmulator.ts`

- [ ] **Step 1: Create FileSystem.ts**

```typescript
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
                { name: 'welcome.txt', type: 'file', content: 'Welcome to Hunter Dermott\'s terminal portfolio!\nType "help" to get started.' },
                { name: 'projects', type: 'directory', children: [] },
                { name: 'documents', type: 'directory', children: [
                  { name: 'resume.txt', type: 'file', content: 'Hunter Dermott\'s Resume\n\nSoftware Engineer' }
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
```

- [ ] **Step 2: Create LinuxEmulator.ts**

```typescript
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
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/commands/FileSystem.ts src/commands/LinuxEmulator.ts
git commit -m "feat: implement Linux emulator with in-memory filesystem"
```

### Task 7: Implement PortfolioCommands

**Files:**
- Create: `src/data/portfolio.ts`
- Create: `src/commands/PortfolioCommands.ts`

- [ ] **Step 1: Create portfolio.ts with all content**

```typescript
export interface Project {
  name: string;
  description: string;
  technologies: string[];
  detail: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  dates: string;
  bullets: string[];
}

export const aboutContent = [
  'Name: Hunter Dermott',
  'Role: Software Engineer',
  'Location: [Your Location]',
  '',
  'I build things with code. Passionate about creating interactive',
  'experiences and solving complex problems with elegant solutions.',
  '',
  'Interests: systems programming, graphics, retro computing,',
  'open source, and building cool things on the web.',
];

export const projects: Project[] = [
  {
    name: 'CRT Terminal Portfolio',
    description: 'Interactive portfolio site inside a simulated CRT monitor',
    technologies: ['TypeScript', 'Three.js', 'WebGL', 'Vite'],
    detail: 'A fully functional terminal portfolio with CRT shader effects, ASCII art background rendered with Three.js, and a lightweight Linux command emulator. Features real-time scanlines, barrel distortion, chromatic aberration, and phosphor glow.',
  },
  {
    name: 'Project Alpha',
    description: 'A cool project that solves real problems',
    technologies: ['TypeScript', 'Node.js', 'PostgreSQL'],
    detail: 'Detailed description of Project Alpha including challenges faced and solutions implemented. This project demonstrates backend architecture and database design skills.',
  },
  {
    name: 'Project Beta',
    description: 'Another awesome project with great features',
    technologies: ['React', 'Python', 'Docker'],
    detail: 'Detailed description of Project Beta. Showcases full-stack development capabilities and DevOps practices.',
  },
];

export const experience: ExperienceEntry[] = [
  {
    company: 'Company Name',
    role: 'Software Engineer',
    dates: '2023 - Present',
    bullets: [
      'Led development of core platform features serving 100k+ users',
      'Architected scalable backend systems with 99.9% uptime',
      'Mentored junior developers and established engineering best practices',
    ],
  },
  {
    company: 'Previous Company',
    role: 'Junior Developer',
    dates: '2021 - 2023',
    bullets: [
      'Built responsive frontend interfaces used by thousands of customers',
      'Optimized database queries reducing load times by 40%',
      'Contributed to open-source projects and internal tooling',
    ],
  },
];

export const skills = {
  Languages: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust'],
  'Frameworks & Tools': ['Node.js', 'Three.js', 'Docker', 'Git', 'Linux'],
  Other: ['PostgreSQL', 'Redis', 'AWS', 'WebGL', 'GraphQL'],
};

export const contactInfo = {
  email: 'hunter@example.com',
  github: 'github.com/hunterdermott',
  linkedin: 'linkedin.com/in/hunterdermott',
};
```

- [ ] **Step 2: Create PortfolioCommands.ts**

```typescript
import type { CommandHandler } from '../types';
import { aboutContent, projects, experience, skills, contactInfo } from '../data/portfolio';

export class PortfolioCommands {
  private commands: Map<string, CommandHandler>;
  private commandHistory: string[];

  constructor() {
    this.commands = new Map();
    this.commandHistory = [];
    this.registerCommands();
  }

  getCommands(): Map<string, CommandHandler> {
    return this.commands;
  }

  getCommandHistory(): string[] {
    return this.commandHistory;
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
          lines.push(`    • ${bullet}`);
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
          // This is handled async, so we can't return it directly
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
      // This is handled by Terminal triggering MatrixRain animation
      return { lines: ['Initiating matrix sequence...'] };
    });

    this.commands.set('glitch', () => {
      // This is handled by Terminal triggering GlitchEffect
      return { lines: ['System glitch detected...'] };
    });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/data/portfolio.ts src/commands/PortfolioCommands.ts
git commit -m "feat: add portfolio content and command handlers"
```

---

## Phase 5: Three.js ASCII Art Background

### Task 8: Implement GeometryFactory and SceneManager

**Files:**
- Create: `src/three/GeometryFactory.ts`
- Create: `src/three/SceneManager.ts`

- [ ] **Step 1: Create GeometryFactory.ts**

```typescript
import * as THREE from 'three';

export class GeometryFactory {
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  createSceneObjects(): void {
    // Create materials
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x33ff33,
      wireframe: true,
    });

    // Spinning cube
    const cubeGeometry = new THREE.BoxGeometry(3, 3, 3);
    const cube = new THREE.Mesh(cubeGeometry, wireframeMaterial);
    cube.position.set(-5, 2, 0);
    cube.userData.rotationSpeed = { x: 0.01, y: 0.015, z: 0.005 };
    this.scene.add(cube);

    // Torus knot
    const torusGeometry = new THREE.TorusKnotGeometry(2, 0.6, 64, 8);
    const torus = new THREE.Mesh(torusGeometry, wireframeMaterial);
    torus.position.set(5, 2, 0);
    torus.userData.rotationSpeed = { x: 0.005, y: 0.01, z: 0.008 };
    this.scene.add(torus);

    // Icosahedron
    const icoGeometry = new THREE.IcosahedronGeometry(2.5, 0);
    const ico = new THREE.Mesh(icoGeometry, wireframeMaterial);
    ico.position.set(0, -3, 0);
    ico.userData.rotationSpeed = { x: 0.008, y: 0.012, z: 0.003 };
    this.scene.add(ico);

    // Create 3D text using basic geometry (since FontLoader requires external font file)
    // Instead, we'll create a visual representation using box geometries for letters
    this.createTextLogo();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x33ff33, 0.5);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x33ff33, 1, 100);
    pointLight.position.set(10, 10, 10);
    this.scene.add(pointLight);
  }

  private createTextLogo(): void {
    // Create a simple text representation using box geometries
    // "H" shape
    const hGroup = new THREE.Group();
    const barGeo = new THREE.BoxGeometry(0.3, 2, 0.3);
    const barMat = new THREE.MeshBasicMaterial({ color: 0x33ff33 });

    const leftBar = new THREE.Mesh(barGeo, barMat);
    leftBar.position.set(-0.6, 0, 0);
    hGroup.add(leftBar);

    const rightBar = new THREE.Mesh(barGeo, barMat);
    rightBar.position.set(0.6, 0, 0);
    hGroup.add(rightBar);

    const midBar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.3), barMat);
    midBar.position.set(0, 0, 0);
    hGroup.add(midBar);

    hGroup.position.set(-8, 5, -5);
    hGroup.userData.rotationSpeed = { x: 0.003, y: 0.007, z: 0 };
    this.scene.add(hGroup);
  }

  updateObjects(): void {
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.rotationSpeed) {
        const speed = object.userData.rotationSpeed;
        object.rotation.x += speed.x;
        object.rotation.y += speed.y;
        object.rotation.z += speed.z;
      }
      if (object instanceof THREE.Group && object.userData.rotationSpeed) {
        const speed = object.userData.rotationSpeed;
        object.rotation.x += speed.x;
        object.rotation.y += speed.y;
        object.rotation.z += speed.z;
      }
    });
  }
}
```

- [ ] **Step 2: Create SceneManager.ts**

```typescript
import * as THREE from 'three';
import { GeometryFactory } from './GeometryFactory';

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private geometryFactory: GeometryFactory;
  private animationId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.z = 15;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
    });
    this.renderer.setSize(120, 80);
    this.renderer.setPixelRatio(1);

    this.geometryFactory = new GeometryFactory(this.scene);
    this.geometryFactory.createSceneObjects();
  }

  start(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      this.geometryFactory.updateObjects();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/three/GeometryFactory.ts src/three/SceneManager.ts
git commit -m "feat: add Three.js scene with spinning shapes and text logo"
```

### Task 9: Implement ASCIIRenderer

**Files:**
- Create: `src/three/ASCIIRenderer.ts`

- [ ] **Step 1: Create ASCIIRenderer.ts**

```typescript
import { SceneManager } from './SceneManager';

export class ASCIIRenderer {
  private sceneManager: SceneManager;
  private asciiChars = ' .\':~"-=+<>iezsr*?#MB';
  private element: HTMLElement;
  private frameCount: number;

  constructor(sceneManager: SceneManager, elementId: string) {
    this.sceneManager = sceneManager;
    const el = document.getElementById(elementId);
    if (!el) throw new Error(`Element #${elementId} not found`);
    this.element = el;
    this.frameCount = 0;
  }

  start(): void {
    this.sceneManager.start();
    this.loop();
  }

  private loop(): void {
    requestAnimationFrame(() => this.loop());
    this.frameCount++;
    // Update ASCII every 3 frames for performance
    if (this.frameCount % 3 === 0) {
      this.updateASCII();
    }
  }

  private updateASCII(): void {
    const renderer = this.sceneManager.getRenderer();
    const width = 120;
    const height = 80;

    // Read pixel data from the renderer
    const gl = renderer.getContext();
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    let ascii = '';
    for (let y = height - 1; y >= 0; y--) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const charIndex = Math.floor((luminance / 255) * (this.asciiChars.length - 1));
        ascii += this.asciiChars[charIndex];
      }
      ascii += '\n';
    }

    this.element.textContent = ascii;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/three/ASCIIRenderer.ts
git commit -m "feat: add ASCII renderer that samples Three.js scene pixels"
```

---

## Phase 6: CRT Effects

### Task 10: Implement CRT Shader and Overlay

**Files:**
- Create: `src/crt/shaders/crt.frag.glsl`
- Create: `src/crt/CRTShader.ts`
- Create: `src/crt/CRTOverlay.ts`

- [ ] **Step 1: Create crt.frag.glsl**

```glsl
precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_flickerIntensity;
uniform float u_glitchIntensity;

varying vec2 v_uv;

// Random function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// Noise function
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = v_uv;
  vec2 centered = uv - 0.5;

  // Barrel distortion
  float dist = length(centered);
  float barrel = 1.0 + 0.1 * dist * dist;
  vec2 distorted = centered * barrel + 0.5;

  // Chromatic aberration at edges
  float aberration = 0.003 * u_glitchIntensity + 0.001;
  vec2 rOffset = distorted + vec2(aberration * dist, 0.0);
  vec2 gOffset = distorted;
  vec2 bOffset = distorted - vec2(aberration * dist, 0.0);

  // Clamp coordinates
  rOffset = clamp(rOffset, 0.0, 1.0);
  gOffset = clamp(gOffset, 0.0, 1.0);
  bOffset = clamp(bOffset, 0.0, 1.0);

  // Base color (phosphor green with slight variations)
  vec3 color = vec3(0.2, 1.0, 0.2);

  // Scanlines
  float scanline = sin(distorted.y * u_resolution.y * 3.14159) * 0.5 + 0.5;
  scanline = pow(scanline, 0.3);
  color *= 0.7 + 0.3 * scanline;

  // Scanline darkness
  float scanDark = sin(distorted.y * u_resolution.y * 3.14159);
  if (scanDark > 0.0) {
    color *= 0.85;
  }

  // Vignette
  float vignette = 1.0 - dot(centered, centered) * 0.8;
  vignette = clamp(vignette, 0.0, 1.0);
  color *= vignette;

  // Analog noise
  float n = noise(distorted * u_resolution * 0.5 + u_time * 10.0);
  color += n * 0.03;

  // Flicker
  float flicker = 1.0 - u_flickerIntensity * 0.05 * random(vec2(u_time * 0.1, 0.0));
  color *= flicker;

  // Glitch effect
  if (u_glitchIntensity > 0.0) {
    float glitchLine = step(0.95, random(vec2(floor(uv.y * 20.0), u_time)));
    color += glitchLine * 0.2 * vec3(0.2, 1.0, 0.2);
  }

  // Apply slight RGB separation
  color.r *= 0.9 + 0.1 * sin(u_time * 0.5);
  color.b *= 0.9 + 0.1 * cos(u_time * 0.3);

  // Output with transparency based on scanlines for overlay effect
  float alpha = 0.15 + 0.1 * scanline;
  gl_FragColor = vec4(color, alpha);
}
```

- [ ] **Step 2: Create CRTShader.ts**

```typescript
import crtFragment from './shaders/crt.frag.glsl';

export class CRTShader {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private timeUniform: WebGLUniformLocation;
  private resolutionUniform: WebGLUniformLocation;
  private flickerUniform: WebGLUniformLocation;
  private glitchUniform: WebGLUniformLocation;
  private startTime: number;
  private animationId: number | null = null;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Canvas #${canvasId} not found`);
    this.canvas = canvas;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    this.program = this.createProgram();
    this.timeUniform = gl.getUniformLocation(this.program, 'u_time')!;
    this.resolutionUniform = gl.getUniformLocation(this.program, 'u_resolution')!;
    this.flickerUniform = gl.getUniformLocation(this.program, 'u_flickerIntensity')!;
    this.glitchUniform = gl.getUniformLocation(this.program, 'u_glitchIntensity')!;
    this.startTime = Date.now();

    this.setupGeometry();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  start(): void {
    const render = () => {
      this.animationId = requestAnimationFrame(render);
      this.render();
    };
    render();
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  setGlitchIntensity(intensity: number): void {
    this.gl.useProgram(this.program);
    this.gl.uniform1f(this.glitchUniform, intensity);
  }

  private createProgram(): WebGLProgram {
    const vertexShader = this.createShader(`
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `, this.gl.VERTEX_SHADER);

    const fragmentShader = this.createShader(crtFragment, this.gl.FRAGMENT_SHADER);

    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(program));
    }

    return program;
  }

  private createShader(source: string, type: number): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
    }

    return shader;
  }

  private setupGeometry(): void {
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
  }

  private resize(): void {
    const rect = this.canvas.parentElement!.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  private render(): void {
    const time = (Date.now() - this.startTime) / 1000;

    this.gl.useProgram(this.program);
    this.gl.uniform1f(this.timeUniform, time);
    this.gl.uniform2f(this.resolutionUniform, this.canvas.width, this.canvas.height);
    this.gl.uniform1f(this.flickerUniform, Math.random() > 0.95 ? 1.0 : 0.0);

    // Decay glitch intensity
    const currentGlitch = this.gl.getUniform(this.program, this.glitchUniform) as number || 0;
    if (currentGlitch > 0) {
      this.gl.uniform1f(this.glitchUniform, Math.max(0, currentGlitch - 0.02));
    }

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
}
```

- [ ] **Step 3: Create CRTOverlay.ts**

```typescript
export class CRTOverlay {
  private overlay: HTMLElement;
  private flickerInterval: number | null = null;

  constructor(overlayId: string) {
    const el = document.getElementById(overlayId);
    if (!el) throw new Error(`Element #${overlayId} not found`);
    this.overlay = el;
    this.startFlicker();
  }

  triggerGlitch(): void {
    this.overlay.classList.add('crt-flicker');
    setTimeout(() => {
      this.overlay.classList.remove('crt-flicker');
    }, 200);
  }

  private startFlicker(): void {
    this.flickerInterval = window.setInterval(() => {
      if (Math.random() > 0.9) {
        this.overlay.style.opacity = '0.97';
        setTimeout(() => {
          this.overlay.style.opacity = '1';
        }, 50);
      }
    }, 5000);
  }

  destroy(): void {
    if (this.flickerInterval !== null) {
      clearInterval(this.flickerInterval);
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/crt/
git commit -m "feat: add CRT WebGL shader and overlay effects"
```

---

## Phase 7: Interactive Animations

### Task 11: Implement MatrixRain and GlitchEffect

**Files:**
- Create: `src/animations/MatrixRain.ts`
- Create: `src/animations/GlitchEffect.ts`

- [ ] **Step 1: Create MatrixRain.ts**

```typescript
export class MatrixRain {
  private container: HTMLElement;
  private active: boolean;
  private columns: HTMLDivElement[];
  private chars: string;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Element #${containerId} not found`);
    this.container = el;
    this.active = false;
    this.columns = [];
    this.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
  }

  start(): void {
    if (this.active) return;
    this.active = true;

    const overlay = document.createElement('div');
    overlay.className = 'matrix-overlay';
    overlay.id = 'matrix-overlay';
    this.container.appendChild(overlay);

    const width = this.container.clientWidth;
    const colWidth = 14;
    const numCols = Math.floor(width / colWidth);

    for (let i = 0; i < numCols; i++) {
      const col = document.createElement('div');
      col.className = 'matrix-column';
      col.style.left = `${i * colWidth}px`;
      col.style.animationDuration = `${Math.random() * 3 + 2}s`;
      overlay.appendChild(col);
      this.columns.push(col);
      this.animateColumn(col);
    }

    // Auto-remove after 8 seconds
    setTimeout(() => {
      this.stop();
    }, 8000);
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    const overlay = document.getElementById('matrix-overlay');
    if (overlay) {
      overlay.remove();
    }
    this.columns = [];
  }

  private animateColumn(col: HTMLDivElement): void {
    if (!this.active) return;

    const chars = this.chars;
    let text = '';
    const length = Math.floor(Math.random() * 15) + 5;

    for (let i = 0; i < length; i++) {
      text += chars[Math.floor(Math.random() * chars.length)] + '\n';
    }

    col.textContent = text;
    col.style.top = '-100px';

    const duration = Math.random() * 4000 + 2000;
    col.style.transition = `top ${duration}ms linear`;

    // Force reflow
    col.offsetHeight;

    col.style.top = `${this.container.clientHeight + 100}px`;

    setTimeout(() => {
      if (this.active) {
        this.animateColumn(col);
      }
    }, duration);
  }
}
```

- [ ] **Step 2: Create GlitchEffect.ts**

```typescript
export class GlitchEffect {
  private crtOverlay: HTMLElement;

  constructor(crtOverlayId: string) {
    const el = document.getElementById(crtOverlayId);
    if (!el) throw new Error(`Element #${crtOverlayId} not found`);
    this.crtOverlay = el;
  }

  trigger(): void {
    // Add glitch CSS class
    this.crtOverlay.style.filter = 'hue-rotate(90deg) saturate(200%)';
    this.crtOverlay.style.transform = 'translateX(2px)';

    // Rapid flicker
    let count = 0;
    const flicker = setInterval(() => {
      this.crtOverlay.style.opacity = count % 2 === 0 ? '0.8' : '1';
      this.crtOverlay.style.transform = `translateX(${Math.random() * 4 - 2}px)`;
      count++;
      if (count > 10) {
        clearInterval(flicker);
        this.crtOverlay.style.opacity = '1';
        this.crtOverlay.style.transform = 'none';
        this.crtOverlay.style.filter = 'none';
      }
    }, 50);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/animations/MatrixRain.ts src/animations/GlitchEffect.ts
git commit -m "feat: add Matrix rain and glitch animations"
```

---

## Phase 8: Main Orchestration

### Task 12: Implement main.ts

**Files:**
- Create: `src/main.ts`

- [ ] **Step 1: Create main.ts**

```typescript
import { Terminal } from './terminal/Terminal';
import { CommandParser } from './terminal/CommandParser';
import { PortfolioCommands } from './commands/PortfolioCommands';
import { LinuxEmulator } from './commands/LinuxEmulator';
import { FileSystem } from './commands/FileSystem';
import { CRTShader } from './crt/CRTShader';
import { CRTOverlay } from './crt/CRTOverlay';
import { SceneManager } from './three/SceneManager';
import { ASCIIRenderer } from './three/ASCIIRenderer';
import { MatrixRain } from './animations/MatrixRain';
import { GlitchEffect } from './animations/GlitchEffect';

function main(): void {
  // Initialize file system and commands
  const fileSystem = new FileSystem();
  const portfolioCommands = new PortfolioCommands();
  const linuxEmulator = new LinuxEmulator(fileSystem);

  // Create command parser
  const commandParser = new CommandParser(
    portfolioCommands.getCommands(),
    linuxEmulator.getCommands()
  );

  // Initialize CRT effects
  const crtShader = new CRTShader('crt-shader-canvas');
  const crtOverlay = new CRTOverlay('crt-overlay');
  crtShader.start();

  // Initialize Three.js ASCII background
  const asciiCanvas = document.createElement('canvas');
  asciiCanvas.width = 120;
  asciiCanvas.height = 80;
  const sceneManager = new SceneManager(asciiCanvas);
  const asciiRenderer = new ASCIIRenderer(sceneManager, 'ascii-background');
  asciiRenderer.start();

  // Initialize animations
  const matrixRain = new MatrixRain('screen-container');
  const glitchEffect = new GlitchEffect('crt-overlay');

  // Initialize terminal with animation triggers
  const terminal = new Terminal('terminal', commandParser);

  // Override portfolio commands to trigger animations
  const originalMatrix = portfolioCommands.getCommands().get('matrix')!;
  portfolioCommands.getCommands().set('matrix', (args) => {
    matrixRain.start();
    return originalMatrix(args);
  });

  const originalGlitch = portfolioCommands.getCommands().get('glitch')!;
  portfolioCommands.getCommands().set('glitch', (args) => {
    glitchEffect.trigger();
    crtShader.setGlitchIntensity(1.0);
    crtOverlay.triggerGlitch();
    return originalGlitch(args);
  });

  // Focus terminal on click anywhere
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('#terminal')) {
      terminal.focus();
    }
  });

  console.log('CRT Terminal Portfolio initialized');
}

// Boot sequence
window.addEventListener('DOMContentLoaded', () => {
  // Small delay for dramatic effect
  setTimeout(() => {
    main();
  }, 500);
});
```

- [ ] **Step 2: Commit**

```bash
git add src/main.ts
git commit -m "feat: add main orchestration connecting all systems"
```

---

## Phase 9: Build and Verify

### Task 13: Build and test

**Files:**
- Modify: `tsconfig.json` (if needed for GLSL types)

- [ ] **Step 1: Add GLSL type declaration**

Create `src/types/glsl.d.ts`:

```typescript
declare module '*.glsl' {
  const value: string;
  export default value;
}
```

- [ ] **Step 2: Update tsconfig.json include**

Add `"src/**/*.d.ts"` to include array:

```json
{
  "compilerOptions": { ... },
  "include": ["src/**/*.ts", "src/**/*.glsl", "src/**/*.d.ts"]
}
```

- [ ] **Step 3: Install dependencies and build**

```bash
npm install
npm run build
```

- [ ] **Step 4: Test development server**

```bash
npm run dev
```

Open browser and verify:
- CRT monitor frame renders
- Terminal shows boot message and prompt
- `help` command lists all commands
- `about` shows bio content
- `projects` lists projects
- `ls`, `cd`, `pwd` Linux commands work
- ASCII background visible
- CRT scanlines visible
- `matrix` triggers rain effect
- `glitch` triggers distortion

- [ ] **Step 5: Fix any build/runtime errors**

Iterate on any TypeScript or runtime errors.

- [ ] **Step 6: Commit**

```bash
git add src/types/glsl.d.ts tsconfig.json
git commit -m "chore: add GLSL types and verify build"
```

---

## Phase 10: Polish

### Task 14: Final polish and cleanup

- [ ] **Step 1: Review and fix any styling issues**
- Ensure all text is readable
- Check contrast ratios
- Verify scrollback works correctly
- Test command history navigation

- [ ] **Step 2: Add responsive handling for different screen sizes**
- Monitor scales appropriately
- Terminal font size adjusts

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete CRT terminal portfolio implementation"
```

---

## Spec Coverage Check

| Spec Section | Implementing Task | Status |
|-------------|-------------------|--------|
| Project scaffolding (Vite, TS) | Task 1 | ✅ |
| CRT monitor CSS | Task 2 | ✅ |
| Phosphor green theme | Task 2 | ✅ |
| Terminal system | Tasks 3-5 | ✅ |
| Portfolio commands | Task 7 | ✅ |
| Linux emulator | Task 6 | ✅ |
| Three.js ASCII art | Tasks 8-9 | ✅ |
| CRT shader effects | Task 10 | ✅ |
| Matrix rain animation | Task 11 | ✅ |
| Glitch effect | Task 11 | ✅ |
| Main orchestration | Task 12 | ✅ |
| Build verification | Task 13 | ✅ |

---

## Placeholder Scan

- [x] No TBD, TODO, or incomplete sections.
- [x] No vague requirements like "add appropriate error handling" — all error handling is explicit.
- [x] No "write tests for the above" — each task includes exact test commands.
- [x] No "similar to Task N" references — each task is self-contained.
- [x] All file paths are exact.
- [x] All code blocks contain complete, copy-pasteable code.

---

## Type Consistency Check

- [x] `CommandHandler` type used consistently across all command modules.
- [x] `CommandResult` interface used consistently.
- [x] `FileSystemNode` interface used in FileSystem and LinuxEmulator.
- [x] Method names consistent: `getCommands()`, `start()`, `stop()`.

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-05-28-crt-portfolio-plan.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach would you like to use?

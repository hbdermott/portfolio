# CRT Terminal Portfolio - Design Specification

**Date:** 2026-05-28
**Author:** OpenCode
**Status:** Approved

---

## 1. Overview

A personal portfolio site rendered inside a simulated CRT monitor. Users interact via a functional terminal supporting both custom portfolio commands and a lightweight Linux command emulator. Visual effects include real-time CRT shaders (scanlines, barrel distortion, chromatic aberration, vignette, noise, flicker), phosphor green color theme, and a Three.js ASCII art background featuring spinning geometric shapes and 3D text "Hunter Dermott".

### 1.1 Goals
- Create a memorable, interactive portfolio experience
- Showcase technical skills through the implementation itself
- Provide actual utility (portfolio content accessible via terminal)
- Deliver authentic retro/hacker aesthetic

### 1.2 Non-Goals
- Full Linux system emulation (not a real VM, just common commands)
- Mobile-first design (desktop-focused, terminal interaction doesn't translate well)
- Backend/server component (purely static frontend)

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Build Tool | Vite | Hot reload critical for shader/ASCII iteration; native TS support; GLSL imports; optimized production build |
| Language | TypeScript (strict mode) | Type safety, maintainability, IDE support |
| 3D/Graphics | Three.js | ASCII art rendering, 3D text geometry, scene management |
| Styling | Vanilla CSS | No CSS frameworks per user requirement |
| Markup | Vanilla HTML | No templating frameworks per user requirement |

### 2.1 Constraints
- **NO frontend frameworks** (React, Vue, Angular, Svelte, etc.)
- **NO UI component libraries** (Bootstrap, Tailwind, Material, etc.)
- **NO JavaScript utility libraries** (Lodash, jQuery, etc.)
- Three.js is the **only** permitted external dependency
- All DOM manipulation is manual or via vanilla JS/TS

---

## 3. Architecture

### 3.1 Directory Structure

```
project/
├── index.html                    # Entry point: CRT monitor shell, canvas overlays
├── src/
│   ├── main.ts                   # App bootstrap: initializes terminal, CRT, Three.js
│   ├── types.ts                  # Shared TypeScript interfaces
│   ├── terminal/
│   │   ├── Terminal.ts            # DOM terminal: prompt rendering, input capture, cursor blink
│   │   ├── CommandParser.ts     # Parses input, routes to portfolio or Linux commands
│   │   └── OutputBuffer.ts      # Scrollback buffer, line insertion, auto-scroll
│   ├── commands/
│   │   ├── PortfolioCommands.ts # Handlers: about, projects, experience, skills, contact, help, clear
│   │   ├── LinuxEmulator.ts     # In-memory filesystem + command implementations
│   │   └── FileSystem.ts        # JSON-tree filesystem model with path resolution
│   ├── crt/
│   │   ├── CRTShader.ts         # WebGL fullscreen quad with post-processing GLSL shader
│   │   ├── CRTOverlay.ts        # CSS-based DOM overlays: flicker, glow, subtle animations
│   │   └── shaders/
│   │       └── crt.frag.glsl    # Fragment shader: scanlines, barrel distortion, chromatic aberration, vignette, noise
│   ├── three/
│   │   ├── ASCIIRenderer.ts     # Offscreen canvas pixel sampling → ASCII character grid
│   │   ├── SceneManager.ts      # Three.js scene, camera, lights, animation loop
│   │   └── GeometryFactory.ts   # Spinning shapes (cube, torus, icosahedron) + 3D text "Hunter Dermott"
│   ├── animations/
│   │   ├── MatrixRain.ts        # Matrix rain effect for `matrix` command
│   │   └── GlitchEffect.ts      # Temporary shader distortion for `glitch` command
│   ├── data/
│   │   └── portfolio.ts         # Static portfolio content (bio, projects, experience, skills, contact)
│   └── styles/
│       ├── crt.css              # Phosphor green theme, glow effects, cursor blink
│       ├── terminal.css         # Terminal layout, scrollback, prompt styling
│       └── monitor.css          # CRT monitor bezel, screen container, LED indicator
├── public/
│   └── (static assets if needed)
├── vite.config.ts                # Vite configuration with GLSL plugin
├── tsconfig.json                 # TypeScript strict configuration
└── package.json
```

### 3.2 Module Responsibilities

| Module | Responsibility | Dependencies |
|--------|----------------|------------|
| `main.ts` | Orchestrates initialization order: CRT → Terminal → Three.js scene → animation loop | All other modules |
| `Terminal` | Renders prompt with username@hostname, captures keyboard input, maintains scrollback, blinking cursor | `OutputBuffer`, `CommandParser` |
| `CommandParser` | Tokenizes input, checks if command is portfolio or Linux, routes appropriately | `PortfolioCommands`, `LinuxEmulator` |
| `OutputBuffer` | Manages DOM elements for terminal output lines, auto-scrolls to bottom, handles `clear` | None |
| `PortfolioCommands` | Executes portfolio commands, pulls content from `data/portfolio.ts` | `OutputBuffer`, `portfolio data` |
| `LinuxEmulator` | Dispatches to individual Linux command handlers | `FileSystem`, `OutputBuffer` |
| `FileSystem` | In-memory JSON tree filesystem with path navigation, file/directory CRUD | None |
| `CRTShader` | Creates fullscreen WebGL canvas, compiles GLSL shaders, applies post-processing | GLSL files |
| `CRTOverlay` | CSS-based effects that complement shader: power LED, subtle flicker class toggle | None |
| `ASCIIRenderer` | Renders Three.js scene to offscreen canvas, samples pixels, maps brightness to ASCII | `SceneManager` |
| `SceneManager` | Initializes Three.js scene, camera, lights; runs requestAnimationFrame loop | `GeometryFactory` |
| `GeometryFactory` | Creates and updates spinning geometries + TextGeometry for "Hunter Dermott" | Three.js |

---

## 4. Data Flow

### 4.1 User Input Flow

```
User types in terminal input field
  → Terminal captures keydown (Enter key)
  → Terminal reads input value
  → Terminal echoes input to OutputBuffer with prompt
  → Terminal passes command string to CommandParser
  → CommandParser tokenizes input
  → CommandParser checks first token against:
      • Portfolio command list → routes to PortfolioCommands
      • Linux command list    → routes to LinuxEmulator
      • Neither               → returns error + help suggestion
  → Handler executes, writes result lines to OutputBuffer
  → Terminal renders new prompt, scrolls to bottom
```

### 4.2 Render Loop Flow

```
requestAnimationFrame loop (in main.ts or SceneManager)
  → SceneManager.update(): rotates geometries, updates camera
  → SceneManager.render(): renders Three.js scene to offscreen canvas
  → ASCIIRenderer.sample(): reads pixel data, maps to ASCII characters
  → ASCIIRenderer.updateDOM(): writes ASCII grid to background element
  → CRTShader.render(): applies post-processing to screen (if shader covers terminal area)
```

---

## 5. Commands Specification

### 5.1 Portfolio Commands

| Command | Aliases | Arguments | Description |
|---------|---------|-----------|-------------|
| `help` | `?`, `h` | None | Lists all available portfolio and Linux commands |
| `about` | `a`, `bio` | None | Displays personal bio, interests, location |
| `projects` | `proj`, `p` | `[--detail <name>]` | Lists all projects; with `--detail`, shows expanded info |
| `experience` | `exp`, `work` | None | Shows work history (reverse chronological) |
| `skills` | `sk` | None | Displays categorized technical skills |
| `contact` | `c` | `[--copy-email]` | Shows contact info; `--copy-email` copies email to clipboard |
| `clear` | `cls` | None | Clears terminal screen |
| `matrix` | None | None | Triggers Matrix rain animation overlay (decorative) |
| `glitch` | None | None | Triggers temporary CRT glitch effect |

### 5.2 Linux Emulated Commands

| Command | Description | Implementation Notes |
|-----------|-------------|----------------------|
| `ls` | List directory contents | Supports `-la` flags; shows files/dirs from FileSystem |
| `cd` | Change directory | Supports `.`, `..`, `~`, absolute and relative paths |
| `pwd` | Print working directory | Returns current path from FileSystem |
| `cat` | Concatenate and print files | Reads file content from FileSystem |
| `mkdir` | Make directories | Creates new directory in FileSystem |
| `touch` | Create empty files | Creates empty file in FileSystem |
| `rm` | Remove files/directories | Supports `-r` for recursive; operates on FileSystem |
| `echo` | Print text | Supports basic string output, limited variable expansion |
| `whoami` | Print current user | Returns "user" |
| `date` | Print date/time | Returns current JS Date in ISO-ish format |
| `uname` | Print system info | Returns "Linux" or similar |
| `history` | Show command history | Reads from Terminal command history |
| `clear` | Clear screen | Delegates to Terminal.clear() |

### 5.3 Error Handling

- **Unknown command:** `command not found: <cmd>. Type 'help' for available commands.`
- **Invalid arguments:** `Usage: <cmd> [args]`
- **Filesystem errors:** `No such file or directory`, `Permission denied`, `Is a directory`
- All errors printed in red/dim text (CSS class)

---

## 6. Visual Effects Specification

### 6.1 CRT Shader (WebGL/GLSL)

A fullscreen WebGL quad renders over the terminal area with a fragment shader implementing:

1. **Scanlines:** Horizontal lines at 1px intervals with `sin(y)`-based darkness modulation
2. **Barrel Distortion:** Subtle edge curvature using `distort = 1.0 - curvature * r^2`
3. **Chromatic Aberration:** Slight RGB channel separation at screen edges
4. **Vignette:** Darkening factor `1.0 - dot(uv, uv)` applied to corners
5. **Analog Noise:** Random grain via `fract(sin(dot(coord, vec2(12.9898,78.233))) * 43758.5453)`
6. **Flicker:** Per-frame random brightness modulation at low intensity
7. **Phosphor Glow:** Optional bloom via blur approximation

Uniforms: `u_time`, `u_resolution`, `u_flickerIntensity`, `u_glitchIntensity`

### 6.2 CRT Overlay (CSS/DOM)

Complementary CSS effects:

- **Text Glow:** `text-shadow: 0 0 2px currentColor, 0 0 5px currentColor, 0 0 10px currentColor`
- **Screen Curvature (CSS):** `border-radius` on screen container to simulate bezel
- **Power LED:** Small dot in monitor frame, slowly pulsing `opacity`
- **Occasional Flicker:** CSS class toggled randomly every 5-10s for 1-2 frames
- **Monitor Bezel:** Dark grey gradient with inset shadow to simulate depth

### 6.3 ASCII Art Background

Three.js renders a scene to a hidden `<canvas>`:

1. **Scene contents:** Rotating cube, torus knot, icosahedron + TextGeometry("Hunter Dermott")
2. **Rendering:** Scene rendered at low resolution (e.g., 120x80)
3. **Sampling:** Read pixel data, compute luminance `0.299*R + 0.587*G + 0.114*B`
4. **ASCII Mapping:** Map luminance (0-255) to characters from ` .':~"-=+<>iezsr*?#MB`
   (darkest → brightest)
5. **Display:** Write characters to a `<pre>` element behind terminal at very low opacity (5-10%)
6. **Animation:** Update every 2-3 frames for performance; shapes rotate continuously

### 6.4 Color Palette

| Element | Color | Notes |
|---------|-------|-------|
| Primary text | `#33ff33` | Phosphor green |
| Bright accent | `#66ff66` | Highlights, prompts |
| Dim text | `#1a8a1a` | Secondary info, timestamps |
| Background | `#050505` | Near-black |
| Screen bg | `#0a0a0a` | Slightly lighter for terminal area |
| Error text | `#ff3333` | Red for errors |
| Glow shadow | `#33ff33` | Text-shadow color |
| Monitor bezel | `#1a1a1a` to `#0d0d0d` | Dark grey gradient |

---

## 7. Content Structure

### 7.1 About
- Name: Hunter Dermott
- Role/Title
- Short paragraph bio
- Location
- Interests outside tech

### 7.2 Projects
3-5 projects. Each entry:
- Name
- One-line description
- Technologies used
- (Detail view) Longer description, challenges faced, links to live demo/source

### 7.3 Experience
Reverse chronological. Each entry:
- Company/Organization name
- Role/Title
- Dates (start - end or present)
- 2-3 bullet points describing responsibilities/achievements

### 7.4 Skills
Categorized groups:
- Languages
- Frameworks/Tools
- Other (databases, platforms, etc.)
Displayed as formatted multi-column or grouped list

### 7.5 Contact
- Email address
- GitHub username/link
- LinkedIn profile
- `contact --copy-email` copies email to clipboard with confirmation message

---

## 8. Performance Considerations

1. **ASCII Renderer:** Only update every 2-3 frames (not every frame); use low-res offscreen canvas
2. **CRT Shader:** Use a single fullscreen quad, minimal geometry; fragment shader is GPU-parallel
3. **Three.js:** Disable antialiasing on offscreen canvas; limit geometries to <1000 vertices
4. **DOM:** Use DocumentFragment for batch terminal output updates; recycle DOM nodes where possible
5. **Animation Loop:** Use a single `requestAnimationFrame` loop for all animations
6. **Memory:** Clean up Three.js geometries/materials on dispose; avoid memory leaks in terminal scrollback (optional: cap scrollback to 1000 lines)

---

## 9. Accessibility Notes

- Terminal must be keyboard-navigable (Tab to focus, Enter to submit)
- Consider adding `aria-live="polite"` region for screen reader announcements of command output
- Provide high-contrast mode toggle (optional) for users sensitive to glow effects
- Ensure cursor is visible and blinking at a comfortable rate

---

## 10. Future Enhancements (Out of Scope)

- Sound effects (typing, power-on hum, disk access)
- Boot sequence animation on page load
- Additional Three.js ASCII scenes (different geometries)
- File upload/download in Linux emulator (create portfolio files)
- Multi-language support
- Mobile/responsive adaptation (tablet with on-screen keyboard)

---

## 11. Self-Review Checklist

- [x] **Placeholder scan:** No TBD, TODO, or incomplete sections.
- [x] **Internal consistency:** Architecture matches feature descriptions; module responsibilities are clear and non-overlapping.
- [x] **Scope check:** Focused on a single implementation cycle. Linux VM is lightweight emulator (not real VM). Three.js is limited to ASCII art background.
- [x] **Ambiguity check:** Commands are explicitly listed with args and behavior. Visual effects have concrete technical specifications.

---

## 12. Approval

**Design approved by:** User (Hunter Dermott)
**Date:** 2026-05-28
**Notes:** Approved to proceed to implementation planning.

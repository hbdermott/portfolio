export const TERMINAL_CONFIG = {
  width: 1024,
  height: 768,
  fontSize: 16,
  lineHeight: 20,
  padding: 24,
  blinkInterval: 530,
  idleTimeout: 30000,
} as const;

export const SHUTDOWN_TIMING = {
  showMs: 750,
  closeMs: 125,
  totalMs: 2500,
} as const;

export const CRT_EFFECTS = {
  vignette: 0.6,
  scanline: 0.7,
  aperture: 0.3,
  chromatic: 0.5,
  noise: 1,
  flicker: 0.3,
  chromaticFrameSkip: 2,
} as const;

export const THEME = {
  text: '#33ff33',
  dim: '#1a8a1a',
  error: '#ff3333',
  cyan: '#33ffff',
  yellow: '#ffff33',
  magenta: '#ff33ff',
  orange: '#ff9933',
  white: '#ffffff',
  blue: '#3388ff',
  bg: '#444444',
} as const;

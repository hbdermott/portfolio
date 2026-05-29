import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [glsl()],
  server: {
    port: 3000,
    open: true,
    // Disable HMR for Three.js projects — forces full page reload on any change.
    // HMR leaves orphaned WebGL contexts, event listeners, and animation loops.
    hmr: false,
  },
});

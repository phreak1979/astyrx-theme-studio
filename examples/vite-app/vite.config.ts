import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Optional: tells Theme Studio which @astryxdesign/core version is installed. Loaded defensively so a
// build where the dev dependency is not installed (e.g. `npm ci --omit=dev`) still works.
async function studioVersionPlugin() {
  try {
    const { astryxThemeStudio } = await import('astryx-theme-studio/vite');
    return astryxThemeStudio();
  } catch {
    return null;
  }
}

export default defineConfig(async () => ({
  plugins: [react(), await studioVersionPlugin()],
  server: { port: 5199, strictPort: true },
  preview: { port: 5198, strictPort: true },
}));

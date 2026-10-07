import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { astryxThemeStudio } from 'astryx-theme-studio/vite';

export default defineConfig({
  // `astryxThemeStudio()` tells the studio which @astryxdesign/core version is installed.
  plugins: [react(), astryxThemeStudio()],
  server: { port: 5199, strictPort: true },
  preview: { port: 5198, strictPort: true },
});

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { dev: 'src/dev/entry.ts', vite: 'src/vite.ts' },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  target: 'es2022',
  external: ['node:fs', 'node:module', 'node:path', 'react', 'react-dom', 'react/jsx-runtime', 'react-dom/client', '@astryxdesign/core'],
  esbuildOptions(o) {
    o.jsx = 'automatic';
  },
});

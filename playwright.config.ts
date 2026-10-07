import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: { headless: true, viewport: { width: 1280, height: 800 } },
  webServer: [
    { command: 'npm run dev -w examples/vite-app', url: 'http://localhost:5199', reuseExistingServer: true, timeout: 60_000 },
    {
      command: 'npm run build -w examples/vite-app && npm run preview -w examples/vite-app',
      url: 'http://localhost:5198',
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});

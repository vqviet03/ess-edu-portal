import { defineConfig } from '@playwright/test';
const port = Number(process.env.PORT ?? 4173);
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export default defineConfig({
  testDir: './tests', testMatch: '*.spec.ts', timeout: 35000, fullyParallel: false, workers: 1,
  use: {baseURL: `http://127.0.0.1:${port}${basePath}/`, headless: true, launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {}},
  webServer: {command: 'npm run preview', url: `http://127.0.0.1:${port}${basePath}/login/`, reuseExistingServer: !process.env.CI, timeout: 30000},
});

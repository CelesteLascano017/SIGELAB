import { defineConfig, devices } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Load .env.local into the test process (never printed). The dev server loads it on its own.
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch { /* no .env.local */ }

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3100', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'es-EC', timezoneId: 'America/Guayaquil', trace: 'retain-on-failure' },
  projects: [{ name: 'mobile-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } }],
  webServer: { command: 'npx next dev -p 3100', url: 'http://localhost:3100/login', reuseExistingServer: true, timeout: 120_000 },
})

import { defineConfig, devices } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Local values override .env; environment variables supplied by CI remain authoritative.
for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
    }
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
}
const existingServer = process.env.PLAYWRIGHT_BASE_URL

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: existingServer ?? 'http://localhost:3100', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'es-EC', timezoneId: 'America/Guayaquil', trace: 'retain-on-failure' },
  projects: [{ name: 'mobile-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } }],
  webServer: existingServer ? undefined : { command: 'npx next dev -p 3100', url: 'http://localhost:3100/login', reuseExistingServer: true, timeout: 120_000 },
})

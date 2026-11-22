import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
// LIVE tests: run against the real SIGELAB Supabase project (guarded by tests/live/guard.ts).
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { include: ['tests/live/**/*.live.ts'], testTimeout: 60000, hookTimeout: 60000, fileParallelism: false },
})

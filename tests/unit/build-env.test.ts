import { expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const script = resolve('scripts/check-build-env.mjs')
function check(env: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'sigelab-env-'))
  try { return spawnSync(process.execPath, [script], { cwd: dir, env: { NODE_ENV: 'production', ...env }, encoding: 'utf8' }) }
  finally { rmSync(dir, { recursive: true, force: true }) }
}

it('accepts build configuration without printing its values', () => {
  const result = check({ NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_fixture' })
  expect(result.status).toBe(0)
  expect(result.stdout + result.stderr).not.toContain('sb_publishable_fixture')
})
it.each([
  [{ NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_fixture' }, 'NEXT_PUBLIC_SUPABASE_URL'],
  [{ NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' }, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  [{ NEXT_PUBLIC_SUPABASE_URL: 'not-a-url', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_fixture' }, 'NEXT_PUBLIC_SUPABASE_URL'],
] as [Record<string, string>, string][])('fails an incomplete or invalid build before creating an unusable Worker', (env, field) => {
  const result = check(env)
  expect(result.status).not.toBe(0)
  expect(result.stderr).toContain(field)
  expect(result.stderr).not.toContain('sb_publishable_fixture')
})

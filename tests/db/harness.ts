import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '..', '..')

export const IDS = {
  prof: '00000000-0000-0000-0000-0000000000a1',
  prof2: '00000000-0000-0000-0000-0000000000a2',
  student: '00000000-0000-0000-0000-0000000000b1',
  admin: '00000000-0000-0000-0000-0000000000c1',
} as const

/** Local PostgreSQL (PGlite) with a minimal stub of Supabase's auth schema and roles. */
export async function createDb() {
  const db = new PGlite()
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_app_meta_data jsonb default '{}', raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant usage on schema public to anon, authenticated;
  `)
  const dir = join(root, 'supabase', 'migrations')
  for (const f of readdirSync(dir).sort()) await db.exec(readFileSync(join(dir, f), 'utf8'))
  await db.exec(readFileSync(join(root, 'supabase', 'seed.sql'), 'utf8'))
  const users: [string, string, string][] = [
    [IDS.prof, 'prof@epn.edu.ec', 'professor'], [IDS.prof2, 'prof2@epn.edu.ec', 'professor'],
    [IDS.student, 'est@epn.edu.ec', 'student'], [IDS.admin, 'admin@epn.edu.ec', 'admin'],
  ]
  for (const [id, email, role] of users)
    await db.query(`insert into auth.users (id,email,raw_app_meta_data) values ($1,$2,$3)`, [id, email, JSON.stringify({ role })])
  return db
}

export type Db = Awaited<ReturnType<typeof createDb>>

/** Run `fn` as an authenticated user (RLS enforced) and always reset the session afterwards. */
export async function as<T>(db: Db, userId: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${userId}',false)`)
  try { return await fn() } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub','',false)`) }
}

export async function labId(db: Db, code: string) {
  return (await db.query<{ id: string }>(`select id from public.labs where code=$1`, [code])).rows[0].id
}

/** A future Wednesday (no seeded classes) as ISO date. */
export function futureWednesday(weeksAhead = 2) {
  const d = new Date(); d.setUTCDate(d.getUTCDate() + weeksAhead * 7)
  while (d.getUTCDay() !== 3) d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}
export function futureTuesday(weeksAhead = 2) {
  const d = new Date(futureWednesday(weeksAhead)); d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

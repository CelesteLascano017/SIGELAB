/** Read-only verification of the real SIGELAB project (no writes). Run: npm run verify:supabase */
import { createClient } from '@supabase/supabase-js'
import { sigelabEnv, SIGELAB_REF } from '../tests/live/guard.ts'
const { url, service, anon } = sigelabEnv()
console.log('Project ref verified:', SIGELAB_REF)
const h = (k: string) => ({ apikey: k, Prefer: 'count=exact' })
const TABLES = ['profiles', 'labs', 'time_slots', 'class_schedules', 'lab_unavailability', 'reservation_requests', 'request_status_history', 'notifications']
let bad = 0
const ok = (c: boolean, m: string) => { console.log(`${c ? 'OK   ' : 'FALLA'} ${m}`); if (!c) bad++ }
// Data access uses the demo admin's session (RLS applies); the secret key is never used for PostgREST.
const admin = createClient(url, anon, { auth: { persistSession: false } })
const login = await admin.auth.signInWithPassword({ email: 'jorge.vasconez@epn.edu.ec', password: process.env.DEMO_PASSWORD ?? '' })
ok(!login.error, 'login administrador demo')
const counts: Record<string, number | null> = {}
for (const t of TABLES) {
  const r = await admin.from(t).select('*', { count: 'exact', head: true })
  counts[t] = r.count
  ok(!r.error, `tabla ${t} accesible (${r.count} filas)`)
}
const spec = await (await fetch(`${url}/rest/v1/`, { headers: { apikey: service } })).json()
const rpcs = Object.keys(spec.paths ?? {}).filter((p) => p.startsWith('/rpc/')).map((p) => p.slice(5))
for (const f of ['create_reservation_request', 'approve_reservation_request', 'reject_reservation_request', 'cancel_reservation_request', 'list_reservations_admin', 'get_availability', 'slot_status'])
  ok(rpcs.includes(f), `función RPC ${f}`)
ok(counts.labs === 8, 'labs = 8 filas')
ok(counts.time_slots === 7, 'time_slots = 7 filas')
// anon (publishable key, no session) must be locked out of every table and function
for (const t of TABLES) {
  const r = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, { headers: { apikey: anon } })
  const rows = r.ok ? await r.json() : null
  ok(!r.ok || (Array.isArray(rows) && rows.length === 0), `anon sin acceso a ${t} (${r.status})`)
}
const a = await fetch(`${url}/rest/v1/rpc/get_availability`, { method: 'POST', headers: { apikey: anon, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_date: '2030-01-01' }) })
ok(!a.ok, `anon no puede ejecutar get_availability (${a.status})`)
process.exit(bad ? 1 : 0)

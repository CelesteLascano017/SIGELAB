/**
 * Creates demo users and a few requests in the NEW SIGELAB Supabase project.
 * Usage: npm run seed:demo   (reads .env.local)
 * Safety: refuses to run unless SIGELAB_EXPECTED_PROJECT_REF is set and matches the URL.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const expectedRef = process.env.SIGELAB_EXPECTED_PROJECT_REF
if (!url || !anon || !service || !expectedRef) throw new Error('Missing env vars. See .env.example')
const ref = new URL(url).hostname.split('.')[0]
if (ref !== expectedRef || expectedRef.includes('<')) throw new Error(`Project ref mismatch: URL has "${ref}", expected "${expectedRef}". Aborting.`)

const PASSWORD = process.env.DEMO_PASSWORD ?? ''
if (PASSWORD.length < 12 || PASSWORD.includes('<')) throw new Error('Set DEMO_PASSWORD (>= 12 chars) in .env.local')
const admin = createClient(url, service, { auth: { persistSession: false } })
const USERS = [
  { email: 'ana.martinez@epn.edu.ec', name: 'Ana Martínez', role: 'student' },
  { email: 'carla.mendoza@epn.edu.ec', name: 'Ing. Carla Mendoza', role: 'professor' },
  { email: 'diego.salazar@epn.edu.ec', name: 'Ing. Diego Salazar', role: 'professor' },
  { email: 'jorge.vasconez@epn.edu.ec', name: 'Jorge Vásconez', role: 'admin' },
]

async function signedIn(email: string) {
  const c = createClient(url!, anon!, { auth: { persistSession: false } })
  const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD })
  if (error) throw error
  return c
}
const nextWeekday = (isoDow: number, minDays = 3) => { // ISO dow: 1=Mon
  const d = new Date(); d.setUTCDate(d.getUTCDate() + minDays)
  while (((d.getUTCDay() + 6) % 7) + 1 !== isoDow) d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

async function main() {
  for (const u of USERS) {
    const { error } = await admin.auth.admin.createUser({
      email: u.email, password: PASSWORD, email_confirm: true,
      user_metadata: { full_name: u.name }, app_metadata: { role: u.role }, // role only via app_metadata (server-side)
    })
    if (error && !/already/i.test(error.message)) throw error
    console.log(error ? `exists  ${u.email}` : `created ${u.email} (${u.role})`)
  }
  // The secret key is used ONLY for the Auth admin API (create users). All data access goes through
  // real user sessions, so RLS applies exactly as in production.
  const carla = await signedIn('carla.mendoza@epn.edu.ec')
  const diego = await signedIn('diego.salazar@epn.edu.ec')
  const jorge = await signedIn('jorge.vasconez@epn.edu.ec')
  // Idempotency: never duplicate or overwrite requests. Seed requests only into an empty table (admin sees all rows).
  const { count, error: countErr } = await jorge.from('reservation_requests').select('id', { count: 'exact', head: true })
  if (countErr) throw countErr
  if ((count ?? 0) > 0) { console.log(`Requests already exist (${count}); skipping request seed. Nothing deleted.`); return }
  const { data: labs, error: labsErr } = await carla.from('labs').select('id, code')
  if (labsErr) throw labsErr
  const lab = (code: string) => labs!.find((l) => l.code === code)!.id
  const wed = nextWeekday(3)
  const mk = (c: typeof carla, labCode: string, slot: number, type: string, n: number, reason: string) =>
    c.rpc('create_reservation_request', { p_lab_id: lab(labCode), p_date: wed, p_slot_id: slot, p_type: type, p_attendees: n, p_reason: reason })

  const a = await mk(carla, 'LAB-02', 4, 'exam', 20, 'Examen supletorio de Ingeniería de Software')
  const b = await mk(diego, 'LAB-02', 4, 'cultural_event', 20, 'Presentación del club de robótica') // conflicts with a
  const c = await mk(carla, 'LAB-03', 1, 'exam', 20, 'Examen práctico del segundo bimestre de Redes')
  const d = await mk(diego, 'LAB-06', 2, 'cultural_event', 16, 'Taller abierto de introducción a visión por computador')
  const e = await mk(carla, 'LAB-01', 6, 'class_recovery', 25, 'Recuperación de clase de Programación II')
  const f = await mk(carla, 'LAB-04', 5, 'exam', 20, 'Examen de recuperación de Sistemas Operativos')
  for (const r of [a, b, c, d, e, f]) if (r.error) throw r.error
  await carla.rpc('cancel_reservation_request', { p_request_id: f.data.id })
  await jorge.rpc('approve_reservation_request', { p_request_id: a.data.id })
  await jorge.rpc('reject_reservation_request', { p_request_id: d.data.id, p_reason: 'El laboratorio estará en mantenimiento preventivo de las estaciones GPU esa mañana.' })
  console.log('Demo data ready. Demo password is DEMO_PASSWORD in your .env.local')
}
main().catch((e) => { console.error(e); process.exit(1) })

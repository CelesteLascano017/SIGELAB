import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { sigelabEnv } from './guard'

export const DEMO = {
  student: 'ana.martinez@epn.edu.ec', prof: 'carla.mendoza@epn.edu.ec',
  prof2: 'diego.salazar@epn.edu.ec', admin: 'jorge.vasconez@epn.edu.ec',
} as const

export async function signIn(email: string): Promise<SupabaseClient> {
  const { url, anon } = sigelabEnv()
  const c = createClient(url, anon, { auth: { persistSession: false } })
  const { error } = await c.auth.signInWithPassword({ email, password: process.env.DEMO_PASSWORD ?? '' })
  if (error) throw new Error(`login failed for ${email}: ${error.message}`)
  return c
}
export function anonClient() { const { url, anon } = sigelabEnv(); return createClient(url, anon, { auth: { persistSession: false } }) }

/** ISO date of a Wednesday `weeks` weeks ahead (labs have no weekly class on Wednesday). */
export function wednesday(weeks: number) {
  const d = new Date(); d.setUTCDate(d.getUTCDate() + weeks * 7)
  while (d.getUTCDay() !== 3) d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}
export const TAG = '[live-test]'

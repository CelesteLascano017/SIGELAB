'use server'

import { requireUser } from '@/lib/auth'
import { parseLabQr } from '@/lib/domain/qr'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export async function resolveLabQrAction(raw: unknown): Promise<ActionResult<{ href: string }>> {
  await requireUser()
  const parsed = parseLabQr(raw)
  if (!parsed.ok) return parsed
  const db = await createClient()
  const { data, error } = await db.from('labs').select('id').eq('code', parsed.code).maybeSingle()
  if (error) return { ok: false, error: 'No pudimos consultar el laboratorio. Comprueba tu conexión y reintenta.' }
  if (!data) return { ok: false, error: `El laboratorio ${parsed.code} no está registrado.` }
  return { ok: true, data: { href: `/laboratories/${data.id}` } }
}

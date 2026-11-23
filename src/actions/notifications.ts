'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { markNotificationsRead } from '@/services/requests'
import type { ActionResult } from '@/types'

export async function markNotificationsReadAction(ids: unknown): Promise<ActionResult> {
  await requireUser()
  const parsed = z.array(z.string().uuid()).max(30).safeParse(ids)
  if (!parsed.success) return { ok: false, error: 'No pudimos actualizar las notificaciones seleccionadas.' }
  try {
    await markNotificationsRead(await createClient(), parsed.data)
    revalidatePath('/notifications')
    return { ok: true }
  } catch { return { ok: false, error: 'No pudimos marcar estas notificaciones como leídas.' } }
}

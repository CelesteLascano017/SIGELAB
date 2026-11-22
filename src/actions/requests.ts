'use server'
import { revalidatePath } from 'next/cache'
import { requireRole, requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { dbErrorMessage } from '@/lib/domain/errors'
import { fieldErrors, rejectionSchema, reservationInputSchema, capacityError } from '@/lib/validation/reservation'
import { getAvailability } from '@/services/availability'
import { isValidIsoDate } from '@/lib/domain/labels'
import { getLab } from '@/services/labs'
import { approveRequest, cancelRequest, createRequest, rejectRequest } from '@/services/requests'
import type { ActionResult, AvailabilityCell } from '@/types'

function revalidateAll() {
  for (const p of ['/availability', '/my-requests', '/admin/requests', '/admin/reservations', '/notifications']) revalidatePath(p)
  revalidatePath('/my-requests/[id]', 'page')
  revalidatePath('/laboratories/[id]', 'page')
}

export async function createRequestAction(raw: unknown): Promise<ActionResult<{ code: string; status: string }>> {
  await requireRole('professor') // enforced again in the database
  const parsed = reservationInputSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Revisa los campos del formulario.', fieldErrors: fieldErrors(parsed.error) }
  const db = await createClient()
  const lab = await getLab(db, parsed.data.labId)
  if (!lab) return { ok: false, error: 'El laboratorio seleccionado no existe.' }
  const capErr = capacityError(parsed.data.attendees, lab.capacity)
  if (capErr) return { ok: false, error: capErr, fieldErrors: { attendees: capErr } }
  try {
    const row = await createRequest(db, parsed.data)
    revalidateAll()
    return { ok: true, data: { code: row.code, status: row.status } }
  } catch (e) {
    return { ok: false, error: dbErrorMessage((e as Error).message) }
  }
}

export async function fetchAvailabilityAction(date: string): Promise<AvailabilityCell[]> {
  await requireUser()
  if (!isValidIsoDate(date)) return []
  return getAvailability(await createClient(), date)
}

export async function approveRequestAction(id: string): Promise<ActionResult> {
  await requireRole('admin')
  try { await approveRequest(await createClient(), id); revalidateAll(); return { ok: true } }
  catch (e) { return { ok: false, error: dbErrorMessage((e as Error).message) } }
}

export async function rejectRequestAction(id: string, reason: string): Promise<ActionResult> {
  await requireRole('admin')
  const parsed = rejectionSchema.safeParse({ requestId: id, reason })
  if (!parsed.success) return { ok: false, error: 'Debes indicar el motivo del rechazo.', fieldErrors: fieldErrors(parsed.error) }
  try { await rejectRequest(await createClient(), parsed.data.requestId, parsed.data.reason); revalidateAll(); return { ok: true } }
  catch (e) { return { ok: false, error: dbErrorMessage((e as Error).message) } }
}

export async function cancelRequestAction(id: string): Promise<ActionResult> {
  await requireRole('professor')
  try { await cancelRequest(await createClient(), id); revalidateAll(); return { ok: true } }
  catch (e) { return { ok: false, error: dbErrorMessage((e as Error).message) } }
}

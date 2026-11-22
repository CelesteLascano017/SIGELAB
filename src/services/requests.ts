import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminReservation, AppNotification, RequestStatus, RequestWithLab, StatusHistoryEntry } from '@/types'
import type { ReservationInput } from '@/lib/validation/reservation'

const SELECT = 'id, code, requester_id, lab_id, date, slot_id, reservation_type, attendees, reason, status, rejection_reason, reviewed_at, created_at, lab:labs(id, code, name, capacity)'

export class DbError extends Error {}

export async function createRequest(db: SupabaseClient, input: ReservationInput) {
  const { data, error } = await db.rpc('create_reservation_request', {
    p_lab_id: input.labId, p_date: input.date, p_slot_id: input.slotId,
    p_type: input.type, p_attendees: input.attendees, p_reason: input.reason,
  })
  if (error) throw new DbError(error.message)
  return data as { id: string; code: string; status: RequestStatus }
}

/** RLS limits the result to the signed-in professor's own requests (admins see all). */
export async function listMyRequests(db: SupabaseClient, userId: string, status?: RequestStatus): Promise<RequestWithLab[]> {
  let q = db.from('reservation_requests').select(SELECT).eq('requester_id', userId).order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as RequestWithLab[]
}

/** Returns null when the request does not exist OR belongs to someone else (RLS hides it). */
export async function getRequestDetail(db: SupabaseClient, id: string) {
  const { data, error } = await db.from('reservation_requests').select(SELECT).eq('id', id).maybeSingle()
  if (error || !data) return null
  const { data: history } = await db.from('request_status_history')
    .select('id, from_status, to_status, reason, changed_at').eq('request_id', id).order('changed_at')
  return { request: data as unknown as RequestWithLab, history: (history ?? []) as StatusHistoryEntry[] }
}

async function rpc(db: SupabaseClient, fn: string, args: Record<string, unknown>) {
  const { error } = await db.rpc(fn, args)
  if (error) throw new DbError(error.message)
}
export const approveRequest = (db: SupabaseClient, id: string) => rpc(db, 'approve_reservation_request', { p_request_id: id })
export const rejectRequest = (db: SupabaseClient, id: string, reason: string) => rpc(db, 'reject_reservation_request', { p_request_id: id, p_reason: reason })
export const cancelRequest = (db: SupabaseClient, id: string) => rpc(db, 'cancel_reservation_request', { p_request_id: id })

export async function listAdminReservations(db: SupabaseClient): Promise<AdminReservation[]> {
  const { data, error } = await db.rpc('list_reservations_admin')
  if (error) throw new DbError(error.message)
  return (data ?? []) as AdminReservation[]
}

export async function listNotifications(db: SupabaseClient, limit = 30): Promise<AppNotification[]> {
  const { data } = await db.from('notifications').select('id, request_id, message, read, created_at').order('created_at', { ascending: false }).limit(limit)
  return (data ?? []) as AppNotification[]
}
export async function unreadCount(db: SupabaseClient): Promise<number> {
  const { count } = await db.from('notifications').select('id', { count: 'exact', head: true }).eq('read', false)
  return count ?? 0
}
export async function markAllRead(db: SupabaseClient) {
  await db.from('notifications').update({ read: true }).eq('read', false)
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lab, TimeSlot } from '@/types'

const LAB_COLUMNS = 'id, code, name, building, floor, room, capacity, computers_count, has_projector, software, extra_equipment'

export async function listLabs(db: SupabaseClient): Promise<Lab[]> {
  const { data, error } = await db.from('labs').select(LAB_COLUMNS).order('code')
  if (error) throw new Error(error.message)
  return (data ?? []) as Lab[]
}
export async function getLab(db: SupabaseClient, id: string): Promise<Lab | null> {
  const { data, error } = await db.from('labs').select(LAB_COLUMNS).eq('id', id).maybeSingle()
  if (error) return null // e.g. malformed uuid
  return data as Lab | null
}
export async function listTimeSlots(db: SupabaseClient): Promise<TimeSlot[]> {
  const { data, error } = await db.from('time_slots').select('id, start_time, end_time').order('id')
  if (error) throw new Error(error.message)
  return (data ?? []) as TimeSlot[]
}

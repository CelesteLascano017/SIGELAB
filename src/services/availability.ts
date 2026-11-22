import type { SupabaseClient } from '@supabase/supabase-js'
import type { AvailabilityCell } from '@/types'

export async function getAvailability(db: SupabaseClient, date: string): Promise<AvailabilityCell[]> {
  const { data, error } = await db.rpc('get_availability', { p_date: date })
  if (error) throw new Error(error.message)
  return (data ?? []) as AvailabilityCell[]
}

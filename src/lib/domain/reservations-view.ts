import type { AdminReservation, RequestStatus } from '@/types'

export interface ReservationFilters { labId?: string; status?: RequestStatus | 'all'; onlyConflicts?: boolean; q?: string }

/** Filters for HU-04 (lab, status, conflicts) plus free-text search. */
export function filterReservations(items: AdminReservation[], f: ReservationFilters): AdminReservation[] {
  const q = f.q?.trim().toLowerCase()
  return items.filter((r) => {
    if (f.labId && r.lab_id !== f.labId) return false
    if (f.status && f.status !== 'all' && r.status !== f.status) return false
    if (f.onlyConflicts && !r.has_conflict) return false
    if (q && ![r.code, r.requester_name, r.reason, r.lab_name].join(' ').toLowerCase().includes(q)) return false
    return true
  })
}

export function statusCounts(items: AdminReservation[]) {
  const c = { all: items.length, pending: 0, approved: 0, rejected: 0, cancelled: 0 }
  for (const r of items) c[r.status]++
  return c
}

export function groupByDate(items: AdminReservation[]): [string, AdminReservation[]][] {
  const m = new Map<string, AdminReservation[]>()
  for (const r of items) m.set(r.date, [...(m.get(r.date) ?? []), r])
  return [...m.entries()].sort(([a], [b]) => a.localeCompare(b))
}

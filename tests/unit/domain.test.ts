import { describe, it, expect } from 'vitest'
import { equipmentNotice, filterLabs, needsLaptop, NO_INFO } from '@/lib/domain/laboratories'
import { filterAvailable, groupAvailability } from '@/lib/domain/availability'
import { filterReservations, statusCounts } from '@/lib/domain/reservations-view'
import { capacityError, rejectionSchema, reservationInputSchema } from '@/lib/validation/reservation'
import { dbErrorMessage } from '@/lib/domain/errors'
import { addDays, isValidIsoDate, todayLocal } from '@/lib/domain/labels'
import type { AdminReservation, AvailabilityCell, Lab } from '@/types'

const lab = (o: Partial<Lab> = {}): Lab => ({ id: 'l1', code: 'LAB-03', name: 'Lab. Redes', building: 'FIS', floor: 'PB', room: 'A-105', capacity: 24, computers_count: 12, has_projector: true, software: null, extra_equipment: null, ...o })

describe('HU-01 equipment notice & filters', () => {
  it('warns when PCs < capacity', () => {
    const n = equipmentNotice(lab())
    expect(n.tone).toBe('warning'); expect(n.title).toContain('Hay 12 PCs para 24 personas')
  })
  it('shows "Sin información" notice when computers are unregistered', () => {
    expect(equipmentNotice(lab({ computers_count: null })).tone).toBe('info')
    expect(NO_INFO).toBe('Sin información registrada')
  })
  it('no laptop needed when PCs cover capacity', () => {
    expect(equipmentNotice(lab({ computers_count: 30, capacity: 30 })).tone).toBe('ok')
    expect(needsLaptop(lab({ computers_count: 30, capacity: 30 }))).toBe(false)
  })
  const labs = [lab(), lab({ id: 'l2', name: 'Sala Multimedia', code: 'LAB-07', computers_count: null }), lab({ id: 'l3', name: 'Lab. AI', computers_count: 16, capacity: 16, software: ['PyTorch'] })]
  it('filters by text/software and by laptop/computers', () => {
    expect(filterLabs(labs, 'pytorch', 'all')).toHaveLength(1)
    expect(filterLabs(labs, '', 'laptop')).toHaveLength(1)
    expect(filterLabs(labs, '', 'computers')).toHaveLength(2)
    expect(filterLabs([], '', 'all')).toHaveLength(0)
  })
})

describe('HU-02 availability filter', () => {
  const labs = [lab({ id: 'a', capacity: 10 }), lab({ id: 'b' })]
  const cells: AvailabilityCell[] = [
    { lab_id: 'a', slot_id: 1, status: 'free', reserved_code: null }, { lab_id: 'a', slot_id: 2, status: 'reserved', reserved_code: 'SOL-1' },
    { lab_id: 'b', slot_id: 1, status: 'class', reserved_code: null }, { lab_id: 'b', slot_id: 2, status: 'requested', reserved_code: null },
  ]
  const items = groupAvailability(labs, cells)
  it('counts labs with a free slot', () => { expect(filterAvailable(items)).toHaveLength(1) })
  it('respects the selected slot', () => {
    expect(filterAvailable(items, 1).map((i) => i.lab.id)).toEqual(['a'])
    expect(filterAvailable(items, 2)).toHaveLength(0) // → "No hay laboratorios disponibles"
  })
})

describe('HU-03 validation', () => {
  const ok = { labId: '3f2c1c0e-5b7a-4c1e-9d3a-1b2c3d4e5f60', date: '2026-12-02', slotId: 4, type: 'exam', attendees: 10, reason: 'Examen' }
  it('accepts valid input', () => { expect(reservationInputSchema.safeParse(ok).success).toBe(true) })
  it.each([['labId', ''], ['date', ''], ['slotId', 0], ['type', 'x'], ['attendees', 0], ['reason', '   ']])('requires %s', (k, v) => {
    expect(reservationInputSchema.safeParse({ ...ok, [k]: v }).success).toBe(false)
  })
  it('capacity rule', () => {
    expect(capacityError(31, 30)).toContain('supera la capacidad')
    expect(capacityError(30, 30)).toBeNull()
  })
})

describe('HU-06 rejection reason', () => {
  const id = '3f2c1c0e-5b7a-4c1e-9d3a-1b2c3d4e5f60'
  it('is mandatory', () => {
    expect(rejectionSchema.safeParse({ requestId: id, reason: '  ' }).success).toBe(false)
    expect(rejectionSchema.safeParse({ requestId: id, reason: 'Mantenimiento' }).success).toBe(true)
  })
})

describe('HU-04 reservation filters', () => {
  const r = (o: Partial<AdminReservation>): AdminReservation => ({ id: 'x', code: 'SOL-1', requester_name: 'Carla', lab_id: 'a', lab_name: 'Lab A', lab_code: 'LAB-01', date: '2026-12-02', slot_id: 1, reservation_type: 'exam', attendees: 5, reason: 'm', status: 'pending', created_at: '', has_conflict: false, is_blocked: false, ...o })
  const rows = [r({ id: '1', status: 'approved', has_conflict: true }), r({ id: '2', lab_id: 'b', has_conflict: true }), r({ id: '3', status: 'rejected' })]
  it('filters by lab, status and conflicts and counts by status', () => {
    expect(filterReservations(rows, { labId: 'b' })).toHaveLength(1)
    expect(filterReservations(rows, { status: 'approved' })).toHaveLength(1)
    expect(filterReservations(rows, { onlyConflicts: true })).toHaveLength(2)
    expect(statusCounts(rows)).toMatchObject({ all: 3, pending: 1, approved: 1, rejected: 1 })
  })
})

describe('helpers', () => {
  it('maps DB error codes to Spanish messages', () => {
    expect(dbErrorMessage('SLOT_UNAVAILABLE')).toContain('no está disponible')
    expect(dbErrorMessage('boom')).toContain('inesperado')
  })
  it('date helpers', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(isValidIsoDate('2026-13-45')).toBe(false)
    expect(todayLocal(new Date('2026-11-21T03:00:00Z'))).toBe('2026-11-20') // Ecuador is UTC-5
  })
})

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { anonClient, DEMO, signIn, TAG, wednesday } from './helpers'
import { sigelabEnv } from './guard'

let student: SupabaseClient, prof: SupabaseClient, prof2: SupabaseClient, admin: SupabaseClient
let labs: { id: string; code: string; capacity: number }[]
const created: { id: string; by: SupabaseClient }[] = []
const lab = (code: string) => labs.find((l) => l.code === code)!
// Far-future slots dedicated to these tests; everything created is cancelled in afterAll.
const D = wednesday(20)

const create = async (c: SupabaseClient, labCode: string, date: string, slot: number, n = 5, reason = `${TAG} prueba`) => {
  const r = await c.rpc('create_reservation_request', { p_lab_id: lab(labCode).id, p_date: date, p_slot_id: slot, p_type: 'exam', p_attendees: n, p_reason: reason })
  if (!r.error) created.push({ id: r.data.id, by: c })
  return r
}

beforeAll(async () => {
  sigelabEnv()
  ;[student, prof, prof2, admin] = await Promise.all([signIn(DEMO.student), signIn(DEMO.prof), signIn(DEMO.prof2), signIn(DEMO.admin)])
  labs = (await student.from('labs').select('id, code, capacity')).data!
})
afterAll(async () => { for (const r of created) await r.by.rpc('cancel_reservation_request', { p_request_id: r.id }) })

describe('LIVE · auth & roles', () => {
  it('each demo account has the right role in profiles (assigned server-side)', async () => {
    const role = async (c: SupabaseClient) => { const u = (await c.auth.getUser()).data.user!; return (await c.from('profiles').select('role').eq('id', u.id).single()).data!.role }
    expect(await role(student)).toBe('student'); expect(await role(prof)).toBe('professor')
    expect(await role(prof2)).toBe('professor'); expect(await role(admin)).toBe('admin')
  })
  it('a user cannot change their own role', async () => {
    const u = (await prof.auth.getUser()).data.user!
    await prof.from('profiles').update({ role: 'admin' }).eq('id', u.id)
    expect((await prof.from('profiles').select('role').eq('id', u.id).single()).data!.role).toBe('professor')
  })
  it('user_metadata cannot grant roles (role stays in app_metadata)', async () => {
    await prof.auth.updateUser({ data: { role: 'admin' } })
    const u = (await prof.auth.getUser()).data.user!
    expect((await prof.from('profiles').select('role').eq('id', u.id).single()).data!.role).toBe('professor')
  })
  it('anonymous visitors get nothing', async () => {
    const a = anonClient()
    expect((await a.from('labs').select('id')).data ?? []).toHaveLength(0)
    expect((await a.rpc('get_availability', { p_date: D })).error).toBeTruthy()
  })
})

describe('LIVE · HU-01 labs', () => {
  it('lists 8 labs; LAB-07 has unregistered characteristics (NULL)', async () => {
    expect(labs).toHaveLength(8)
    const l7 = (await student.from('labs').select('computers_count, software').eq('code', 'LAB-07').single()).data!
    expect(l7).toEqual({ computers_count: null, software: null })
  })
})

describe('LIVE · HU-03 / HU-06 / HU-02 / HU-05', () => {
  let a: string, b: string
  it('professor creates a pending request with a SOL- code', async () => {
    const r = await create(prof, 'LAB-06', D, 2)
    expect(r.error).toBeNull(); a = r.data.id
    expect(r.data.status).toBe('pending'); expect(r.data.code).toMatch(/^SOL-\d{4}-\d{4}$/)
  })
  it('validations: capacity, empty reason, student/admin cannot create', async () => {
    expect((await create(prof, 'LAB-06', D, 3, lab('LAB-06').capacity + 1)).error?.message).toContain('CAPACITY_EXCEEDED')
    expect((await create(prof, 'LAB-06', D, 3, 5, '  ')).error?.message).toContain('MISSING_FIELDS')
    expect((await create(student, 'LAB-06', D, 3)).error?.message).toContain('FORBIDDEN')
    expect((await create(admin, 'LAB-06', D, 3)).error?.message).toContain('FORBIDDEN')
  })
  it('availability shows "requested" for the pending slot', async () => {
    const av = (await student.rpc('get_availability', { p_date: D })).data as any[]
    expect(av.find((x) => x.lab_id === lab('LAB-06').id && x.slot_id === 2).status).toBe('requested')
  })
  it('only the admin can approve; approval makes the slot reserved', async () => {
    expect((await prof.rpc('approve_reservation_request', { p_request_id: a })).error?.message).toContain('FORBIDDEN')
    expect((await admin.rpc('approve_reservation_request', { p_request_id: a })).error).toBeNull()
    const av = (await student.rpc('get_availability', { p_date: D })).data as any[]
    expect(av.find((x) => x.lab_id === lab('LAB-06').id && x.slot_id === 2).status).toBe('reserved')
  })
  it('overlap with a confirmed reservation is rejected; competing pending cannot be approved', async () => {
    expect((await create(prof2, 'LAB-06', D, 2)).error?.message).toContain('SLOT_UNAVAILABLE')
  })
  it('conflict: two pending for one slot, approving the second after the first fails', async () => {
    const x = await create(prof, 'LAB-06', D, 4), y = await create(prof2, 'LAB-06', D, 4)
    expect(x.error ?? y.error).toBeNull(); b = y.data.id
    const list = (await admin.rpc('list_reservations_admin')).data as any[]
    expect(list.filter((r) => r.lab_code === 'LAB-06' && r.date === D && r.slot_id === 4 && ['pending', 'approved'].includes(r.status)).every((r) => r.has_conflict)).toBe(true)
    expect((await admin.rpc('approve_reservation_request', { p_request_id: x.data.id })).error).toBeNull()
    expect((await admin.rpc('approve_reservation_request', { p_request_id: b })).error?.message).toContain('CONFLICT')
  })
  it('rejection requires a reason; professor sees reason, history and notification', async () => {
    expect((await admin.rpc('reject_reservation_request', { p_request_id: b, p_reason: ' ' })).error?.message).toContain('REASON_REQUIRED')
    expect((await admin.rpc('reject_reservation_request', { p_request_id: b, p_reason: `${TAG} Mantenimiento` })).error).toBeNull()
    const row = (await prof2.from('reservation_requests').select('status, rejection_reason').eq('id', b).single()).data!
    expect(row).toMatchObject({ status: 'rejected', rejection_reason: `${TAG} Mantenimiento` })
    const h = (await prof2.from('request_status_history').select('to_status').eq('request_id', b).order('changed_at')).data!
    expect(h.map((x) => x.to_status)).toEqual(['pending', 'rejected'])
    const n = (await prof2.from('notifications').select('message').eq('request_id', b)).data!
    expect(n.length).toBeGreaterThanOrEqual(2)
  })
  it("a professor cannot read another professor's request or history", async () => {
    expect((await prof2.from('reservation_requests').select('id').eq('id', a)).data).toHaveLength(0)
    expect((await prof2.from('request_status_history').select('id').eq('request_id', a)).data).toHaveLength(0)
    expect((await student.from('reservation_requests').select('id')).data).toHaveLength(0)
  })
  it('only admin can list reservations (HU-04)', async () => {
    expect((await prof.rpc('list_reservations_admin')).error?.message).toContain('FORBIDDEN')
    expect(((await admin.rpc('list_reservations_admin')).data as any[]).length).toBeGreaterThan(0)
  })
  it('cancelling frees the slot; history keeps the original status', async () => {
    expect((await prof.rpc('cancel_reservation_request', { p_request_id: a })).error).toBeNull()
    const av = (await student.rpc('get_availability', { p_date: D })).data as any[]
    expect(av.find((x) => x.lab_id === lab('LAB-06').id && x.slot_id === 2).status).toBe('free')
    const h = (await prof.from('request_status_history').select('from_status,to_status').eq('request_id', a).order('changed_at')).data!
    expect(h.at(-1)).toEqual({ from_status: 'approved', to_status: 'cancelled' })
  })
})

describe('LIVE · direct-write protection (RLS / grants)', () => {
  it('no role can insert/update/delete requests, history or notifications directly', async () => {
    const u = (await prof.auth.getUser()).data.user!
    const ins = await prof.from('reservation_requests').insert({ code: 'SOL-HACK', requester_id: u.id, lab_id: lab('LAB-01').id, date: D, slot_id: 1, reservation_type: 'exam', attendees: 1, reason: 'x', status: 'approved' })
    expect(ins.error).toBeTruthy()
    const insAdmin = await admin.from('reservation_requests').insert({ code: 'SOL-HACK2', requester_id: u.id, lab_id: lab('LAB-01').id, date: D, slot_id: 1, reservation_type: 'exam', attendees: 1, reason: 'x', status: 'approved' })
    expect(insAdmin.error).toBeTruthy()
    expect((await prof.from('request_status_history').insert({ request_id: created[0]?.id ?? '00000000-0000-0000-0000-000000000000', to_status: 'approved' })).error).toBeTruthy()
    expect((await prof.from('notifications').insert({ user_id: u.id, message: 'x' })).error).toBeTruthy()
  })
  it('a professor cannot tamper with own request status or others', async () => {
    const mine = await create(prof, 'LAB-05', wednesday(21), 1, 5)
    expect(mine.error).toBeNull()
    await prof.from('reservation_requests').update({ status: 'approved' }).eq('id', mine.data.id)
    expect((await prof.from('reservation_requests').select('status').eq('id', mine.data.id).single()).data!.status).toBe('pending')
    await prof2.from('reservation_requests').update({ reason: 'hacked' }).eq('id', mine.data.id)
    await prof.from('reservation_requests').delete().eq('id', mine.data.id)
    expect((await prof.from('reservation_requests').select('id').eq('id', mine.data.id)).data).toHaveLength(1)
  })
  it('only admin can change the labs catalog; other roles affect 0 rows', async () => {
    for (const c of [student, prof]) {
      await c.from('labs').update({ capacity: 999 }).eq('code', 'LAB-01')
      await c.from('labs').delete().eq('code', 'LAB-01')
      expect((await c.from('labs').insert({ code: 'LAB-99', name: 'x', building: 'x', floor: 'x', room: 'x', capacity: 1 })).error).toBeTruthy()
    }
    expect((await student.from('labs').select('capacity').eq('code', 'LAB-01').single()).data!.capacity).toBe(30)
  })
  it("notifications are private and cannot be edited beyond 'read'", async () => {
    const mine = (await prof.from('notifications').select('id, message, user_id')).data!
    const me = (await prof.auth.getUser()).data.user!.id
    expect(mine.every((n) => n.user_id === me)).toBe(true)
    const other = (await prof2.from('notifications').select('id').in('id', mine.map((n) => n.id))).data!
    expect(other).toHaveLength(0)
    if (mine.length) {
      await prof.from('notifications').update({ message: 'tampered' }).eq('id', mine[0].id)
      expect((await prof.from('notifications').select('message').eq('id', mine[0].id).single()).data!.message).not.toBe('tampered')
    }
  })
  it('internal helper functions are not callable by clients', async () => {
    expect((await prof.rpc('log_status_change', {})).error).toBeTruthy()
    expect((await prof.rpc('sync_profile_role', {})).error).toBeTruthy()
  })
})

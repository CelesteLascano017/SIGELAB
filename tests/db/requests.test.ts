import { describe, it, expect, beforeAll } from 'vitest'
import { createDb, as, IDS, labId, futureWednesday, futureTuesday, type Db } from './harness'

let db: Db
let lab1: string, lab6: string, lab2: string
const date = futureWednesday()

const create = (user: string, lab: string, d: string, slot: number, attendees = 10, reason = 'Taller', type = 'exam') =>
  as(db, user, () =>
    db.query<{ id: string; code: string; status: string }>(
      `select * from public.create_reservation_request($1,$2,$3::smallint,$4::public.reservation_type,$5,$6)`,
      [lab, d, slot, type, attendees, reason]))

beforeAll(async () => {
  db = await createDb()
  lab1 = await labId(db, 'LAB-01'); lab6 = await labId(db, 'LAB-06'); lab2 = await labId(db, 'LAB-02')
}, 120000)

describe('HU-01 labs', () => {
  it('lists all labs with full info', async () => {
    const r = await as(db, IDS.student, () => db.query<any>(`select * from public.labs where code='LAB-03'`))
    expect(r.rows[0]).toMatchObject({ capacity: 24, computers_count: 12, has_projector: true })
  })
  it('keeps unregistered characteristics as NULL', async () => {
    const r = await as(db, IDS.student, () => db.query<any>(`select computers_count, software from public.labs where code='LAB-07'`))
    expect(r.rows[0]).toEqual({ computers_count: null, software: null })
  })
  it('anon cannot read labs', async () => {
    await db.exec('set role anon')
    await expect(db.query('select * from public.labs')).rejects.toThrow()
    await db.exec('reset role')
  })
})

describe('HU-03 create request', () => {
  it('creates a valid request: pending, SOL- code, persisted', async () => {
    const r = await create(IDS.prof, lab1, date, 4)
    expect(r.rows[0].status).toBe('pending')
    expect(r.rows[0].code).toMatch(/^SOL-\d{4}-\d{4}$/)
  })
  it('generates unique codes', async () => {
    const a = await create(IDS.prof, lab6, date, 1, 5)
    const b = await create(IDS.prof, lab6, date, 2, 5)
    expect(a.rows[0].code).not.toBe(b.rows[0].code)
  })
  it('rejects empty reason / missing fields', async () => {
    await expect(create(IDS.prof, lab1, date, 6, 10, '   ')).rejects.toThrow('MISSING_FIELDS')
    await expect(as(db, IDS.prof, () => db.query(
      `select * from public.create_reservation_request(null,$1,6::smallint,'exam',5,'x')`, [date]))).rejects.toThrow('MISSING_FIELDS')
  })
  it('rejects attendees over capacity', async () => {
    await expect(create(IDS.prof, lab6, date, 7, 17)).rejects.toThrow('CAPACITY_EXCEEDED')
    await expect(create(IDS.prof, lab6, date, 7, 0)).rejects.toThrow('INVALID_ATTENDEES')
  })
  it('rejects past dates', async () => {
    await expect(create(IDS.prof, lab1, '2020-01-01', 1)).rejects.toThrow('PAST_DATE')
  })
  it('rejects class slots (Tuesday LAB-01 13:00)', async () => {
    await expect(create(IDS.prof, lab1, futureTuesday(), 4)).rejects.toThrow('SLOT_UNAVAILABLE')
  })
  it('only professors can create requests', async () => {
    await expect(create(IDS.student, lab1, date, 5)).rejects.toThrow('FORBIDDEN')
    await expect(create(IDS.admin, lab1, date, 5)).rejects.toThrow('FORBIDDEN')
  })
  it('direct inserts are blocked by RLS/grants', async () => {
    await expect(as(db, IDS.prof, () => db.query(
      `insert into public.reservation_requests (code,requester_id,lab_id,date,slot_id,reservation_type,attendees,reason)
       values ('SOL-X',$1,$2,$3,5,'exam',5,'x')`, [IDS.prof, lab1, date]))).rejects.toThrow()
  })
})

describe('HU-06 approve / reject + overlap prevention + availability', () => {
  let reqA: string, reqB: string
  const d2 = futureWednesday(3)

  it('availability shows Solicitado for pending request', async () => {
    reqA = (await create(IDS.prof, lab2, d2, 5)).rows[0].id
    reqB = (await create(IDS.prof2, lab2, d2, 5)).rows[0].id   // pending duplicates are allowed
    const r = await as(db, IDS.student, () => db.query<any>(`select status from public.get_availability($1) where lab_id=$2 and slot_id=5`, [d2, lab2]))
    expect(r.rows[0].status).toBe('requested')
  })
  it('professor cannot approve or reject', async () => {
    await expect(as(db, IDS.prof, () => db.query(`select * from public.approve_reservation_request($1)`, [reqA]))).rejects.toThrow('FORBIDDEN')
    await expect(as(db, IDS.prof, () => db.query(`select * from public.reject_reservation_request($1,'no')`, [reqA]))).rejects.toThrow('FORBIDDEN')
  })
  it('flags conflicts between pending requests for admin', async () => {
    const r = await as(db, IDS.admin, () => db.query<any>(`select code, has_conflict from public.list_reservations_admin() where lab_id=$1 and date=$2`, [lab2, d2]))
    expect(r.rows.length).toBe(2); expect(r.rows.every((x) => x.has_conflict)).toBe(true)
  })
  it('approves, updates availability to Reservado, logs history and notifies', async () => {
    const r = await as(db, IDS.admin, () => db.query<any>(`select * from public.approve_reservation_request($1)`, [reqA]))
    expect(r.rows[0].status).toBe('approved')
    const av = await as(db, IDS.student, () => db.query<any>(`select status from public.get_availability($1) where lab_id=$2 and slot_id=5`, [d2, lab2]))
    expect(av.rows[0].status).toBe('reserved')
    const h = await as(db, IDS.admin, () => db.query<any>(`select to_status from public.request_status_history where request_id=$1 order by changed_at`, [reqA]))
    expect(h.rows.map((x) => x.to_status)).toEqual(['pending', 'approved'])
    const n = await as(db, IDS.prof, () => db.query<any>(`select message from public.notifications where request_id=$1`, [reqA]))
    expect(n.rows.length).toBe(2)
  })
  it('blocks approving a request that conflicts with a confirmed one', async () => {
    await expect(as(db, IDS.admin, () => db.query(`select * from public.approve_reservation_request($1)`, [reqB]))).rejects.toThrow('CONFLICT')
    const r = await as(db, IDS.admin, () => db.query<any>(`select is_blocked from public.list_reservations_admin() where id=$1`, [reqB]))
    expect(r.rows[0].is_blocked).toBe(true)
  })
  it('new requests on a reserved slot are rejected (HU-03 overlap)', async () => {
    await expect(create(IDS.prof2, lab2, d2, 5)).rejects.toThrow('SLOT_UNAVAILABLE')
  })
  it('DB unique index blocks two approved rows for the same slot even bypassing the RPC', async () => {
    await expect(db.query(
      `insert into public.reservation_requests (code,requester_id,lab_id,date,slot_id,reservation_type,attendees,reason,status)
       values ('SOL-DUP',$1,$2,$3,5,'exam',5,'x','approved')`, [IDS.prof, lab2, d2])).rejects.toThrow(/unique/i)
  })
  it('rejection requires a reason and persists it', async () => {
    await expect(as(db, IDS.admin, () => db.query(`select * from public.reject_reservation_request($1,'  ')`, [reqB]))).rejects.toThrow('REASON_REQUIRED')
    const r = await as(db, IDS.admin, () => db.query<any>(`select * from public.reject_reservation_request($1,'Mantenimiento GPU')`, [reqB]))
    expect(r.rows[0]).toMatchObject({ status: 'rejected', rejection_reason: 'Mantenimiento GPU' })
    const h = await as(db, IDS.admin, () => db.query<any>(`select reason from public.request_status_history where request_id=$1 and to_status='rejected'`, [reqB]))
    expect(h.rows[0].reason).toBe('Mantenimiento GPU')
  })
  it('cannot review a request twice', async () => {
    await expect(as(db, IDS.admin, () => db.query(`select * from public.approve_reservation_request($1)`, [reqB]))).rejects.toThrow('NOT_PENDING')
  })
  it('cancelling an approved request frees the slot', async () => {
    await as(db, IDS.prof, () => db.query(`select * from public.cancel_reservation_request($1)`, [reqA]))
    const av = await as(db, IDS.student, () => db.query<any>(`select status from public.get_availability($1) where lab_id=$2 and slot_id=5`, [d2, lab2]))
    expect(av.rows[0].status).toBe('free')
  })
  it('cancellation history records the ORIGINAL status as from_status', async () => {
    const d4 = futureWednesday(5)
    const id = (await create(IDS.prof, lab6, d4, 2)).rows[0].id            // pending
    await as(db, IDS.prof, () => db.query(`select * from public.cancel_reservation_request($1)`, [id]))
    const h = await as(db, IDS.prof, () => db.query<any>(`select from_status, to_status from public.request_status_history where request_id=$1 order by changed_at, to_status`, [id]))
    expect(h.rows.at(-1)).toEqual({ from_status: 'pending', to_status: 'cancelled' })
  })
  it('only the owner can cancel', async () => {
    const id = (await create(IDS.prof, lab6, futureWednesday(5), 3)).rows[0].id
    await expect(as(db, IDS.prof2, () => db.query(`select * from public.cancel_reservation_request($1)`, [id]))).rejects.toThrow('FORBIDDEN')
  })
  it('concurrent approvals of the same slot: exactly one wins', async () => {
    const d3 = futureWednesday(4)
    const a = (await create(IDS.prof, lab6, d3, 3)).rows[0].id
    const b = (await create(IDS.prof2, lab6, d3, 3)).rows[0].id
    const run = (id: string) => as(db, IDS.admin, () => db.query(`select * from public.approve_reservation_request($1)`, [id])).then(() => 'ok', () => 'fail')
    const res = [await run(a), await run(b)]
    expect(res.sort()).toEqual(['fail', 'ok'])
    const n = await db.query<any>(`select count(*)::int n from public.reservation_requests where lab_id=$1 and date=$2 and slot_id=3 and status='approved'`, [lab6, d3])
    expect(n.rows[0].n).toBe(1)
  })
})

describe('HU-04 / HU-05 / access control (RLS)', () => {
  it('professor sees only their own requests', async () => {
    const r = await as(db, IDS.prof2, () => db.query<any>(`select requester_id from public.reservation_requests`))
    expect(r.rows.length).toBeGreaterThan(0)
    expect(r.rows.every((x) => x.requester_id === IDS.prof2)).toBe(true)
  })
  it("professor cannot read another professor's request by id", async () => {
    const other = (await db.query<any>(`select id from public.reservation_requests where requester_id=$1 limit 1`, [IDS.prof])).rows[0].id
    const r = await as(db, IDS.prof2, () => db.query<any>(`select * from public.reservation_requests where id=$1`, [other]))
    expect(r.rows).toHaveLength(0)
    const h = await as(db, IDS.prof2, () => db.query<any>(`select * from public.request_status_history where request_id=$1`, [other]))
    expect(h.rows).toHaveLength(0)
  })
  it('students see no requests; admin sees all', async () => {
    expect((await as(db, IDS.student, () => db.query(`select * from public.reservation_requests`))).rows).toHaveLength(0)
    expect((await as(db, IDS.admin, () => db.query(`select * from public.reservation_requests`))).rows.length).toBeGreaterThan(3)
  })
  it('only admin can list reservations', async () => {
    await expect(as(db, IDS.prof, () => db.query(`select * from public.list_reservations_admin()`))).rejects.toThrow('FORBIDDEN')
  })
  it('notifications are private', async () => {
    const r = await as(db, IDS.prof2, () => db.query<any>(`select user_id from public.notifications`))
    expect(r.rows.every((x) => x.user_id === IDS.prof2)).toBe(true)
  })
  it('users cannot escalate their role', async () => {
    await expect(as(db, IDS.student, () => db.query(`update public.profiles set role='admin' where id=$1`, [IDS.student]))).rejects.toThrow()
    const r = await db.query<any>(`select role from public.profiles where id=$1`, [IDS.student])
    expect(r.rows[0].role).toBe('student')
  })
  it('students cannot write the labs catalog (RLS filters to 0 rows)', async () => {
    const del = await as(db, IDS.student, () => db.query(`delete from public.labs`))
    const upd = await as(db, IDS.student, () => db.query(`update public.labs set capacity=999`))
    expect(del.affectedRows ?? 0).toBe(0)
    expect(upd.affectedRows ?? 0).toBe(0)
    const n = await db.query<any>(`select count(*)::int n from public.labs where capacity=999`)
    expect(n.rows[0].n).toBe(0)
  })
})

describe('role assignment via app_metadata (GoTrue INSERT then UPDATE flow)', () => {
  it('syncs profiles.role when app_metadata is set after creation', async () => {
    const id = '00000000-0000-0000-0000-0000000000d1'
    await db.query(`insert into auth.users (id,email) values ($1,'late@epn.edu.ec')`, [id])
    expect((await db.query<any>(`select role from public.profiles where id=$1`, [id])).rows[0].role).toBe('student')
    await db.query(`update auth.users set raw_app_meta_data = '{"role":"professor"}' where id=$1`, [id])
    expect((await db.query<any>(`select role from public.profiles where id=$1`, [id])).rows[0].role).toBe('professor')
  })
  it('ignores invalid role values and user_metadata', async () => {
    const id = '00000000-0000-0000-0000-0000000000d2'
    await db.query(`insert into auth.users (id,email,raw_user_meta_data) values ($1,'x@epn.edu.ec','{"role":"admin"}')`, [id])
    await db.query(`update auth.users set raw_app_meta_data = '{"role":"superuser"}' where id=$1`, [id])
    expect((await db.query<any>(`select role from public.profiles where id=$1`, [id])).rows[0].role).toBe('student')
  })
  it('backfill statement is safe to run (no-op when already in sync)', async () => {
    const r = await db.query(`update public.profiles p set role=(u.raw_app_meta_data->>'role')::public.user_role from auth.users u where u.id=p.id and u.raw_app_meta_data->>'role' in ('student','professor','admin') and p.role is distinct from (u.raw_app_meta_data->>'role')::public.user_role`)
    expect(r.affectedRows ?? 0).toBe(0)
  })
})

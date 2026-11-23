import { describe, expect, it } from 'vitest'
import { as, createDb, futureWednesday, IDS, labId } from './harness'

describe('review regressions', () => {
  it.each(['{}', '{"role":null}', '{"role":"invalid"}'])('revokes administrator access when metadata loses a valid role: %s', async (metadata) => {
    const db = await createDb()
    try {
      await db.query('update auth.users set raw_app_meta_data=$1 where id=$2', [metadata, IDS.admin])
      const result = await db.query<{ role: string }>('select role from public.profiles where id=$1', [IDS.admin])
      expect(result.rows[0].role).toBe('student')
      await expect(as(db, IDS.admin, () => db.query('select * from public.list_reservations_admin()'))).rejects.toThrow('FORBIDDEN')
    } finally { await db.close() }
  })

  it('preserves sequence digits beyond 9999 instead of reusing a previous code', async () => {
    const db = await createDb()
    try {
      const lab = await labId(db, 'LAB-08')
      const create = () => as(db, IDS.prof, () => db.query<{ code: string }>(`select * from public.create_reservation_request($1,$2,1::smallint,'exam',1,'Sequence test')`, [lab, futureWednesday()]))
      await db.exec("select setval('public.reservation_request_seq', 1000, false)")
      expect((await create()).rows[0].code).toMatch(/-1000$/)
      await db.exec("select setval('public.reservation_request_seq', 10000, false)")
      expect((await create()).rows[0].code).toMatch(/-10000$/)
    } finally { await db.close() }
  })

  it('rejects approval after a request has expired', async () => {
    const db = await createDb()
    try {
      const lab = await labId(db, 'LAB-08')
      const result = await as(db, IDS.prof, () => db.query<{ id: string }>(`select * from public.create_reservation_request($1,$2,1::smallint,'exam',1,'Expiration test')`, [lab, futureWednesday()]))
      const id = result.rows[0].id
      await db.query('update public.reservation_requests set date=public.today_local()-1 where id=$1', [id])
      await expect(as(db, IDS.admin, () => db.query('select * from public.approve_reservation_request($1)', [id]))).rejects.toThrow('PAST_DATE')
    } finally { await db.close() }
  })
})

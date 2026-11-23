import { expect, it } from 'vitest'
import { isValidIsoDate } from '@/lib/domain/labels'
import { reservationInputSchema } from '@/lib/validation/reservation'

it.each(['2026-11-31', '2026-02-29', '2026-04-31', '2026-00-01', '2026-01-00'])('rejects impossible calendar dates: %s', (date) => {
  expect(isValidIsoDate(date)).toBe(false)
  expect(reservationInputSchema.safeParse({ labId: '3f2c1c0e-5b7a-4c1e-9d3a-1b2c3d4e5f60', date, slotId: 1, type: 'exam', attendees: 1, reason: 'Clase' }).success).toBe(false)
})
it.each(['2028-02-29', '2026-11-30', '2026-12-01'])('accepts real calendar dates: %s', (date) => expect(isValidIsoDate(date)).toBe(true))

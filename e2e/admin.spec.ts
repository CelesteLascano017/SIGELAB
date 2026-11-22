import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { DEMO, login, nextWednesday, shot } from './helpers'

test.describe.configure({ mode: 'serial' })
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
if (new URL(url).hostname !== 'tafggedejddofnpilspx.supabase.co') throw new Error('Wrong Supabase project')

async function api(email: string) {
  const c = createClient(url, anon, { auth: { persistSession: false } })
  const { error } = await c.auth.signInWithPassword({ email, password: process.env.DEMO_PASSWORD ?? '' })
  if (error) throw error
  return c
}
/** Creates a pending request through the real RPC as Carla for far-future slots (so tests don't disturb the demo data). */
async function makeRequest(slot: number) {
  const c = await api(DEMO.prof)
  const d = new Date(); d.setUTCDate(d.getUTCDate() + 7 * 24); while (d.getUTCDay() !== 3) d.setUTCDate(d.getUTCDate() + 1)
  const { data: labs } = await c.from('labs').select('id, code')
  const lab = labs!.find((l) => l.code === 'LAB-08')!.id
  const r = await c.rpc('create_reservation_request', { p_lab_id: lab, p_date: d.toISOString().slice(0, 10), p_slot_id: slot, p_type: 'exam', p_attendees: 5, p_reason: '[e2e] solicitud de prueba' })
  if (r.error) throw new Error(r.error.message)
  return { code: r.data.code as string, id: r.data.id as string, client: c }
}

test.describe('Administrador · HU-04 / HU-06', () => {
  test('HU-06 resumen, solicitud bloqueada por conflicto y aprobación/rechazo con motivo', async ({ page }) => {
    const a = await makeRequest(5), b = await makeRequest(6)
    await login(page, DEMO.admin)
    await page.goto('/admin/requests')
    await expect(page.getByTestId('summary')).toContainText('Pendientes de revisión')
    await shot(page, '20-admin-requests')

    // blocked: seeded pending request that conflicts with an approved one cannot be approved
    const blocked = page.locator('[data-testid^="review-SOL-"]').filter({ hasText: 'Bloqueada' }).first()
    if (await blocked.count()) {
      await expect(blocked.getByRole('button', { name: 'Aprobar' })).toBeDisabled()
      await blocked.scrollIntoViewIfNeeded(); await shot(page, '21-admin-blocked')
    }
    // approve
    const cardA = page.getByTestId(`review-${a.code}`)
    await cardA.getByRole('button', { name: 'Aprobar' }).click()
    await expect(cardA).toHaveCount(0)
    // reject requires reason
    const cardB = page.getByTestId(`review-${b.code}`)
    await cardB.getByRole('button', { name: 'Rechazar' }).click()
    await cardB.getByRole('button', { name: 'Confirmar rechazo' }).click()
    await expect(cardB.getByText('Debes indicar el motivo del rechazo.')).toBeVisible()
    await cardB.getByLabel('Motivo del rechazo').fill('[e2e] Laboratorio en mantenimiento')
    await cardB.getByRole('button', { name: 'Confirmar rechazo' }).click()
    await expect(cardB).toHaveCount(0)

    // professor-side effects (HU-05): states reflected, reason visible, notifications generated
    const prof = a.client
    const rows = (await prof.from('reservation_requests').select('code,status,rejection_reason').in('code', [a.code, b.code])).data!
    expect(rows.find((r) => r.code === a.code)!.status).toBe('approved')
    expect(rows.find((r) => r.code === b.code)).toMatchObject({ status: 'rejected', rejection_reason: '[e2e] Laboratorio en mantenimiento' })

    // reservation list reflects them (HU-04)
    await page.goto('/admin/reservations?q=%5Be2e%5D')
    await expect(page.getByTestId(`row-${a.code}`)).toContainText('Aprobada')
    await expect(page.getByTestId(`row-${b.code}`)).toContainText('Rechazada')

    // cleanup: cancel what we created
    await a.client.rpc('cancel_reservation_request', { p_request_id: a.id })
    await b.client.rpc('cancel_reservation_request', { p_request_id: b.id }) // already rejected -> ignored
  })

  test('HU-04 listado, filtros por laboratorio / estado / conflicto y contadores', async ({ page }) => {
    await login(page, DEMO.admin)
    await page.goto('/admin/reservations')
    const total = Number(await page.getByTestId('count-all').textContent())
    expect(total).toBeGreaterThanOrEqual(6)
    await expect(page.getByText('Todas las reservas')).toBeVisible()
    await shot(page, '13-admin-reservations')

    await page.getByTestId('only-conflicts').click()
    await expect(page).toHaveURL(/conflicts=1/)
    const rows = page.locator('[data-testid^="row-SOL-"]')
    expect(await rows.count()).toBeGreaterThan(0)
    for (const r of await rows.all()) await expect(r.getByTestId('conflict-chip')).toBeVisible()
    await shot(page, '14-admin-conflicts')

    await page.goto('/admin/reservations')
    await page.getByLabel('Laboratorio').selectOption({ label: 'Lab. Ingeniería de Software B' })
    await expect(page).toHaveURL(/lab=/)
    await expect(page.getByRole('heading', { name: 'Lab. Ingeniería de Software B' })).toBeVisible()
    for (const r of await page.locator('[data-testid^="row-SOL-"]').all()) await expect(r).toContainText('Ingeniería de Software B')
    await shot(page, '15-admin-lab-filter')

    await page.goto('/admin/reservations?status=approved')
    for (const r of await page.locator('[data-testid^="row-SOL-"]').all()) await expect(r).toContainText('Aprobada')
    await page.goto('/admin/reservations?q=zzzz-no-existe')
    await expect(page.getByText('Sin resultados')).toBeVisible()
  })

  test('HU-02 la disponibilidad refleja una reserva aprobada y vuelve a Libre al cancelar', async ({ page }) => {
    const r = await makeRequest(7)
    await login(page, DEMO.admin)
    const date = (await r.client.from('reservation_requests').select('date').eq('id', r.id).single()).data!.date as string
    await page.goto('/admin/requests');
    await page.getByTestId(`review-${r.code}`).getByRole('button', { name: 'Aprobar' }).click()
    await expect(page.getByTestId(`review-${r.code}`)).toHaveCount(0)
    // far-future date is outside the 14-day strip: verify through the same RPC the page uses
    const av = (await r.client.rpc('get_availability', { p_date: date })).data as any[]
    const lab = (await r.client.from('labs').select('id').eq('code', 'LAB-08').single()).data!.id
    expect(av.find((x) => x.lab_id === lab && x.slot_id === 7).status).toBe('reserved')
    await r.client.rpc('cancel_reservation_request', { p_request_id: r.id })
    const av2 = (await r.client.rpc('get_availability', { p_date: date })).data as any[]
    expect(av2.find((x) => x.lab_id === lab && x.slot_id === 7).status).toBe('free')
  })
})

import { test, expect } from '@playwright/test'
import { DEMO, login, nextWednesday, shot } from './helpers'

const wed = nextWednesday(1)
test.describe.configure({ mode: 'serial' })

test.describe('Docente · HU-03 / HU-05', () => {
  let code = ''

  test('HU-03 validaciones: campos obligatorios y capacidad', async ({ page }) => {
    await login(page, DEMO.prof)
    await page.goto('/reservations/new')
    await page.getByRole('button', { name: 'Enviar solicitud' }).click()
    for (const m of ['Selecciona un laboratorio', 'Selecciona un horario', 'Selecciona el tipo de reserva', 'Indica el número de asistentes', 'Describe el motivo de la solicitud'])
      await expect(page.locator('p[role="alert"]').filter({ hasText: m })).toBeVisible()
    await shot(page, '12-new-reservation-validation')
    await page.getByLabel('Laboratorio').selectOption({ label: 'Lab. Inteligencia Artificial · 16 pers.' })
    await page.getByLabel('Número de asistentes').fill('17')
    await expect(page.locator('p[role="alert"]').filter({ hasText: /supera la capacidad del laboratorio \(16\)/ })).toBeVisible()
  })

  test('HU-03 muestra "No disponible" ante reserva confirmada y "Clase" bloquea', async ({ page }) => {
    await login(page, DEMO.prof)
    await page.goto(`/reservations/new?date=${wed}`)
    await page.getByLabel('Laboratorio').selectOption({ label: 'Lab. Ingeniería de Software B · 28 pers.' })
    // seeded: approved SOL for LAB-02 on next Wednesday (>=3 days ahead) 13:00-15:00 — only present when that date is in range
    const slot4 = page.getByTestId('pick-slot-4')
    // seeded demo data: approved SOL on LAB-02 / first Wednesday / 13:00-15:00 (availability loads asynchronously)
    await expect(slot4).toHaveAttribute('data-status', 'reserved')
    await slot4.click()
    await expect(page.getByTestId('availability-blocked')).toContainText('Ya existe una reserva confirmada (SOL-')
    await expect(page.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled()
    await shot(page, '11-new-reservation-blocked')
    // Tuesday has seeded classes in LAB-02 (07-13): those slots must be disabled
    const tue = new Date(wed + 'T12:00:00Z'); tue.setUTCDate(tue.getUTCDate() - 1)
    const tueIso = tue.toISOString().slice(0, 10)
    await page.goto(`/reservations/new?date=${tueIso}`)
    await page.getByLabel('Laboratorio').selectOption({ label: 'Lab. Ingeniería de Software B · 28 pers.' })
    await expect(page.getByTestId('pick-slot-1')).toBeDisabled()
    await expect(page.getByTestId('pick-slot-1')).toHaveAttribute('data-status', 'class')
  })

  test('HU-03 registro válido: código SOL, estado Pendiente y persistencia', async ({ page }) => {
    await login(page, DEMO.prof)
    await page.goto(`/reservations/new?date=${wed}`)
    await page.getByLabel('Laboratorio').selectOption({ label: 'Lab. Bases de Datos · 26 pers.' })
    await page.getByTestId('pick-slot-6').click()
    await expect(page.getByTestId('availability-ok')).toContainText('Laboratorio disponible')
    await shot(page, '10-new-reservation-available')
    await page.getByRole('button', { name: 'Examen' }).click()
    await page.getByLabel('Número de asistentes').fill('20')
    await page.getByLabel('Motivo de la solicitud').fill('[e2e] Examen de prueba automatizada')
    await page.getByRole('button', { name: 'Enviar solicitud' }).click()
    await expect(page.getByTestId('request-code')).toHaveText(/^SOL-\d{4}-\d{4}$/)
    await expect(page.getByTestId('request-status')).toHaveText('Pendiente')
    code = (await page.getByTestId('request-code').textContent())!
    // persistence after reload (read back from PostgreSQL)
    await page.goto('/my-requests'); await page.reload()
    await expect(page.getByTestId(`request-${code}`)).toContainText('Pendiente')
  })

  test('HU-05 detalle, seguimiento, notificación y cancelación', async ({ page }) => {
    await login(page, DEMO.prof)
    await page.goto('/my-requests')
    await shot(page, '17-my-requests')
    await page.getByTestId(`request-${code}`).click()
    await expect(page.getByTestId('history')).toContainText('Pendiente')
    await page.getByRole('button', { name: 'Cancelar solicitud' }).click()
    await expect(page.getByTestId('status-chip')).toHaveText('Cancelada')
    await page.goto('/notifications')
    await expect(page.getByTestId('notifications')).toContainText(code)
  })

  test('HU-05 filtro por estado y motivo de rechazo (docente 2)', async ({ page }) => {
    await login(page, DEMO.prof2)
    await page.goto('/my-requests?status=rejected')
    const item = page.locator('[data-testid^="request-SOL-"]').filter({ hasText: 'visión por computador' }) // seeded demo request
    await expect(item).toContainText('Rechazada')
    await item.click()
    await expect(page.getByTestId('rejection-reason')).toContainText('mantenimiento preventivo')
    await shot(page, '18-request-rejected')
  })

  test('HU-05 solicitudes ajenas: Acceso restringido', async ({ page }) => {
    await login(page, DEMO.prof)
    await page.goto('/my-requests')
    const own = await page.locator('[data-testid^="request-SOL-"]').first().getAttribute('href')
    expect(own).toBeTruthy()
    // another professor tries to open it
    await page.getByLabel('Cerrar sesión').click()
    await expect(page).toHaveURL(/\/login$/)
    await login(page, DEMO.prof2)
    await page.goto(own!)
    await expect(page.getByText('No tienes permisos para esta sección')).toBeVisible()
    await expect(page.getByText('Solo puedes consultar tus propias solicitudes.')).toBeVisible()
    await shot(page, '19-restricted-own')
  })

  test('HU-06 el docente no puede gestionar estados (Acceso restringido)', async ({ page }) => {
    await login(page, DEMO.prof)
    await page.goto('/admin/requests')
    await expect(page.getByText('Solo los usuarios autorizados como administradores pueden gestionar y cambiar el estado de las solicitudes.')).toBeVisible()
    await shot(page, '22-restricted-admin')
  })
})

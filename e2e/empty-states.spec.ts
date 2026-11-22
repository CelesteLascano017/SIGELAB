import { test, expect } from '@playwright/test'
import { DEMO, login, shot } from './helpers'

// Empty states cannot be produced with the seeded data, so dev-only QA hooks (?__empty=1, disabled when
// NODE_ENV=production) force the empty data set while the REAL pages and components render.
test('HU-01 estado vacío: No hay laboratorios registrados', async ({ page }) => {
  await login(page, DEMO.student)
  await page.goto('/laboratories?__empty=1')
  await expect(page.getByText('No hay laboratorios registrados')).toBeVisible()
  await expect(page.getByTestId('lab-count')).toHaveText('0 de 0')
  await shot(page, '06-labs-empty')
})
test('HU-02 estado vacío: No hay laboratorios disponibles', async ({ page }) => {
  await login(page, DEMO.prof)
  await page.goto('/availability?__empty=1&only=1&slot=2')
  await expect(page.getByText('No hay laboratorios disponibles', { exact: true })).toBeVisible()
  await expect(page.getByTestId('available-count')).toHaveText('0 disponibles')
  await shot(page, '09-availability-empty')
})
test('HU-04 estado vacío: No existen reservas registradas', async ({ page }) => {
  await login(page, DEMO.admin)
  await page.goto('/admin/reservations?__empty=1')
  await expect(page.getByText('No existen reservas registradas')).toBeVisible()
  await expect(page.getByTestId('count-all')).toHaveText('0')
  await shot(page, '16-reservations-empty')
})

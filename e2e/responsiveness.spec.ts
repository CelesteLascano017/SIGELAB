import { test, expect } from '@playwright/test'
import { DEMO, login } from './helpers'

test('search updates the URL and results without reloading the document', async ({ page }) => {
  await login(page, DEMO.student)
  await page.goto('/laboratories')
  const documents: string[] = []
  page.on('request', (request) => { if (request.resourceType() === 'document') documents.push(request.url()) })
  await page.getByLabel('Buscar laboratorio').fill('Redes')
  await page.getByLabel('Buscar laboratorio').press('Enter')
  await expect(page.getByTestId('lab-count')).toHaveText('1 de 8')
  expect(documents).toEqual([])
})

test('navigation acknowledges a click while the server is still responding', async ({ page }) => {
  await login(page, DEMO.student)
  await page.route('**/laboratories*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1400))
    await route.continue()
  })
  await page.getByTestId('module-spaces').click()
  await expect(page.locator('[data-navigation-pending="true"]')).toBeVisible({ timeout: 800 })
  await expect(page).toHaveURL(/\/laboratories/)
  await expect(page.getByTestId('lab-count')).toBeVisible()
})

test('reservation slots remain unknown until availability has been checked', async ({ page }) => {
  await login(page, DEMO.prof)
  await page.route('**/reservations/new*', async (route) => {
    if (route.request().method() === 'POST') await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.continue()
  })
  await page.goto('/reservations/new')
  await page.getByLabel('Laboratorio', { exact: true }).selectOption({ label: 'Lab. Bases de Datos · 26 pers.' })
  await expect(page.getByTestId('pick-slot-1')).toHaveAttribute('data-status', 'loading')
  await expect(page.getByTestId('pick-slot-1')).toBeDisabled()
  await expect(page.getByTestId('pick-slot-1')).toHaveAttribute('data-status', 'free')
})

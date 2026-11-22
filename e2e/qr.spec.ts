import { test, expect } from '@playwright/test'
import { DEMO, login } from './helpers'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => { throw new DOMException('Denied', 'NotAllowedError') } })
  })
  await login(page, DEMO.student)
})

test('QR navigation requests the camera and handles denied permission', async ({ page }) => {
  await page.getByTestId('module-spaces').click()
  await page.getByRole('link', { name: 'Escanear QR', exact: true }).click()
  await expect(page).toHaveURL(/\/scan$/)
  await expect(page.locator('p[role="alert"]')).toContainText('permiso')
  await expect(page.getByRole('button', { name: 'Reintentar cámara' })).toBeEnabled()
  await page.screenshot({ path: 'docs/screens/23-qr-scanner.png', fullPage: true })
})

for (const [file, title] of [['lab-01', 'Lab. Ingeniería de Software A'], ['lab-03', 'Lab. Redes y Conectividad'], ['lab-08', 'Lab. Bases de Datos']]) {
  test(`a real QR image opens its laboratory: ${file}`, async ({ page }) => {
    await page.goto('/scan')
    await expect(page.locator('p[role="alert"]')).toContainText('permiso')
    await page.getByLabel('Subir imagen del QR').setInputFiles(`public/qr/${file}.png`)
    await expect(page).toHaveURL(/\/laboratories\/[a-f0-9-]+$/)
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
  })
}

test('rejects unrelated and unregistered QR codes and can retry', async ({ page }) => {
  await page.goto('/scan')
  await expect(page.locator('p[role="alert"]')).toContainText('permiso')
  await page.getByLabel('Subir imagen del QR').setInputFiles('public/qr/invalid.png')
  await expect(page.locator('p[role="alert"]')).toContainText('no pertenece')
  await page.getByLabel('Subir imagen del QR').setInputFiles('public/qr/unknown-lab.png')
  await expect(page.locator('p[role="alert"]')).toContainText('no está registrado')
  await expect(page).toHaveURL(/\/scan$/)
})

test('camera frames decode a synthetic QR and navigate', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => {
      const image = new Image(); image.src = '/qr/lab-03.png'; await image.decode()
      const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 640
      const stream = canvas.captureStream(4)
      canvas.getContext('2d')!.drawImage(image, 0, 0)
      return stream
    } })
  })
  await page.goto('/scan')
  await expect(page).toHaveURL(/\/laboratories\/[a-f0-9-]+$/)
  await expect(page.getByRole('heading', { name: 'Lab. Redes y Conectividad', exact: true })).toBeVisible()
})

import { test, expect } from '@playwright/test'
import { DEMO, login, shot } from './helpers'

test.describe('Estudiante · HU-01 / HU-02', () => {
  test.beforeEach(async ({ page }) => { await login(page, DEMO.student) })

  test('login, menú de módulos y navegación', async ({ page }) => {
    await shot(page, '02-modules')
    await expect(page.getByText('GRUPO 7')).toBeVisible()
    await page.getByTestId('module-spaces').click()
    await expect(page).toHaveURL(/\/laboratories/)
  })

  test('HU-01 lista, búsqueda, detalle y datos sin registrar', async ({ page }) => {
    await page.goto('/laboratories')
    await expect(page.getByTestId('lab-count')).toHaveText('8 de 8')
    await expect(page.getByText('Lab. Redes y Conectividad')).toBeVisible()
    await shot(page, '03-labs-list')
    await page.getByLabel('Buscar laboratorio').fill('Redes'); await page.keyboard.press('Enter')
    await expect(page.getByTestId('lab-count')).toHaveText('1 de 8')
    await page.getByText('Lab. Redes y Conectividad').click()
    await expect(page.getByText('¿Debo llevar mi equipo? Hay 12 PCs para 24 personas')).toBeVisible()
    await expect(page.getByText('Edificio FIS · Planta baja · Aula A-105').first()).toBeVisible()
    await shot(page, '04-lab-detail')
    await page.goto('/laboratories'); await page.getByText('Sala Multimedia').click()
    await expect(page.getByText('Sin información registrada').first()).toBeVisible()
    await expect(page.getByText('¿Debo llevar mi equipo? Sin información')).toBeVisible()
    await shot(page, '05-lab-detail-no-info')
  })

  test('HU-01 filtro "Lleva laptop"', async ({ page }) => {
    await page.goto('/laboratories?filter=laptop')
    await expect(page.getByTestId('lab-count')).not.toHaveText('8 de 8')
  })

  test('HU-02 disponibilidad: cuadrícula, leyenda, filtro y horario', async ({ page }) => {
    await page.goto('/availability')
    await expect(page.getByTestId('legend')).toBeVisible()
    for (const t of ['Libre', 'Solicitado', 'Reservado', 'Clase', 'No disponible']) await expect(page.getByTestId('legend').getByText(t)).toBeVisible()
    await expect(page.locator('[data-testid^="cell-LAB-01-"]')).toHaveCount(7)
    await shot(page, '07-availability-grid')
    await page.getByTestId('only-available').click()
    await expect(page).toHaveURL(/only=1/)
    await expect(page.getByTestId('available-count')).toContainText('disponibles')
    await shot(page, '08-availability-only')
    await page.getByRole('link', { name: '09:00 – 11:00' }).click()
    await expect(page).toHaveURL(/slot=2/)
  })

  test('el estudiante no puede entrar a secciones de docente/administrador', async ({ page }) => {
    await page.goto('/my-requests'); await expect(page.getByText('No tienes permisos para esta sección')).toBeVisible()
    await page.goto('/reservations/new'); await expect(page.getByText('No tienes permisos para esta sección')).toBeVisible()
    await page.goto('/admin/requests'); await expect(page.getByText('No tienes permisos para esta sección')).toBeVisible()
    await page.goto('/admin/reservations'); await expect(page.getByText('No tienes permisos para esta sección')).toBeVisible()
  })

  test('rutas protegidas: sin sesión redirige a /login y se cierra sesión', async ({ page, context }) => {
    await page.getByLabel('Cerrar sesión').click()
    await expect(page).toHaveURL(/\/login/)
    await page.goto('/laboratories'); await expect(page).toHaveURL(/\/login/)
    await context.clearCookies()
  })
})

test('login: credenciales inválidas muestran error', async ({ page }) => {
  await page.goto('/login'); await shot(page, '01-login')
  await page.getByLabel('Correo institucional').fill(DEMO.student)
  await page.getByLabel('Contraseña').fill('incorrecta-123')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByText('Credenciales inválidas.')).toBeVisible()
})

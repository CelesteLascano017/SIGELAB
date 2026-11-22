import { expect, type Page } from '@playwright/test'

export const DEMO = { student: 'ana.martinez@epn.edu.ec', prof: 'carla.mendoza@epn.edu.ec', prof2: 'diego.salazar@epn.edu.ec', admin: 'jorge.vasconez@epn.edu.ec' }
export const SHOTS = 'docs/screens'

export async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Correo institucional').fill(email)
  await page.getByLabel('Contraseña').fill(process.env.DEMO_PASSWORD ?? '')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/modules/)
}
export const shot = (page: Page, name: string) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false })

/** ISO dates of the 14-day strip's Wednesdays (no weekly classes are seeded on Wednesday). */
export function nextWednesday(minDays = 1) {
  const d = new Date(); d.setUTCDate(d.getUTCDate() + minDays)
  while (d.getUTCDay() !== 3) d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

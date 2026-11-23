import { test, expect } from '@playwright/test'
import { DEMO, login } from './helpers'

for (const [role, email, destination] of [
  ['student', DEMO.student, '/laboratories'],
  ['professor', DEMO.prof, '/laboratories'],
  ['admin', DEMO.admin, '/admin/requests'],
]) {
  test(`authenticated HTML renders after redirect and direct reload: ${role}`, async ({ page }) => {
    await login(page, email)
    await expect(page.getByTestId('module-spaces')).toBeVisible()
    const modules = await page.reload()
    expect(modules?.status()).toBe(200)
    await expect(page.getByTestId('module-spaces')).toBeVisible()
    await page.getByTestId('module-spaces').click()
    await expect(page).toHaveURL(new RegExp(`${destination}$`))
    const response = await page.reload()
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByText('Worker threw exception')).toHaveCount(0)
  })
}

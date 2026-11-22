import { test, expect } from '@playwright/test'
import { DEMO, login } from './helpers'

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

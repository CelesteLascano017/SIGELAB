import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { DEMO, login } from './helpers'

const PAGES: Record<string, string[]> = {
  [DEMO.student]: ['/modules', '/laboratories', '/availability', '/notifications'],
  [DEMO.prof]: ['/laboratories', '/availability', '/reservations/new', '/my-requests', '/notifications'],
  [DEMO.admin]: ['/admin/requests', '/admin/reservations'],
}

async function audit(page: Page, path: string) {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(path); await page.waitForLoadState('networkidle')
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  return { errors, violations: res.violations.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes[0].target.join(' ')}`) }
}

for (const [email, paths] of Object.entries(PAGES)) {
  test(`calidad · consola y accesibilidad · ${email.split('.')[0]}`, async ({ page }) => {
    await login(page, email)
    const report: string[] = []
    for (const p of paths) {
      const r = await audit(page, p)
      r.errors.forEach((e) => report.push(`[console] ${p}: ${e.slice(0, 160)}`))
      r.violations.forEach((v) => report.push(`[a11y] ${p}: ${v}`))
    }
    console.log(report.join('\n') || 'sin hallazgos')
    expect(report.filter((l) => l.startsWith('[console]'))).toEqual([])
    expect(report.filter((l) => /\((critical|serious)\)/.test(l))).toEqual([])
  })
}

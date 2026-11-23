import { test, expect } from '@playwright/test'

test('public login renders when the request includes an unrelated cookie', async ({ request }) => {
  const response = await request.get('/login', { headers: { Cookie: 'sigelab_regression=1' } })
  expect(response.status()).toBe(200)
  expect(await response.text()).toContain('Gestión de espacios')
})

test('an unauthenticated cookie never grants access or crashes a protected route', async ({ request }) => {
  const response = await request.get('/modules', { headers: { Cookie: 'sigelab_regression=1' }, maxRedirects: 0 })
  expect(response.status()).toBe(307)
  expect(new URL(response.headers().location, response.url()).pathname).toBe('/login')
})

import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

const mocks = vi.hoisted(() => ({ client: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: mocks.client }))

beforeEach(() => {
  mocks.client.mockImplementation((_url: string, _key: string, options: { cookies: { setAll: (cookies: { name: string; value: string; options: { path: string } }[], headers: Record<string, string>) => void } }) => {
    options.cookies.setAll([{ name: 'session', value: 'refreshed', options: { path: '/' } }], { 'Cache-Control': 'private, no-store', Expires: '0', Pragma: 'no-cache' })
    return { auth: { getClaims: async () => ({ data: { claims: { sub: 'signed-in-user' } } }) } }
  })
})

it.each(['/login', '/laboratories'])('preserves refreshed cookies and cache protections on %s', async (path) => {
  const response = await updateSession(new NextRequest(`https://sigelab.test${path}`))
  expect(response.cookies.get('session')?.value).toBe('refreshed')
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  expect(response.headers.get('expires')).toBe('0')
})

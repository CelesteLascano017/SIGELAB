import { createClient } from '@supabase/supabase-js'
import { expect, it } from 'vitest'
import { listNotifications, unreadCount, markNotificationsRead } from '@/services/requests'

function database(fetcher: typeof fetch) {
  return createClient('https://test.supabase.co', 'test-key', { auth: { persistSession: false }, global: { fetch: fetcher } })
}

it('only marks the displayed notification IDs as read', async () => {
  let requestedUrl = ''
  const db = database(async (input) => { requestedUrl = String(input); return new Response(null, { status: 204 }) })
  await markNotificationsRead(db, ['00000000-0000-0000-0000-000000000001'])
  const params = new URL(requestedUrl).searchParams
  expect(params.get('id')).toBe('in.(00000000-0000-0000-0000-000000000001)')
})

it('can fetch the second page of notifications', async () => {
  let requestedUrl = ''
  const db = database(async (input) => { requestedUrl = String(input); return Response.json([]) })
  await listNotifications(db, 2)
  expect(new URL(requestedUrl).searchParams.get('offset')).toBe('30')
})

it('propagates backend failures rather than returning empty data or success', async () => {
  const db = database(async () => Response.json({ message: 'Backend unavailable' }, { status: 503 }))
  await expect(listNotifications(db)).rejects.toThrow()
  await expect(unreadCount(db)).rejects.toThrow()
  await expect(markNotificationsRead(db, ['00000000-0000-0000-0000-000000000001'])).rejects.toThrow()
})

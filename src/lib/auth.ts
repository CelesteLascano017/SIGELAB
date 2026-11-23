import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Role, SessionUser } from '@/types'

/** Role is read from the profiles table (server side, RLS) — never from the client. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const id = claims?.claims.sub
  if (!id) return null
  const { data } = await supabase.from('profiles').select('full_name, email, role').eq('id', id).single()
  if (!data) return null
  return { id, email: data.email, fullName: data.full_name, role: data.role as Role }
})

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}

/** Redirects to the "Acceso restringido" screen when the role is not allowed. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser()
  if (!roles.includes(user.role)) redirect(`/restricted?from=${roles.includes('admin') && roles.length === 1 ? 'admin' : 'own'}`)
  return user
}

export const homePathFor = (role: Role) => (role === 'admin' ? '/admin/requests' : '/laboratories')

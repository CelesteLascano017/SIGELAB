import Link from 'next/link'
import { ArrowLeft, Bell, CircleUser } from 'lucide-react'
import type { ReactNode } from 'react'
import { signOutAction } from '@/actions/auth'
import { ROLE_LABEL } from '@/lib/domain/labels'
import { createClient } from '@/lib/supabase/server'
import { unreadCount } from '@/services/requests'
import type { SessionUser } from '@/types'
import { BottomNav } from './bottom-nav'

export async function AppShell({ user, title, back, children, hideNav }: {
  user: SessionUser; title: string; back?: string; children: ReactNode; hideNav?: boolean
}) {
  const db = await createClient()
  const unread = await unreadCount(db)
  const pending = user.role === 'admin' ? ((await db.from('reservation_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')).count ?? 0) : 0
  const bg = user.role === 'admin' ? 'bg-admin' : 'bg-brand'
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-surface shadow-xl">
      <header className={`${bg} sticky top-0 z-30 flex items-center gap-3 px-4 py-3 text-white`}>
        <Link href={back ?? '/modules'} aria-label="Volver"><ArrowLeft size={20} /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight">{title}</h1>
          <p className="truncate text-xs opacity-80">{user.fullName} • {ROLE_LABEL[user.role]}</p>
        </div>
        <Link href="/notifications" aria-label={`Notificaciones${unread ? ` (${unread} sin leer)` : ''}`} className="relative">
          <Bell size={20} />
          {unread > 0 && <span data-testid="unread-badge" className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />}
        </Link>
        <form action={signOutAction}><button aria-label="Cerrar sesión"><CircleUser size={22} /></button></form>
      </header>
      <main className="flex-1 pb-4">{children}</main>
      {!hideNav && <BottomNav role={user.role} pending={pending} />}
    </div>
  )
}

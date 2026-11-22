import Link from '@/components/navigation-link'
import { ArrowLeft, Bell, LogOut } from 'lucide-react'
import { Suspense, type ReactNode } from 'react'
import { signOutAction } from '@/actions/auth'
import { ROLE_LABEL } from '@/lib/domain/labels'
import { createClient } from '@/lib/supabase/server'
import { unreadCount } from '@/services/requests'
import type { SessionUser } from '@/types'
import { BottomNav } from './bottom-nav'

async function NotificationLink() {
  const unread = await unreadCount(await createClient())
  return <Link href="/notifications" aria-label={`Notificaciones${unread ? ` (${unread} sin leer)` : ''}`} className="relative inline-flex h-10 w-10 items-center justify-center">
    <Bell size={20} />
    {unread > 0 && <span data-testid="unread-badge" className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />}
  </Link>
}

async function AdminNav() {
  const db = await createClient()
  const { count } = await db.from('reservation_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  return <BottomNav role="admin" pending={count ?? 0} />
}

export function AppShell({ user, title, back, children, hideNav }: {
  user: SessionUser; title: string; back?: string; children: ReactNode; hideNav?: boolean
}) {
  const bg = user.role === 'admin' ? 'bg-admin' : 'bg-brand'
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-surface shadow-xl">
      <header className={`${bg} sticky top-0 z-30 flex items-center gap-3 px-4 py-3 text-white`}>
        <Link href={back ?? '/modules'} aria-label="Volver" className="inline-flex h-10 w-8 shrink-0 items-center justify-center"><ArrowLeft size={20} /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight">{title}</h1>
          <p className="truncate text-xs opacity-80">{user.fullName} • {ROLE_LABEL[user.role]}</p>
        </div>
        <Suspense fallback={<Link href="/notifications" aria-label="Notificaciones" className="inline-flex h-10 w-10 items-center justify-center"><Bell size={20} /></Link>}><NotificationLink /></Suspense>
        <form action={signOutAction}><button aria-label="Cerrar sesión" title="Cerrar sesión" className="inline-flex h-10 w-8 items-center justify-center"><LogOut size={20} /></button></form>
      </header>
      <main className="flex-1 pb-4">{children}</main>
      {!hideNav && (user.role === 'admin'
        ? <Suspense fallback={<BottomNav role="admin" />}><AdminNav /></Suspense>
        : <BottomNav role={user.role} />)}
    </div>
  )
}

import Link from '@/components/navigation-link'
import { Bell } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { EmptyState } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { formatDateTime } from '@/lib/domain/labels'
import { createClient } from '@/lib/supabase/server'
import { listNotifications } from '@/services/requests'
import { MarkRead } from './mark-read'

export default async function NotificationsPage() {
  const user = await requireUser()
  const items = await listNotifications(await createClient())
  const link = (id: string | null) => (id && user.role === 'professor' ? `/my-requests/${id}` : null)
  return (
    <AppShell user={user} title="Notificaciones" back="/">
      {items.length === 0 ? <EmptyState icon={<Bell size={26} />} title="Sin notificaciones" /> : (
        <ul className="m-4 space-y-2" data-testid="notifications">
          {items.map((n) => {
            const href = link(n.request_id)
            const body = <><p className={`text-sm ${n.read ? '' : 'font-semibold'}`}>{n.message}</p><p className="text-xs text-gray-500">{formatDateTime(n.created_at)}</p></>
            return <li key={n.id} className="rounded-xl bg-white p-3 shadow-sm">{href ? <Link href={href}>{body}</Link> : body}</li>
          })}
        </ul>
      )}
      {items.some((n) => !n.read) && <MarkRead />}
    </AppShell>
  )
}

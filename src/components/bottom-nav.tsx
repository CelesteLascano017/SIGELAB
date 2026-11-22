'use client'
import Link from '@/components/navigation-link'
import { usePathname } from 'next/navigation'
import { CalendarDays, ClipboardList, FlaskConical, History, Inbox, ScanLine } from 'lucide-react'
import type { Role } from '@/types'

type Item = { href: string; label: string; icon: React.ReactNode; match: string[] }

function itemsFor(role: Role): [Item, Item] {
  if (role === 'admin') return [
    { href: '/admin/requests', label: 'Solicitudes', icon: <Inbox size={20} />, match: ['/admin/requests'] },
    { href: '/admin/reservations', label: 'Reservas', icon: <History size={20} />, match: ['/admin/reservations'] },
  ]
  if (role === 'professor') return [
    { href: '/laboratories', label: 'Laboratorios', icon: <FlaskConical size={20} />, match: ['/laboratories', '/availability', '/reservations'] },
    { href: '/my-requests', label: 'Solicitudes', icon: <ClipboardList size={20} />, match: ['/my-requests'] },
  ]
  return [
    { href: '/laboratories', label: 'Laboratorios', icon: <FlaskConical size={20} />, match: ['/laboratories'] },
    { href: '/availability', label: 'Horarios', icon: <CalendarDays size={20} />, match: ['/availability'] },
  ]
}

export function BottomNav({ role, pending = 0 }: { role: Role; pending?: number }) {
  const path = usePathname()
  const [left, right] = itemsFor(role)
  const cell = (i: Item) => {
    const active = i.match.some((m) => path.startsWith(m))
    return (
      <Link key={i.href} href={i.href} aria-current={active ? 'page' : undefined}
        className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? (role === 'admin' ? 'text-admin' : 'text-brand') : 'text-gray-400'}`}>
        <span className="relative">{i.icon}{i.href === '/admin/requests' && pending > 0 && <span data-testid="pending-badge" className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{pending}</span>}</span>{i.label}
      </Link>
    )
  }
  return (
    <nav className="sticky bottom-0 z-20 flex items-end border-t border-gray-200 bg-white" aria-label="Navegación principal">
      {cell(left)}
      <div className="flex flex-1 flex-col items-center">
        <Link href="/scan" aria-label="Escanear QR" className={`-mt-6 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ${role === 'admin' ? 'bg-admin' : 'bg-brand'}`}><ScanLine size={22} /></Link>
        <span className="pb-2 pt-0.5 text-[11px] font-medium text-gray-700">Escanear QR</span>
      </div>
      {cell(right)}
    </nav>
  )
}

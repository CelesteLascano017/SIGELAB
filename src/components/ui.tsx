import Link from '@/components/navigation-link'
import { AlertTriangle, CheckCircle2, Clock, Lock, MinusCircle, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RequestStatus, SlotStatus } from '@/types'
import { SLOT_STATUS_LABEL, STATUS_LABEL } from '@/lib/domain/labels'

const STATUS_STYLE: Record<RequestStatus, string> = {
  pending: 'bg-orange-50 text-orange-700 border-orange-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
}
const STATUS_ICON: Record<RequestStatus, ReactNode> = {
  pending: <Clock size={12} />, approved: <CheckCircle2 size={12} />, rejected: <XCircle size={12} />, cancelled: <MinusCircle size={12} />,
}

export function StatusChip({ status }: { status: RequestStatus }) {
  return (
    <span data-testid="status-chip" className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>
      {STATUS_ICON[status]}{STATUS_LABEL[status]}
    </span>
  )
}
export function ConflictChip({ blocked }: { blocked?: boolean }) {
  return (
    <span data-testid="conflict-chip" className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
      <AlertTriangle size={12} />{blocked ? 'Bloqueada' : 'Conflicto'}
    </span>
  )
}

export const SLOT_STYLE: Record<SlotStatus, string> = {
  free: 'bg-white border-gray-200 text-gray-900',
  requested: 'bg-orange-50 border-orange-200 text-orange-700',
  reserved: 'bg-red-50 border-red-300 text-red-700',
  class: 'bg-gray-100 border-gray-200 text-gray-400',
  unavailable: 'bg-gray-100 border-gray-200 text-gray-400',
}
export const SLOT_TEXT_STYLE: Record<SlotStatus, string> = {
  free: 'text-green-700', requested: 'text-orange-600', reserved: 'text-red-600', class: 'text-red-500', unavailable: 'text-gray-500',
}
export const slotStatusText = (s: SlotStatus) => SLOT_STATUS_LABEL[s]

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm">{icon ?? <Lock size={26} />}</div>
      <p className="font-semibold text-gray-900">{title}</p>
      {children && <p className="mt-1 text-sm text-gray-500">{children}</p>}
    </div>
  )
}

export function Notice({ tone, title, children }: { tone: 'warning' | 'info' | 'ok' | 'error'; title: string; children?: ReactNode }) {
  const styles = {
    warning: 'bg-orange-50 border-orange-200 text-orange-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    ok: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-800',
  }[tone]
  return (
    <div className={`rounded-xl border p-3 text-sm ${styles}`}>
      <p className="font-semibold">{title}</p>
      {children && <p className="mt-0.5 opacity-90">{children}</p>}
    </div>
  )
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white">{children}</Link>
}

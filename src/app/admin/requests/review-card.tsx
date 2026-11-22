'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Check, X } from 'lucide-react'
import { approveRequestAction, rejectRequestAction } from '@/actions/requests'
import { ConflictChip, StatusChip } from '@/components/ui'
import { formatShortDate, slotLabel, TYPE_LABEL } from '@/lib/domain/labels'
import type { AdminReservation, TimeSlot } from '@/types'

export function ReviewCard({ r, slot }: { r: AdminReservation; slot: TimeSlot }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => {
    setError(null)
    const res = await fn()
    if (res.ok) { setRejecting(false); router.refresh() } else setError(res.error ?? 'Error')
  })

  return (
    <article data-testid={`review-${r.code}`} className={`rounded-2xl border bg-white p-3 shadow-sm ${r.is_blocked ? 'border-orange-300 ring-1 ring-orange-300' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">{r.code}</span><span className="flex gap-1">{r.is_blocked ? <ConflictChip blocked /> : r.has_conflict && <ConflictChip />}<StatusChip status={r.status} /></span></div>
      <p className="mt-1 text-sm font-semibold">{r.lab_name}</p>
      <p className="text-xs text-gray-500">{r.requester_name} · {TYPE_LABEL[r.reservation_type]}</p>
      <p className="mt-0.5 text-xs text-gray-500">{r.reason}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><CalendarDays size={12} />{formatShortDate(r.date)} · {slotLabel(slot)}</p>
      {r.is_blocked && <p role="alert" className="mt-2 rounded-lg bg-orange-50 p-2 text-xs text-orange-800">No se puede aprobar: el laboratorio ya está reservado o tiene clase en ese horario.</p>}
      {rejecting ? (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-medium">Motivo del rechazo *
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} aria-label="Motivo del rechazo" className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm" />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setRejecting(false); setError(null) }} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold">Volver</button>
            <button type="button" disabled={pending} onClick={() => run(() => rejectRequestAction(r.id, reason))} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white disabled:opacity-60">Confirmar rechazo</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button type="button" disabled={pending} onClick={() => setRejecting(true)} className="flex-1 rounded-lg border border-red-300 py-2 text-sm font-semibold text-red-600"><X size={14} className="mr-1 inline" />Rechazar</button>
          <button type="button" disabled={pending || r.is_blocked} onClick={() => run(() => approveRequestAction(r.id))} className="flex-1 rounded-lg bg-admin py-2 text-sm font-semibold text-white disabled:opacity-50"><Check size={14} className="mr-1 inline" />Aprobar</button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </article>
  )
}

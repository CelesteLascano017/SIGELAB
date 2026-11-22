import type { RequestStatus, ReservationType, Role, SlotStatus, TimeSlot } from '@/types'

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada', cancelled: 'Cancelada',
}
export const SLOT_STATUS_LABEL: Record<SlotStatus, string> = {
  free: 'Libre', requested: 'Solicitado', reserved: 'Reservado', class: 'Clase', unavailable: 'No disponible',
}
export const TYPE_LABEL: Record<ReservationType, string> = {
  class_recovery: 'Clase de recuperación', exam: 'Examen', cultural_event: 'Evento cultural', other: 'Otro',
}
export const ROLE_LABEL: Record<Role, string> = { student: 'Estudiante', professor: 'Docente', admin: 'Administrador' }
export const RESERVATION_TYPES = Object.keys(TYPE_LABEL) as ReservationType[]

const hhmm = (t: string) => t.slice(0, 5)
export const slotLabel = (s: Pick<TimeSlot, 'start_time' | 'end_time'>) => `${hhmm(s.start_time)} – ${hhmm(s.end_time)}`
export const slotShort = (s: Pick<TimeSlot, 'start_time' | 'end_time'>) => `${hhmm(s.start_time)}–${hhmm(s.end_time)}`

const TZ = 'America/Guayaquil'
/** Today's date (YYYY-MM-DD) in Ecuador time. */
export function todayLocal(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}
export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10)
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export function formatLongDate(iso: string) {
  return cap(new Intl.DateTimeFormat('es-EC', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso + 'T12:00:00Z')).replace(',', ''))
}
export function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat('es-EC', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(iso + 'T12:00:00Z')).replace(/[.,]/g, '')
}
/** "14 nov · 08:35" in Ecuador time, 24h (as in the prototype). */
export function formatDateTime(iso: string) {
  const d = new Date(iso)
  const day = new Intl.DateTimeFormat('es-EC', { timeZone: TZ, day: 'numeric', month: 'short' }).format(d).replace(/\./g, '')
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
  return `${day} · ${time}`
}
export function dayParts(iso: string) {
  const d = new Date(iso + 'T12:00:00Z')
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-EC', { timeZone: 'UTC', ...o }).format(d).replace(/\./g, '')
  return { weekday: f({ weekday: 'short' }).toUpperCase(), day: f({ day: 'numeric' }), month: f({ month: 'short' }) }
}
export function isValidIsoDate(s: string | undefined): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const date = new Date(s + 'T12:00:00Z')
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === s
}

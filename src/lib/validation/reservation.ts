import { z } from 'zod'
import { RESERVATION_TYPES } from '@/lib/domain/labels'

export const reservationInputSchema = z.object({
  labId: z.string().uuid('Selecciona un laboratorio'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona una fecha'),
  slotId: z.coerce.number().int().min(1, 'Selecciona un horario').max(7, 'Selecciona un horario'),
  type: z.enum(RESERVATION_TYPES as [string, ...string[]], { error: 'Selecciona el tipo de reserva' }),
  attendees: z.coerce.number({ error: 'Indica el número de asistentes' }).int('Debe ser un número entero').min(1, 'Debe ser al menos 1'),
  reason: z.string().trim().min(1, 'Describe el motivo de la solicitud').max(500, 'Máximo 500 caracteres'),
})
export type ReservationInput = z.infer<typeof reservationInputSchema>

/** Returns an error message when attendees exceed capacity (client-side mirror of the DB rule). */
export function capacityError(attendees: number, capacity: number): string | null {
  return attendees > capacity ? `El número de asistentes (${attendees}) supera la capacidad del laboratorio (${capacity}).` : null
}

export const rejectionSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().trim().min(1, 'Debes indicar el motivo del rechazo').max(500),
})

export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const i of err.issues) { const k = String(i.path[0] ?? '_'); if (!out[k]) out[k] = i.message }
  return out
}

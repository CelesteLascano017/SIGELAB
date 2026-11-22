const MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: 'Debes iniciar sesión.',
  FORBIDDEN: 'No tienes permisos para realizar esta operación.',
  MISSING_FIELDS: 'Completa todos los campos obligatorios.',
  LAB_NOT_FOUND: 'El laboratorio seleccionado no existe.',
  INVALID_SLOT: 'El horario seleccionado no es válido.',
  PAST_DATE: 'No puedes reservar en una fecha pasada.',
  INVALID_ATTENDEES: 'El número de asistentes debe ser mayor a cero.',
  CAPACITY_EXCEEDED: 'El número de asistentes supera la capacidad del laboratorio.',
  SLOT_UNAVAILABLE: 'El laboratorio no está disponible en ese horario.',
  REQUEST_NOT_FOUND: 'La solicitud no existe.',
  NOT_PENDING: 'La solicitud ya no está pendiente de revisión.',
  CONFLICT: 'No se puede aprobar: existe un conflicto con una reserva confirmada.',
  REASON_REQUIRED: 'Debes indicar el motivo del rechazo.',
  NOT_CANCELLABLE: 'Esta solicitud no se puede cancelar.',
}

/** Map a database error (RPC raises coded messages) to a user-facing Spanish message. */
export function dbErrorMessage(message: string | undefined | null): string {
  if (!message) return 'Ocurrió un error inesperado.'
  const code = Object.keys(MESSAGES).find((c) => message.includes(c))
  return code ? MESSAGES[code] : 'Ocurrió un error inesperado. Intenta nuevamente.'
}
export const dbErrorCode = (message: string | undefined | null) =>
  Object.keys(MESSAGES).find((c) => message?.includes(c)) ?? null

type ParsedQr = { ok: true; code: string } | { ok: false; error: string }

export function parseLabQr(value: unknown): ParsedQr {
  if (typeof value !== 'string' || value.length > 128) return { ok: false, error: 'Este QR no pertenece a un laboratorio de SIGELAB.' }
  const match = /^SIGELAB:LAB:(LAB-(?:0[1-9]|[1-9][0-9]))$/.exec(value.trim())
  return match ? { ok: true, code: match[1] } : { ok: false, error: 'Este QR no pertenece a un laboratorio de SIGELAB.' }
}

export function cameraErrorMessage(error: unknown): string {
  const name = typeof error === 'object' && error !== null && 'name' in error ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Necesitamos tu permiso para usar la cámara. Actívalo en el navegador o sube una imagen del QR.'
  if (name === 'NotFoundError') return 'No encontramos una cámara en este dispositivo. Puedes subir una imagen del QR.'
  if (name === 'NotReadableError') return 'La cámara está siendo utilizada por otra aplicación. Ciérrala e inténtalo de nuevo.'
  return 'No pudimos abrir la cámara. Reintenta o sube una imagen del QR.'
}

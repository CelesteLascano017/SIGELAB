'use client'
import { useEffect, useState } from 'react'
import { markNotificationsReadAction } from '@/actions/notifications'

/** Marks notifications as read after the list has been shown, then refreshes the header badge. */
export function MarkRead({ ids }: { ids: string[] }) {
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const key = ids.join(',')
  useEffect(() => {
    let active = true
    markNotificationsReadAction(key.split(','))
      .then((result) => { if (active && !result.ok) setError(result.error) })
      .catch(() => { if (active) setError('No pudimos actualizar las notificaciones. Comprueba tu conexión.') })
    return () => { active = false }
  }, [key, attempt])
  return error ? <div role="alert" className="m-4 text-sm text-red-700"><p>{error}</p><button type="button" className="min-h-10 font-semibold underline" onClick={() => { setError(null); setAttempt((n) => n + 1) }}>Reintentar</button></div> : null
}

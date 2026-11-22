'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@heroui/react'
import { cancelRequestAction } from '@/actions/requests'

export function CancelButton({ id }: { id: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  return (
    <div>
      <Button variant="outline" fullWidth isPending={pending} onPress={() => start(async () => { const r = await cancelRequestAction(id); if (r.ok) router.refresh(); else setError(r.error) })}>Cancelar solicitud</Button>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}

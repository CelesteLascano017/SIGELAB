'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { markNotificationsReadAction } from '@/actions/notifications'

/** Marks notifications as read after the list has been shown, then refreshes the header badge. */
export function MarkRead() {
  const router = useRouter()
  useEffect(() => { markNotificationsReadAction().then(() => router.refresh()) }, [router])
  return null
}

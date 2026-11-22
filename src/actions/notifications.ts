'use server'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { markAllRead } from '@/services/requests'

export async function markNotificationsReadAction() {
  await requireUser()
  await markAllRead(await createClient())
  revalidatePath('/notifications')
}

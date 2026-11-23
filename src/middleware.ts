import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

// Temporary Edge entrypoint: OpenNext 1.20.18 breaks Node proxy requests with cookies.
// https://github.com/opennextjs/opennextjs-cloudflare/issues/1506
export async function middleware(request: NextRequest) { return updateSession(request) }

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] }

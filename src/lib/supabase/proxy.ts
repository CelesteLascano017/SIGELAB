import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login']

/** Refreshes the Supabase session cookie and redirects anonymous visitors to /login. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims
  const isPublic = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p))
  if (!user && !isPublic) {
    const url = request.nextUrl.clone(); url.pathname = '/login'; url.search = ''
    const redirect = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone(); url.pathname = '/'
    const redirect = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    return redirect
  }
  return response
}

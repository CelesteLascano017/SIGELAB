/** Safety guard for every script/test that touches Supabase: only the SIGELAB project is allowed. */
export const SIGELAB_REF = 'tafggedejddofnpilspx'
export function sigelabEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const host = url ? new URL(url).hostname : ''
  if (host !== `${SIGELAB_REF}.supabase.co` || process.env.SIGELAB_EXPECTED_PROJECT_REF !== SIGELAB_REF)
    throw new Error(`Refusing to run: project ref is not ${SIGELAB_REF}`)
  return { url, anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, service: process.env.SUPABASE_SERVICE_ROLE_KEY! }
}

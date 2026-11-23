import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const nextRequire = createRequire(require.resolve('next/package.json'))
const { loadEnvConfig } = nextRequire('@next/env')
loadEnvConfig(process.cwd(), false)

const fail = (name) => {
  console.error(`Build configuration error: set ${name} in Cloudflare Build variables as well as Runtime variables. Values are not printed.`)
  process.exit(1)
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
if (!url) fail('NEXT_PUBLIC_SUPABASE_URL')
try { if (!['https:', 'http:'].includes(new URL(url).protocol)) fail('NEXT_PUBLIC_SUPABASE_URL') }
catch { fail('NEXT_PUBLIC_SUPABASE_URL') }
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) fail('NEXT_PUBLIC_SUPABASE_ANON_KEY')
console.log('Supabase build configuration verified (values hidden).')

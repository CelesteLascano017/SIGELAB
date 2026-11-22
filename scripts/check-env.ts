/** Verifies .env.local WITHOUT printing any secret. Run: npm run check:env */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const get = (k: string) => process.env[k]?.trim() ?? ''
const url = get('NEXT_PUBLIC_SUPABASE_URL'), pub = get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const sec = get('SUPABASE_SERVICE_ROLE_KEY'), expected = get('SIGELAB_EXPECTED_PROJECT_REF')
const out: [boolean, string][] = []
const ok = (c: boolean, m: string) => out.push([c, m])

let ref = ''
try { ref = new URL(url).hostname.replace(/\.supabase\.co$/, ''); ok(/^https:\/\/[a-z0-9]{20}\.supabase\.co\/?$/.test(url), `URL con formato https://<ref>.supabase.co → ref detectado: "${ref}"`) }
catch { ok(false, 'NEXT_PUBLIC_SUPABASE_URL vacío o inválido') }
ok(!!expected && expected === ref, `SIGELAB_EXPECTED_PROJECT_REF ("${expected || 'vacío'}") coincide con el ref de la URL`)
ok(pub.startsWith('sb_publishable_') || pub.split('.').length === 3, `Publishable key presente (${pub ? pub.slice(0, 15) + '…' : 'vacía'})`)
ok(!pub.startsWith('sb_secret_'), 'La clave pública NO es una secret key')
ok(sec.startsWith('sb_secret_') || sec.split('.').length === 3, `Secret key presente (${sec ? sec.slice(0, 10) + '…' : 'vacía'})`)
ok(!!sec && sec !== pub, 'Secret key distinta de la publishable')

const gi = readFileSync('.gitignore', 'utf8').split('\n').map((l) => l.trim())
ok(gi.includes('.env.local') || gi.includes('.env.*') || gi.includes('.env*'), '.gitignore excluye .env.local')
ok(gi.includes('!.env.example'), '.gitignore conserva .env.example')

const dir = 'supabase/migrations'
const hits: string[] = []
for (const f of readdirSync(dir)) {
  const t = readFileSync(join(dir, f), 'utf8')
  if (/supabase\.co|supabase_url|project[-_ ]?ref|sb_(secret|publishable)_|eyJ[A-Za-z0-9_-]{20,}/i.test(t)) hits.push(f)
}
ok(hits.length === 0, `Migraciones sin referencias a proyectos/claves (${readdirSync(dir).length} archivos)${hits.length ? ': ' + hits.join(', ') : ''}`)

for (const [c, m] of out) console.log(`${c ? 'OK  ' : 'FALLA'} ${m}`)
process.exit(out.every(([c]) => c) ? 0 : 1)

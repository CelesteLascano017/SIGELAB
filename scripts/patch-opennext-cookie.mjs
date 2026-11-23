import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'
import { patchCookieConverter } from './lib/opennext-cookie-patch.mjs'

// OpenNext #1506. Keep this version-bound until an upstream fix is released
// and verified in workerd. Never fetch or execute a patch during installation.
const require = createRequire(import.meta.url)
const adapterRequire = createRequire(require.resolve('@opennextjs/cloudflare'))
const target = adapterRequire.resolve('@opennextjs/aws/overrides/converters/edge.js')
const packageFile = resolve(dirname(target), '../../../package.json')
const { version } = JSON.parse(readFileSync(packageFile, 'utf8'))
if (version !== '4.2.0') throw new Error(`OpenNext AWS ${version} is not covered by the cookie compatibility patch. Review before upgrading.`)
const source = readFileSync(target, 'utf8')
const patched = patchCookieConverter(source)
if (patched !== source) writeFileSync(target, patched)
console.log(`OpenNext AWS ${version}: named cookie import ${patched === source ? 'already verified' : 'applied'} (#1506).`)

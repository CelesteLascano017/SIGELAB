import { describe, expect, it } from 'vitest'
import { transformSync } from 'esbuild'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { patchCookieConverter } from '../../scripts/lib/opennext-cookie-patch.mjs'

const require = createRequire(import.meta.url)
const source = `import cookieParser from "cookie";
export function convertFrom(header) { return cookieParser.parse(header); }`

function bundleAndRead(input: string) {
  // The adapter's resolver loses package ESM metadata (#1506). This is the
  // resulting CommonJS interop, using the installed cookie package, not a mock.
  const { code } = transformSync(input, { format: 'cjs', sourcefile: 'edge.js' })
  const module = { exports: {} as { convertFrom: (header: string) => Record<string, string> } }
  runInNewContext(code, { module, exports: module.exports, require })
  return module.exports.convertFrom('session=abc; preference=dark')
}

describe('OpenNext cookie interop regression', () => {
  it('reproduces the converter crash with the unpatched default import', () => {
    expect(() => bundleAndRead(source)).toThrow(/parse/)
  })
  it('parses real request cookies after the compatibility patch', () => {
    expect(bundleAndRead(patchCookieConverter(source))).toEqual({ session: 'abc', preference: 'dark' })
  })
  it('is safe to apply again during install and build', () => {
    expect(bundleAndRead(patchCookieConverter(patchCookieConverter(source)))).toEqual({ session: 'abc', preference: 'dark' })
  })
  it('refuses unknown converter implementations instead of silently shipping unpatched code', () => {
    expect(() => patchCookieConverter('export default function unknown() {}')).toThrow()
  })
})

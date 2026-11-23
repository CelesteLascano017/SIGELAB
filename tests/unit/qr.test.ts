import { describe, it, expect } from 'vitest'
import { parseLabQr, cameraErrorMessage } from '@/lib/domain/qr'

describe('laboratory QR contract', () => {
  it.each(['LAB-01', 'LAB-03', 'LAB-08', 'LAB-99'])('recognizes a catalog code without a deployment hostname: %s', (code) => {
    expect(parseLabQr(`SIGELAB:LAB:${code}`)).toEqual({ ok: true, code })
  })
  it.each(['https://example.com/laboratories/1', 'javascript:alert(1)', 'LAB-01', 'SIGELAB:LAB:../admin', 'SIGELAB:LAB:LAB-00', '', 'SIGELAB:LAB:LAB-01\nextra'])('rejects non-laboratory payloads: %s', (value) => {
    expect(parseLabQr(value).ok).toBe(false)
  })
  it('accepts surrounding scanner whitespace without altering the code', () => {
    expect(parseLabQr('  SIGELAB:LAB:LAB-03\n')).toEqual({ ok: true, code: 'LAB-03' })
  })
  it('maps permission and device failures to actionable messages', () => {
    expect(cameraErrorMessage({ name: 'NotAllowedError' })).toContain('permiso')
    expect(cameraErrorMessage({ name: 'NotFoundError' })).toContain('cámara')
    expect(cameraErrorMessage({ name: 'NotReadableError' })).toContain('otra aplicación')
  })
})

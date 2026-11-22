import { afterEach, describe, expect, it, vi } from 'vitest'
import { openCamera } from '@/lib/qr/camera'

afterEach(() => vi.unstubAllGlobals())

function cameraFixture() {
  const stop = vi.fn()
  const stream = { getTracks: () => [{ stop }] }
  const video = { srcObject: null, play: vi.fn().mockResolvedValue(undefined) } as unknown as HTMLVideoElement
  return { stop, stream, video }
}

describe('camera lifetime', () => {
  it('releases a stream granted after the screen has closed', async () => {
    const { stream, stop, video } = cameraFixture()
    let grant!: (stream: unknown) => void
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: () => new Promise((resolve) => { grant = resolve }) } })
    const controller = new AbortController()
    const opening = openCamera(video, controller.signal)
    controller.abort(); grant(stream)
    await expect(opening).rejects.toMatchObject({ name: 'AbortError' })
    expect(stop).toHaveBeenCalledOnce()
    expect(video.srcObject).toBeNull()
  })
  it('turns the camera off when the screen closes', async () => {
    const { stream, stop, video } = cameraFixture()
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: async () => stream } })
    const controller = new AbortController()
    await openCamera(video, controller.signal)
    expect(video.srcObject).toBe(stream)
    controller.abort()
    expect(stop).toHaveBeenCalledOnce()
    expect(video.srcObject).toBeNull()
  })
})

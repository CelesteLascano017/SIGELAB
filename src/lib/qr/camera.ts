export async function openCamera(video: HTMLVideoElement, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted()
  const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } })
  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    stream.getTracks().forEach((track) => track.stop())
    if (video.srcObject === stream) video.srcObject = null
  }
  if (signal.aborted) { stop(); signal.throwIfAborted() }
  signal.addEventListener('abort', stop, { once: true })
  video.srcObject = stream
  try { await video.play() }
  catch (error) { stop(); signal.removeEventListener('abort', stop); throw error }
  if (signal.aborted) { stop(); signal.throwIfAborted() }
}

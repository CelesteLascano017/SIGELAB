/** Loaded only by the scanner, never by catalog or reservation pages. */
export async function createQrDecoder() {
  const { default: jsQR } = await import('jsqr')
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('No se pudo procesar la imagen.')
  return (source: CanvasImageSource, width: number, height: number): string | null => {
    const scale = Math.min(1, 960 / Math.max(width, height))
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    context.drawImage(source, 0, 0, canvas.width, canvas.height)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    return jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'dontInvert' })?.data ?? null
  }
}

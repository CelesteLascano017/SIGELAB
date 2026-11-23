import QRCode from 'qrcode'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const output = join(process.cwd(), 'public', 'qr')
const examples = [
  { file: 'lab-01', title: 'Ingeniería de Software A', payload: 'SIGELAB:LAB:LAB-01', expected: 'Abre LAB-01' },
  { file: 'lab-03', title: 'Redes y Conectividad', payload: 'SIGELAB:LAB:LAB-03', expected: 'Abre LAB-03' },
  { file: 'lab-08', title: 'Bases de Datos', payload: 'SIGELAB:LAB:LAB-08', expected: 'Abre LAB-08' },
  { file: 'unknown-lab', title: 'Laboratorio no registrado', payload: 'SIGELAB:LAB:LAB-99', expected: 'Muestra laboratorio no registrado' },
  { file: 'invalid', title: 'Código ajeno a SIGELAB', payload: 'https://example.com', expected: 'Rechaza el código' },
]
await mkdir(output, { recursive: true })
for (const example of examples) {
  await QRCode.toFile(join(output, `${example.file}.png`), example.payload, { width: 640, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#111827', light: '#ffffff' } })
}
await writeFile(join(output, 'manifest.json'), JSON.stringify(examples, null, 2) + '\n')
console.log(`Generated ${examples.length} synthetic QR images in public/qr (no database writes).`)

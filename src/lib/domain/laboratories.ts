import type { Lab } from '@/types'

export const NO_INFO = 'Sin información registrada'

export interface EquipmentNotice {
  tone: 'warning' | 'info' | 'ok'
  title: string
  body: string
}

/** "¿Debo llevar mi equipo?" notice (HU-01 CA-01.3 / CA-01.4). */
export function equipmentNotice(lab: Pick<Lab, 'computers_count' | 'capacity'>): EquipmentNotice {
  const pcs = lab.computers_count
  if (pcs === null) {
    return {
      tone: 'info',
      title: '¿Debo llevar mi equipo? Sin información',
      body: 'Este laboratorio no tiene registradas sus computadoras. Consulta con el personal técnico antes de tu clase.',
    }
  }
  if (pcs >= lab.capacity) {
    return { tone: 'ok', title: '¿Debo llevar mi equipo? No', body: `Hay ${pcs} PCs para ${lab.capacity} personas: no necesitas traer laptop.` }
  }
  return {
    tone: 'warning',
    title: `¿Debo llevar mi equipo? Hay ${pcs} PCs para ${lab.capacity} personas`,
    body: `Si tu grupo supera ${pcs} estudiantes, recomienda que algunos traigan laptop o trabajen en parejas.`,
  }
}

export const needsLaptop = (lab: Pick<Lab, 'computers_count' | 'capacity'>) =>
  lab.computers_count !== null && lab.computers_count < lab.capacity

export type LabFilter = 'all' | 'computers' | 'laptop'

export function filterLabs(labs: Lab[], query: string, filter: LabFilter): Lab[] {
  const q = query.trim().toLowerCase()
  return labs.filter((l) => {
    if (filter === 'computers' && !(l.computers_count && l.computers_count > 0)) return false
    if (filter === 'laptop' && !needsLaptop(l)) return false
    if (!q) return true
    const hay = [l.name, l.code, l.room, l.building, l.floor, ...(l.software ?? [])].join(' ').toLowerCase()
    return hay.includes(q)
  })
}

export const locationLabel = (l: Pick<Lab, 'building' | 'floor' | 'room'>) => `${l.building} · ${l.floor} · ${l.room}`

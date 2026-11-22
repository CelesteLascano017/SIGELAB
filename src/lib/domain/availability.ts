import type { AvailabilityCell, Lab, TimeSlot } from '@/types'

export interface LabAvailability { lab: Lab; cells: AvailabilityCell[] }

export function groupAvailability(labs: Lab[], cells: AvailabilityCell[]): LabAvailability[] {
  return labs.map((lab) => ({ lab, cells: cells.filter((c) => c.lab_id === lab.id).sort((a, b) => a.slot_id - b.slot_id) }))
}

/** A lab is "available" if it has at least one free slot among `slotIds` (all slots when empty). */
export function freeSlots(item: LabAvailability, slotIds?: number | null): number[] {
  return item.cells.filter((c) => c.status === 'free' && (slotIds == null || c.slot_id === slotIds)).map((c) => c.slot_id)
}

export function filterAvailable(items: LabAvailability[], slotId?: number | null): LabAvailability[] {
  return items.filter((i) => freeSlots(i, slotId).length > 0)
}

export function slotsFor(slots: TimeSlot[], slotId?: number | null) {
  return slotId == null ? slots : slots.filter((s) => s.id === slotId)
}

export type Role = 'student' | 'professor' | 'admin'
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type ReservationType = 'class_recovery' | 'exam' | 'cultural_event' | 'other'
export type SlotStatus = 'free' | 'requested' | 'reserved' | 'class' | 'unavailable'

export interface SessionUser { id: string; email: string; fullName: string; role: Role }

export interface Lab {
  id: string; code: string; name: string; building: string; floor: string; room: string
  capacity: number
  computers_count: number | null; has_projector: boolean | null
  software: string[] | null; extra_equipment: string[] | null
}
export interface TimeSlot { id: number; start_time: string; end_time: string }
export interface AvailabilityCell { lab_id: string; slot_id: number; status: SlotStatus; reserved_code: string | null }

export interface ReservationRequest {
  id: string; code: string; requester_id: string; lab_id: string; date: string; slot_id: number
  reservation_type: ReservationType; attendees: number; reason: string; status: RequestStatus
  rejection_reason: string | null; reviewed_at: string | null; created_at: string
}
export interface RequestWithLab extends ReservationRequest { lab: Pick<Lab, 'id' | 'code' | 'name' | 'capacity'> }
export interface StatusHistoryEntry { id: string; from_status: RequestStatus | null; to_status: RequestStatus; reason: string | null; changed_at: string }
export interface AdminReservation {
  id: string; code: string; requester_name: string; lab_id: string; lab_name: string; lab_code: string
  date: string; slot_id: number; reservation_type: ReservationType; attendees: number; reason: string
  status: RequestStatus; created_at: string; has_conflict: boolean; is_blocked: boolean
}
export interface AppNotification { id: string; request_id: string | null; message: string; read: boolean; created_at: string }

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string; fieldErrors?: Record<string, string> }

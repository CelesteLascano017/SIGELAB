# Base de datos (PostgreSQL / Supabase)
Migraciones en `supabase/migrations` (aplicar en orden, una vez): `01_schema`, `02_functions`, `03_rls`, `04_sync_profile_role`; luego `supabase/seed.sql`.

**Enums:** `user_role`, `request_status`, `reservation_type`.
**Tablas (8):** `profiles`, `labs`, `time_slots` (7 bloques de 2 h), `class_schedules`, `lab_unavailability`, `reservation_requests`, `request_status_history`, `notifications`.
**Integridad:** FK con `restrict` desde solicitudes; `check` de capacidad, asistentes y motivos; **índice único parcial** `(lab_id, date, slot_id) where status='approved'`.
**Funciones (RPC, `SECURITY DEFINER`, `search_path=''`):** `create_reservation_request`, `approve_reservation_request`, `reject_reservation_request`, `cancel_reservation_request`, `get_availability`, `slot_status`, `list_reservations_admin`. Internas sin acceso de clientes: `log_status_change`, `sync_profile_role`, `handle_new_user`.
**RLS (8 tablas, 12 políticas):** perfiles propios; catálogos legibles por autenticados y editables solo por admin; solicitudes/historial visibles solo al dueño o admin; notificaciones privadas; sin escritura directa en solicitudes.
**Roles:** `profiles.role` se llena desde `auth.users.raw_app_meta_data` (solo servidor).

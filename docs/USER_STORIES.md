# Historias de usuario y criterios de aceptación

Fuente: `Prototipos_SIGELAB_Grupo7.pdf` (22 pantallas) y el enunciado del encargo. **Las HU completas con pasos/precondiciones originales no se proporcionaron;** los CA se numeran como figuran en el PDF y su redacción proviene del enunciado. Si difieren de las HU oficiales, ajustar aquí.

| HU | CA (PDF) | Criterio | Implementación | Prueba |
|----|----------|----------|----------------|--------|
| HU-01 | 01.1, 01.2 | Lista de laboratorios con total, ubicación, capacidad, equipamiento | `laboratories/page.tsx` | db: "lists all labs"; unit: filtros |
| HU-01 | 01.3 | Detalle + aviso «¿Debo llevar mi equipo?» | `laboratories/[id]`, `equipmentNotice` | unit: notice |
| HU-01 | 01.4 | «Sin información registrada» | `NO_INFO`, columnas NULL | db: NULL; unit |
| HU-01 | 01.5 | «No hay laboratorios registrados» | `EmptyState` | unit: lista vacía |
| HU-02 | 02.1, 02.2 | Disponibilidad por fecha, bloques Libre/Solicitado/Reservado/Clase/No disponible | `get_availability`, `availability/page.tsx` | db: Solicitado→Reservado→Libre |
| HU-02 | 02.3 | Filtro «Solo laboratorios disponibles» + conteo | `filterAvailable` | unit |
| HU-02 | 02.5 | «No hay laboratorios disponibles» | `Notice` | unit |
| HU-03 | 03.1, 03.2 | Formulario y verificación de disponibilidad previa | `reservation-form.tsx` | e2e: validaciones, disponibilidad, registro y persistencia |
| HU-03 | 03.3 | Choque con reserva confirmada → «No disponible» | RPC `SLOT_UNAVAILABLE` + índice único | db |
| HU-03 | 03.5 | Campos obligatorios, capacidad, tipo de reserva | zod + RPC | unit + db |
| HU-03 | — | Código `SOL-…`, estado Pendiente | `create_reservation_request` | db |
| HU-04 | 04.1–04.4, 04.6 | Listado, filtros lab/estado/conflicto, etiqueta «Conflicto», vacío | `admin/reservations`, `list_reservations_admin` | db + unit |
| HU-05 | 05.1–05.3, 05.5 | Mis solicitudes, filtro, detalle, motivo de rechazo | `my-requests/*` | db (RLS/historial) |
| HU-05 | 05.6 | Solicitudes ajenas → «Acceso restringido» | RLS + redirect `/restricted` | db: ajenas ocultas |
| HU-05 | — | Notificaciones de cambio de estado | tabla `notifications` + `/notifications` | db |
| HU-06 | 06.1, 06.2 | Pendientes, aprobar/rechazar | `admin/requests` | db |
| HU-06 | 06.3, 06.4 | Bloqueo por conflicto con reserva confirmada | `approve_*` + `is_blocked` | db (concurrencia) |
| HU-06 | — | Motivo obligatorio e historial | `reject_*`, `request_status_history` | db |
| HU-06 | 06.7 | Solo administradores | `requireRole` + RPC + RLS | db |

## Estado de verificación (real)
Todas las filas anteriores están implementadas y se verifican en **PGlite**, **Supabase real (API)** y **navegador** según `TEST_EVIDENCE.md`. Excepciones: los estados vacíos 01.5, 02.5 y 04.6 se verifican con el gancho de QA (`?__empty=1`), no con una base realmente vacía.

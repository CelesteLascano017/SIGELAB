# Evidencias de pruebas (ejecución real, 2026-11-21)

Las pruebas están separadas por capa. **Cada una se ejecutó y sus resultados son los reales.**

| Capa | Comando | Contra qué corre | Resultado |
|------|---------|------------------|-----------|
| TypeScript | `npm run lint` | — | sin errores |
| Unitarias (18) + **PGlite** (34) | `npm test` | PostgreSQL local embebido con las migraciones reales y un stub de `auth` | **52/52** |
| **Supabase real** (API) | `npm run test:live` | Proyecto SIGELAB `tafggedejddofnpilspx`, sesiones reales de las cuentas demo | **20/20** (2 ejecuciones seguidas) |
| Verificación del proyecto | `npm run verify:supabase` | SIGELAB, solo lectura | **27/27 OK** (8 tablas, 7 RPC, 8 labs, 7 bloques, `anon` bloqueado) |
| **Navegador** (Playwright + Chromium, 390×844) | `npm run test:e2e` | App en `next dev` + Supabase real | **23/23** |
| Build de producción | `npm run build` | — | OK; escaneo de `.next`: 0 secretos |

## Qué cubre cada capa
- **PGlite** (`tests/db`): RPC y RLS como rol `authenticated`; solapamientos (RPC + índice único), aprobación/rechazo, historial, notificaciones, cancelación (con `from_status` original), roles por `app_metadata`, escalada de rol imposible.
- **Live** (`tests/live`): lo mismo contra Postgres real de Supabase, más: roles sincronizados, `user_metadata` no concede roles, `anon` sin acceso, inserciones/updates/deletes directos bloqueados, catálogo no editable, notificaciones privadas, funciones internas no invocables.
- **E2E** (`e2e`): login/logout/rutas protegidas, HU-01 a HU-06 de punta a punta con los tres roles, validaciones, estados vacíos, solicitudes ajenas, restricciones de rol, persistencia tras recarga, y **calidad** (0 errores de consola y 0 incidencias críticas/serias de axe-core WCAG A/AA en las pantallas auditadas).

## Hallazgos corregidos gracias a las pruebas reales
1. Los roles no se sincronizaban: GoTrue asigna `app_metadata` con un UPDATE posterior al INSERT → migración `…04_sync_profile_role.sql`.
2. `service_role` no tiene privilegios en `public` en este proyecto → la Secret key se usa solo en la API de Auth (seed) y nunca para datos.
3. Error obsoleto de «asistentes» tapaba el aviso de capacidad → los errores se limpian al editar.
4. Error de hidratación (espacio en `<tr>`) y contraste insuficiente de grises → corregidos.
5. Historial de cancelación registraba `cancelled → cancelled` → corregido y probado.

## Limitaciones declaradas (no verificado o parcial)
- **Concurrencia:** las pruebas de «aprobaciones concurrentes» ejecutan las llamadas en secuencia; la garantía real descansa en el índice único parcial + `advisory lock` y está probada como invariante (la segunda aprobación falla), no con transacciones simultáneas.
- **Estados vacíos** (pantallas 6, 9, 16): no se pueden producir con los datos sembrados; se verifican con un gancho de QA `?__empty=1` que solo existe fuera de producción y renderiza las páginas reales con datos vacíos.
- **Interfaz en otros navegadores/dispositivos** y rendimiento bajo carga: no probados. Solo Chromium a 390 px.
- **Datos de prueba:** las pruebas automáticas dejan solicitudes canceladas/rechazadas con `[live-test]`/`[e2e]` (los clientes no pueden borrar). Limpieza opcional: `docs/cleanup-test-data.sql`.
- **Correo/Confirm email:** no se envían correos; las cuentas demo se crean ya confirmadas.

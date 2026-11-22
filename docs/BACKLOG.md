# Backlog priorizado y registro de tareas

Prioridad según el encargo. **Estado = lo realmente ejecutado.** Trabajo realizado en sesiones de desarrollo asistido por IA con la persona responsable del proyecto aprobando cada paso externo (Supabase, tests, despliegue).

| # | Ítem | Prioridad | Estado |
|---|------|-----------|--------|
| 1 | Esquema PostgreSQL, funciones transaccionales, RLS | P1 | Hecho · aplicado en Supabase |
| 2 | HU-01 Consulta de laboratorios | P1 | Hecho · probado (PGlite, live, e2e) |
| 3 | HU-03 Registro de solicitudes | P1 | Hecho · probado |
| 4 | HU-06 Aprobar/rechazar | P2 | Hecho · probado |
| 5 | HU-02 Disponibilidad | P2 | Hecho · probado |
| 6 | HU-04 Registro de reservas | P3 | Hecho · probado |
| 7 | HU-05 Seguimiento de solicitudes | P3 | Hecho · probado |
| 8 | Conexión a proyecto Supabase nuevo y seed demo | — | Hecho |
| 9 | Pruebas e2e, calidad (consola/a11y), seguridad | — | Hecho |
| 10 | Comparación visual con 22 mockups | — | Hecho (manual) |
| 11 | Subir a GitHub | — | **Pendiente (responsable: el usuario)** |
| 12 | Despliegue en Vercel | — | **Pendiente (responsable: el usuario)** |

## Registro de tareas relevantes (orden real)
1. Lectura del PDF de 22 pantallas; el prototipo interactivo no fue legible.
2. Diseño del esquema, funciones y RLS; pruebas en PGlite.
3. Aplicación manual de migraciones 01–04 y seed por la persona responsable (SQL Editor).
4. Verificación contra Supabase real: se detectó el fallo de roles → migración 04.
5. Pruebas live y Playwright; correcciones de UX, accesibilidad e hidratación.
6. Revisión visual contra el PDF y ajustes de fidelidad.

## Prácticas efectivamente usadas
Priorización P1→P3 con entrega incremental; criterios de aceptación trazados a pruebas automáticas; ciclo corto «probar → encontrar defecto → corregir → repetir»; decisiones registradas en `DECISIONS.md`.
**No se registran** dailies, sprints formales ni reuniones de equipo: no hay evidencia de que ocurrieran. Si el equipo las realizó, añadirlas con fecha y asistentes reales.

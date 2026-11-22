# Comparación visual con los 22 mockups

Método: capturas de Playwright (Chromium, 390×844, `docs/screens/*.png`) puestas lado a lado con los recortes del PDF `Prototipos_SIGELAB_Grupo7.pdf` (el prototipo interactivo de claude.ai no es legible: solo devuelve una carcasa vacía). **Comparación visual manual, no diferencia de píxeles.** Las capturas de desarrollo muestran el indicador flotante «N» de Next.js, que no es parte de la app.

| # | Pantalla (HU) | Implementación | Captura | Diferencias |
|---|---|---|---|---|
| 1 | Login con rol | `/login` | 01 | Añade campo de contraseña (Supabase Auth real); el botón dice «Ingresar» hasta elegir rol, luego «Ingresar como …». Sin chip «Datos de demostración restablecidos» (no aplica) |
| 2 | Menú Lab-fis | `/modules` | 02 | Módulos ajenos inactivos |
| 3 | HU-01 lista | `/laboratories` | 03 | Iconos por laboratorio |
| 4 | HU-01 detalle + aviso | `/laboratories/[id]` | 04 | — |
| 5 | HU-01 sin información | idem | 05 | — |
| 6 | HU-01 vacío | `?__empty=1` | 06 | Solo verificable con gancho QA |
| 7 | HU-02 cuadrícula | `/availability` | 07 | Leyenda bajo la cuadrícula; FAB «Reservar» solo para docentes |
| 8 | HU-02 solo disponibles | `?only=1` | 08 | Lista por laboratorio con bloques, sin «Reservar» por bloque único |
| 9 | HU-02 sin disponibles | `?__empty=1&only=1` | 09 | No lista los laboratorios ocupados con su tipo de evento |
| 10 | HU-03 disponible | `/reservations/new` | 10 | — |
| 11 | HU-03 «No disponible» | idem | 11 | — |
| 12 | HU-03 validación | idem | 12 | — |
| 13 | HU-04 registro | `/admin/reservations` | 13 | Datos demo distintos a los del PDF |
| 14 | HU-04 conflictos | `?conflicts=1` | 14 | — |
| 15 | HU-04 por laboratorio | `?lab=` | 15 | — |
| 16 | HU-04 vacío | `?__empty=1` | 16 | Solo con gancho QA |
| 17 | HU-05 mis solicitudes | `/my-requests` | 17 | — |
| 18 | HU-05 rechazo | `/my-requests/[id]` | 18 | — |
| 19 | HU-05 acceso restringido | `/restricted?from=own` | 19 | — |
| 20 | HU-06 pendientes | `/admin/requests` | 20 | — |
| 21 | HU-06 bloqueada | idem | 21 | — |
| 22 | HU-06 acceso restringido | `/restricted?from=admin` | 22 | — |

**Elementos del prototipo no implementados a propósito:** pestaña lateral «Guía HU» (herramienta del prototipo), barra de estado «9:41» (marco del teléfono), y funcionalidad del botón «Escanear QR» (fuera de HU-01…06; se muestra deshabilitado).
**Otras diferencias:** nombres/códigos de los datos demo (la app usa cuentas y solicitudes sembradas; los códigos son `SOL-AAAA-NNNN` correlativos); iconos de `lucide-react` en lugar de los del prototipo; tipografía del sistema.

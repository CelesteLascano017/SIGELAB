# Revisión del diff Cloudflare — 2026-11-22

Base: `c8686c2` (main, merge del workaround Edge). Alcance: entrypoint, dependencias, configuración y scripts de build; pruebas y documentación. No se modifican componentes visuales ni servicios de negocio.

## Resultado

Sin hallazgos de seguridad accionables en el código revisado. Riesgo operativo medio: OpenNext declara experimental el proxy Node y el entorno remoto sigue sin verificarse. Aprobación del cambio condicionada a ejecutar las regresiones sobre el despliegue antes de cerrar el incidente.

| Severidad | Hallazgos |
| --- | ---: |
| Crítica / alta / media / baja | 0 |

## Contexto y alcance

`git blame` identifica `1fec136` como introducción del entrypoint Edge. Se restaura la convención Node y se mantiene exactamente el matcher y helper de sesión. Búsqueda de referencias: un caller de `updateSession`, el entrypoint; impacto transitivo: todas las rutas incluidas por el matcher. `src/lib/supabase/proxy.ts`, consultas de roles, RLS y acciones no cambian. Acceso anónimo a rutas protegidas sigue redirigiendo; las pruebas de docente rechazan gestión administrativa y solicitudes ajenas.

El parche solo modifica el converter del adaptador instalado localmente, resuelto desde Cloudflare. Verifica versión AWS 4.2.0 y formato antes de escribir; idempotente; no descarga ni ejecuta código remoto. Una actualización incompatible aborta. El guard de build no imprime valores y los archivos de variables, artefactos y cachés permanecen ignorados.

Wrangler conserva el nombre `sigelab`, binding de assets y autorreferencia; ninguna credencial queda en configuración. No se modifica la base de datos ni sus contraseñas. El override glob se limita al adaptador y su API usada fue comprobada en el build completo.

## Evidencia y límites

- TDD: converter original falla leyendo `parse`; converter parcheado procesa cookies reales. Repetición y formato desconocido cubiertos. Variables ausentes/inválidas abortan; valores válidos no se filtran.
- `npm ci` limpio aplica el parche; tipos pasan; **94 tests / 10 archivos pasan**; build OpenNext genera Worker con código 0.
- Revisión independiente del agente `final_review`: sin hallazgos en scripts, hooks, lockfile, Wrangler o autorización. Tipado de la prueba de entorno ajustado posteriormente; lint y tests repetidos.
- Auditor de dependencias: 26 directas y 559 transitivas sin avisos conocidos a sus versiones; 4 entradas no verificables por registro. Otros criterios de mantenimiento/provenance no certifican seguridad total. Informe completo fuera del repo en `~/.codex/reviews/sigelab-dependencies/cloudflare-final-report.md`.
- Ejecución final del mismo artefacto en workerd: **35/35 E2E**, código 0, 1.9 minutos. Incluye roles, reservas/cancelaciones, QR, consola/accesibilidad y navegación con latencia. Excluidos tres hooks de vacío exclusivos de desarrollo. `wrangler deploy --dry-run`: código 0, gzip 1614.16 KiB, 39 assets.
- Se reprodujo el 500 original con cookies en workerd. El error Edge posterior de producción no se reprodujo con configuración local explícita; no se inventa una causa.
- No hay autenticación Cloudflare en esta sesión. Verificar un Worker local no verifica variables, bindings o versión del dominio remoto. La comprobación HTTP remota final sigue mostrando 500 en `/login`, tanto con cookie inocua como sin ella.

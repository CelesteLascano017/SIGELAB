# Fluidez, skeletons y lector QR — implementación y evidencia

## Resultado

Se conservan la paleta, tipografía, tarjetas y composición de SIGELAB. Se implementan las mejoras funcionales solicitadas y las correcciones de código de la revisión previa. Los cambios están divididos en commits semánticos firmados con la clave SSH local del usuario, sin coautor. No se hizo push.

## Cambios

- Sesión validada mediante claims firmados y rol leído desde `profiles`; cliente SSR deduplicado por petición, sin compartir sesiones entre usuarios.
- Contadores del shell bajo Suspense, fuera del camino crítico del contenido. Feedback de navegación desde el clic mediante `useLinkStatus`, skeletons distintos para catálogo, disponibilidad, solicitudes y formulario.
- Transiciones de color/opacidad de 150 ms y foco visible; se respeta movimiento reducido. Se preserva el diseño existente, sin gradientes, escalados ni rebotes.
- Búsquedas y filtros GET con `next/form`, sin recarga completa del documento. Se eliminaron `router.refresh()` duplicados donde la acción ya devuelve rutas revalidadas.
- `/scan`: cámara trasera preferida, visor, estado de lectura, apagar/reintentar, permiso denegado, subida de imagen y recuperación de errores. Decodificación en el dispositivo, resolución de código contra catálogo bajo sesión/RLS y navegación a detalle.
- Recursos de cámara liberados al salir, ocultar la página, apagar o reconocer un código. Una concesión tardía no desconecta un stream más reciente; caso encontrado en revisión independiente, reproducido y corregido.
- `/scan/examples`: cinco imágenes QR descargables y resultados esperados. Regeneración mediante `npm run qr:generate`. Contrato v1 `SIGELAB:LAB:LAB-XX`, ajeno a dominio/UUID del despliegue; no ejecuta URLs externas ni escribe reservas.
- Calendario validado estrictamente, estados de disponibilidad desconocida/cargando/error y reintento. No se muestran bloques libres antes de consultarlos ni se conservan celdas de otra fecha como si fueran actuales.
- Notificaciones paginadas de 30 en 30 y marcado solo de IDs mostrados. Errores operativos explícitos y reintento; se mantienen accesibles las notificaciones antiguas.
- Cookies de sesión renovadas y cabeceras de caché conservadas al redirigir. Logout con icono reconocible. Se retiró la flecha decorativa que sugería un detalle inexistente en el registro administrativo.
- Migración aditiva `20261122000005_review_fixes.sql`: revocación de roles ausentes/inválidos, contador sin truncamiento y rechazo de aprobaciones de fechas pasadas.

## Verificación final

| Control | Resultado observado |
|---|---|
| `npm test` | **86/86**, 8 archivos, código 0 |
| `npm run lint` | TypeScript sin errores, código 0 |
| `npm run build` | Compilación y generación de 15 rutas correctas, código 0 |
| E2E: docente y respuesta bajo latencia | **10/10**, código 0, 37,7 s |
| E2E: administrador, estudiante, estados vacíos, QR y calidad | **23/23**, código 0, aproximadamente 1,4 min |
| Repetición final de calidad, incluyendo `/scan` y `/scan/examples` | **3/3**, código 0, `sin hallazgos` para cada rol |
| Detector mecánico Impeccable sobre UI nueva/modificada | `[]`, código 0 |
| Revisión independiente del código | Carrera de cámara corregida y probada; sin otros hallazgos confirmados en el alcance revisado |
| Firmas SSH | Los commits se verifican con estado `G` usando el archivo de signers construido con la clave pública local; sin trailers de coautor |

Los **33 casos E2E distintos** se ejecutaron en dos bloques satisfactorios, no en una única invocación. La repetición de calidad no agrega casos distintos al total.

Comandos para repetir contra el servidor existente en el puerto 3000:

```sh
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e -- e2e/professor.spec.ts e2e/responsiveness.spec.ts
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e -- e2e/student.spec.ts e2e/quality.spec.ts e2e/empty-states.spec.ts e2e/qr.spec.ts e2e/admin.spec.ts
```

La configuración carga `.env.local` y `.env` sin imprimir sus valores. Sin `PLAYWRIGHT_BASE_URL`, Playwright conserva el arranque habitual en 3100. Los artefactos de pruebas están fuera de `.next`, para que un build no elimine su configuración/trazas. Un intento anterior fue interrumpido al regenerar `.next`; los bloques finales se repitieron con esta configuración estable. La prueba de cambio de usuario espera explícitamente el fin del cierre de sesión antes del siguiente login.

## Medición de navegación

Mismo navegador, viewport 390 × 844, usuario estudiante y servidor de desarrollo. Se midió `page.goto` hasta `networkidle`, que incorpora una espera propia y no equivale a una métrica de pintura o interacción de usuarios reales.

| Ruta, en orden | Antes | Después |
|---|---:|---:|
| `/laboratories` | 1804 ms | 1115 ms |
| `/availability` | 1807 ms | 1194 ms |
| `/laboratories` | 1741 ms | 1162 ms |

Son tres observaciones por pase, sin conclusión estadística ni promesa de latencia fija. Además, una prueba con 1400 ms de retraso confirma feedback visible dentro de 800 ms; otra comprueba que buscar no solicita un nuevo documento y otra que los horarios siguen desconocidos mientras la consulta espera.

## Pruebas QR y capturas

- Se leen los PNG reales de LAB-01, LAB-03 y LAB-08 y se verifica el detalle correcto.
- Se rechazan contenido ajeno, laboratorio no registrado e imagen sin QR, manteniendo reintento.
- La cámara simulada emite fotogramas de un canvas con un QR real; el lector los decodifica y navega. Las pruebas unitarias cubren limpieza y carreras de streams.
- Capturas nuevas en `docs/screens/`: `qr-scanner-390.png`, `qr-scanner-1440.png`, `qr-gallery-mobile.png`, `loading-skeleton.png` y `qr-test-sheet.png`. El skeleton se capturó en la ruta real mientras cargaba.
- En 390 y 1440 px no se detectó desbordamiento horizontal del documento en la pantalla del lector. Se mantuvo la columna móvil centrada de escritorio.

## Dependencias y límites

`jsqr` se importa dinámicamente en el lector; `qrcode` y sus tipos se usan solo para generar PNGs en desarrollo. La evaluación automatizada no encontró advisories conocidos para las 24 dependencias directas ni las 264 transitivas verificadas en el registro; cuatro entradas no pudieron verificarse. Se identificó antigüedad de actividad de `qrcode` y señales upstream de CI/firmas de `jsqr`, sin vulnerabilidad conocida confirmada. Informe completo fuera del repo: `/home/daxrpm/.codex/reviews/sigelab-dependencies/report.md`.

La revisión cruzada externa con Antigravity no produjo resultado: el modelo indicado por la skill no estaba disponible y la invocación con el modelo predeterminado no emitió salida durante aproximadamente cuatro minutos; se detuvo. Esto no se presenta como revisión externa aprobada. Sí se completó una revisión independiente por otro agente y la revisión de seguridad del diff.

**Pendiente de despliegue:** la migración SQL está incluida y probada en PGlite; no se aplicó a Supabase remoto. Las correcciones SQL no estarán activas allí hasta aplicarla. Las funciones mantienen sus contratos y los permisos existentes.

**Sin afirmar cobertura inexistente:** no se probó cámara física, Safari/Firefox, dispositivo físico, pérdida de conexión en todos los flujos ni transacciones simultáneas en PostgreSQL real. La prueba secuencial de aprobaciones se renombró honestamente; el índice único se verifica como invariante. Los estados vacíos usan los ganchos de QA. Las pruebas E2E existentes dejan solicitudes de prueba canceladas/rechazadas, como ya documenta el proyecto.

La cámara requiere un contexto seguro: [HTTPS o localhost, según la documentación de getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). El permiso real se comprueba manualmente en el dispositivo de la demostración; la subida de imagen permite probar sin cámara.

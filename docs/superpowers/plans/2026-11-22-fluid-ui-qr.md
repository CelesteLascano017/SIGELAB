# Fluidez y escáner QR — plan de implementación

**Objetivo:** respuesta inmediata a interacciones, menos esperas de red y QR funcional conservando el diseño de SIGELAB.
**Autorización:** el usuario solicita implementar todos los cambios y commits semánticos modulares, sin coautor. Ejecución directa en el checkout actual; se preservan las evidencias ya existentes.

## Contrato de diseño y comportamiento
- Mantener verde #1b4332, azul administrativo #1e3a5f, superficie #f4f6f7, tipografía de sistema y composición móvil existente.
- Feedback de color/opacidad de 150 ms; respetar movimiento reducido. Sin rebotes, escalados, gradientes o sustitución del diseño.
- Navegación con feedback inmediato y fallback de carga. Notificaciones/contadores no bloquean el contenido principal. Evitar duplicar auth y consultas por petición; no compartir sesiones ni cachés privados entre usuarios.
- QR abre /scan: cámara trasera tras una acción explícita, visor sobrio, estado visible, reintento y subida de imagen. Liberar cámara al cerrar/salir/ocultar la página. Permisos denegados y dispositivos sin cámara ofrecen alternativa.
- Contrato QR v1: SIGELAB:LAB:LAB-01 (códigos de catálogo). Resolver exclusivamente laboratorios existentes y navegar a detalle; no ejecutar enlaces externos ni aprobar/reservar automáticamente.
- QRs sintéticos: LAB-01, LAB-03, LAB-08, laboratorio inexistente y contenido inválido. PNGs descargables y galería dentro de /scan/examples para pruebas por imagen o cámara.
- Corregir fechas, estados de disponibilidad, notificaciones y casos SQL detectados; nuevas migraciones aditivas. No ejecutar migraciones remotas ni alterar roles reales.

## Tareas y commits
1. [x] Baseline de navegación en navegador, test de deduplicación/feedback y optimización de sesión/shell; loading/transiciones, prefetch y eliminar refresh duplicado. Commit perf(ui).
2. [x] Tests rojos del parser QR y cámara (permiso denegado, liberación, lectura de imagen/cámara), implementar dominio, acción, lector aislado y pantalla; generar fixtures y verificar su decodificación. Commit feat(qr).
3. [x] Tests rojos de calendario, notificaciones y SQL de revocación/contador/fecha vencida; corregir con patrón existente y migración aditiva. Commit fix(reservations).
4. [x] Revisión independiente del diff, TypeScript, suite local, build, E2E y capturas móvil/escritorio, medición comparable de navegación y accesibilidad. Corregir hallazgos. Commit test(ui)/docs.

## Riesgos y pruebas obligatorias
- Decodificar sin bloquear el hilo: resolución limitada y muestreo espaciado, librería importada solo al abrir el escáner.
- getUserMedia puede resolver después de salir: detener también streams tardíos; evitar solicitudes de cámara duplicadas.
- Subida con imagen sin QR, QR desconocido y QR externo: mostrar error y permitir reintento.
- No marcar notificaciones no mostradas; ninguna disponibilidad se etiqueta libre sin consulta finalizada.
- Comparar pruebas de interacción bajo latencia y en producción; dev incluye compilación que no representa producción.

## Ejecución
- Commits modulares semánticos firmados con SSH local, sin coautor; no se realizó push.
- Decisiones y evidencias finales en docs/IMPLEMENTATION_2026-11-22.md.
- Resolución: se preserva el sistema visual existente frente a propuestas de paleta/tipografía ajenas al producto.
- Resolución: la migración se valida en PostgreSQL local embebido; no se ejecuta contra infraestructura remota sin un canal SQL autorizado/configurado.
- Resolución: cámara real requiere prueba en el dispositivo; se cubren permisos, fotogramas simulados, imágenes reales y carreras de streams automáticamente.

# Reparación del runtime Cloudflare

Objetivo: resolver los fallos de despliegue con evidencia en workerd, manteniendo UI y permisos. El usuario autoriza investigar y corregir el fallo; se mantienen commits semánticos firmados sin coautor.

- [x] Fijar versiones y configuración del adaptador/Worker para reproducibilidad.
- [x] Construir y ejecutar ambos entrypoints en workerd. El fallo Edge remoto no se reprodujo con configuración explícita; sí se reprodujo el fallo original Node con cookies antes del parche. No afirmar una causa remota no probada.
- [x] Corregir solo la causa comprobada. Preferir proxy Node estándar y el arreglo de imports del adaptador al workaround Edge que falló.
- [x] Verificar la reparación del adaptador con tests rojos/verdes, repetición/idempotencia y fallo explícito ante versiones desconocidas.
- [x] Ejecutar el Worker compilado: cookies, tres roles, HTML tras redirect/recarga y flujos principales. Las pruebas en next start no sustituyen estos checks.
- [x] Revisar diff, dependencias, tipos y tests. Documentar comandos reproducibles de build/preview/deploy y configuración necesaria.
- [x] Commit, push y PR revisable. Solo declarar cerrado el incidente remoto tras comprobar el despliegue real; no hay credenciales de despliegue Cloudflare disponibles en esta sesión.

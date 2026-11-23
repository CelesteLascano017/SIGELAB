# Cloudflare 1101 al iniciar sesión — 2026-11-22

## Causa y reproducción

El Worker desplegado devuelve 200 para `GET /login` sin cookies y 500 si se añade únicamente `Cookie: sigelab_probe=1`. No necesita una sesión ni contraseña para fallar. Con credenciales válidas la redirección llega a `/modules`, pero tanto esa petición como su recarga devuelven Worker1101.

Los logs aportados muestran `TypeError: Cannot read properties of undefined (reading 'parse')` en `Object.convertFrom`, antes de que se ejecute la lógica de sesión. Coincide con [OpenNext Cloudflare #1506](https://github.com/opennextjs/opennextjs-cloudflare/issues/1506): el bundle del middleware Node (`proxy.ts`) trata incorrectamente el default import de `cookie@1`. El [arreglo upstream #1507](https://github.com/opennextjs/opennextjs-cloudflare/pull/1507) seguía abierto al investigar.

## Cambio temporal

Se renombra el entrypoint `src/proxy.ts` a `src/middleware.ts` y su export a `middleware`, para usar el middleware Edge. Se mantienen exactamente el matcher, la validación de sesión, las cookies y los permisos. No se cambian dependencias, contraseñas, usuarios ni el diseño.

**Advertencia esperada:** Next.js 16 marca la convención `middleware.ts` como deprecada. Se usa intencionalmente como workaround del adaptador: el mismo reporte upstream confirma que el middleware Edge maneja las cookies correctamente. Volver a `proxy.ts` únicamente después de actualizar a una versión publicada del adaptador que corrija #1506 y verificar los casos con cookies en Workers.

## Verificación

- Rojo en producción antes del cambio: los dos casos de `e2e/cloudflare-cookies.spec.ts` recibieron 500 en lugar de 200/307.
- `npm run lint`: código 0.
- `npm test`: **86/86**, código 0.
- `npm run build`: código 0; warning de deprecación documentado arriba. El manifiesto generado registra middleware Edge, no una función proxy Node.
- Servidor local con `npm start -- -p 3200`: **5/5** pruebas E2E. Incluyen `/login` con cookie inocua, rechazo de acceso sin sesión y render HTML después del login y de recarga directa para estudiante, docente y administrador.
- Revisión independiente: sin hallazgos de regresión en el diff. Solo cambia el entrypoint del mismo control de sesión.

Comando para repetir las regresiones tras el redeploy:

```sh
PLAYWRIGHT_BASE_URL=https://sigelab.daxrpm.dev npm run test:e2e -- e2e/cloudflare-cookies.spec.ts e2e/authenticated-pages.spec.ts
```

La configuración local carga las credenciales demo sin imprimirlas. La prueba HTTP de cookies no necesita credenciales.

## Estado de despliegue

El build de producción local y sus pruebas no acreditan que el Worker remoto haya sido actualizado. Para cerrar el incidente hay que fusionar el PR, completar el redeploy de Cloudflare y repetir las cinco pruebas contra el dominio. No se dispone de un canal autorizado/configurado para desplegar ese Worker desde esta sesión.

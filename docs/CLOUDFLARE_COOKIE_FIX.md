# Reparación de Cloudflare/OpenNext — 2026-11-22

## Diagnóstico comprobado y límite

El fallo original `/login` 200 sin cookies / 500 con `Cookie: sigelab_probe=1` se reprodujo en el Worker compilado ejecutado por **workerd**, antes de la lógica de sesión. OpenNext AWS 4.2.0 importa por defecto `cookie@1`; el bundle CommonJS no expone ese default y falla en `Object.convertFrom` al leer `parse`. Referencias: [issue 1506](https://github.com/opennextjs/opennextjs-cloudflare/issues/1506) y [PR 1507](https://github.com/opennextjs/opennextjs-cloudflare/pull/1507), todavía abierto al investigar.

El workaround anterior con middleware Edge produjo `Error in routingHandler` en el despliegue remoto. Fue un error considerarlo suficiente tras probar únicamente `next start`. Con configuración local explícita ese segundo error no se reprodujo: **sin acceso a configuración y logs remotos no se atribuye una causa exacta al fallo Edge**.

## Reparación

- Restaurar `src/proxy.ts`, conservando el matcher y `updateSession` original.
- Fijar Cloudflare 1.20.18, Wrangler 4.166.0 y Node 22.23.2 mediante lockfile/configuración versionada.
- Aplicar un parche local, offline e idempotente al converter AWS 4.2.0: import nombrado `parse` en lugar de default. Corre en `postinstall` y antes del build, incluida una instalación limpia. Una versión o formato desconocidos detienen el proceso y requieren revisión.
- Validar las variables públicas de Supabase **durante el build**, sin imprimir sus valores. Variables ausentes o URL inválida abortan antes de generar un Worker inutilizable.
- Override de `glob` a 14.0.6 en el adaptador: evita los avisos conocidos del árbol de herramientas anterior.

**Advertencia vigente:** OpenNext declara experimental el middleware Node en Cloudflare. El build la muestra; no se oculta. Retirar el parche solo después de actualizar el adaptador y repetir los casos en workerd y en el dominio desplegado.

## Build y despliegue reproducibles

En Cloudflare, configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en **Build variables and secrets**, además de las variables Runtime existentes. Las variables `NEXT_PUBLIC_*` se integran al compilar; configurarlas solo en Runtime no sustituye un build correcto. Nunca publicar claves privadas/service-role ni contraseñas en el repositorio.

[Cloudflare documenta `.node-version` para fijar Node](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/). Node mínimo: 22.12.0. Instalación y build:

```sh
npm ci
npm run lint
npm test
npm run build:cloudflare
```

El build usa `open-next.config.ts` y `wrangler.jsonc`; genera `.open-next/worker.js`. Para ejecutar **ese mismo artefacto** en workerd:

```sh
npm run preview:cloudflare -- --port 3300
```

En otra terminal:

```sh
npm run test:cloudflare
PLAYWRIGHT_BASE_URL=http://localhost:3300 npm run test:e2e -- --grep-invert 'estado vacío'
```

Las tres pruebas de estado vacío usan hooks exclusivos de desarrollo, deshabilitados intencionalmente en producción. No habilitarlos en el Worker para hacer pasar tests.

Configuración de Workers Builds: comando build `npm run build:cloudflare`; comando deploy `npm run deploy:cloudflare`. El deploy requiere autenticación Cloudflare y usa el Worker existente `sigelab`. Conservar sus variables y dominio en el panel. El archivo Wrangler no contiene secretos.

Después del despliegue, ejecutar:

```sh
PLAYWRIGHT_BASE_URL=https://sigelab.daxrpm.dev npm run test:e2e -- e2e/cloudflare-cookies.spec.ts e2e/authenticated-pages.spec.ts
```

## Evidencia

- Rojo reproducido en workerd: cookie inocua provoca 500 y stack del converter `parse`.
- Verde tras parche: cookies sin sesión y login/render/recarga para los tres roles.
- Instalación limpia `npm ci`: parche reaplicado automáticamente, 473 paquetes instalados.
- `npm run lint`: código 0. `npm test`: **94/94**, 10 archivos, código 0.
- `npm run build:cloudflare`: código 0, Worker generado; advertencia experimental documentada arriba.
- Recorridos finales en workerd: **35/35 E2E**, 1.9 minutos, código 0; roles, reservas/cancelación, QR, accesibilidad y respuesta con latencia. Tres casos de vacío exclusivos de desarrollo quedan fuera de este build.
- `npx wrangler deploy --dry-run`: código 0; 39 assets, Worker gzip 1614.16 KiB. No publica el Worker.
- Dependencias: 26 directas y 559 transitivas verificadas sin avisos conocidos en sus versiones; 4 entradas del lockfile no verificables por registro público. Esto no certifica ausencia de vulnerabilidades.

El build y las pruebas locales **no acreditan un despliegue remoto reparado**. Esta sesión no tiene autenticación de Cloudflare: queda pendiente desplegar el commit y repetir las cinco regresiones contra el dominio.

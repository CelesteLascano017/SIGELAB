# Crear el proyecto Supabase NUEVO para SIGELAB

> Regla: SIGELAB usa un proyecto **nuevo e independiente**. No reutilices URL, claves ni contraseña de ningún otro proyecto.

1. Entra a <https://supabase.com/dashboard> → **New project**. Nombre: `SIGELAB`. Elige región y una contraseña de base de datos nueva (guárdala en tu gestor de contraseñas).
2. Espera a que el estado sea *Healthy*. Anota el **Project ref** (subdominio de `https://<ref>.supabase.co`, también visible en *Project Settings → General*).
3. **Authentication → Providers → Email**: desactiva *Allow new users to sign up* (los usuarios los crea el seed/administración; así nadie puede auto-registrarse). Para la demo, desactiva también *Confirm email* o crea usuarios ya confirmados (el seed lo hace).
4. **Project Settings → API**: copia `Project URL`, la clave `anon`/publishable y la `service_role`.
5. En `SIGELAB/`: `cp .env.example .env.local` y completa los 4 valores (incluido `SIGELAB_EXPECTED_PROJECT_REF` = el ref nuevo).
6. Aplica las migraciones **en este orden** desde *SQL Editor* del proyecto nuevo (verifica arriba a la izquierda que el nombre del proyecto sea SIGELAB):
   1. `supabase/migrations/20261121000001_schema.sql`
   2. `supabase/migrations/20261121000002_functions.sql`
   3. `supabase/migrations/20261121000003_rls.sql`
   4. `supabase/migrations/20261121000004_sync_profile_role.sql` (necesaria: GoTrue asigna `app_metadata` con un UPDATE posterior al INSERT)
   5. `supabase/seed.sql`

   (Alternativa con CLI: `npx supabase link --project-ref <ref-nuevo>` y `npx supabase db push`; confirma que el ref sea el nuevo.)
7. `npm run seed:demo` crea 4 usuarios demo (estudiante, 2 docentes, administrador) y solicitudes de ejemplo. El script aborta si el ref de la URL no coincide con `SIGELAB_EXPECTED_PROJECT_REF`.
8. `npm run dev` e inicia sesión con una cuenta demo (contraseña impresa por el seed).

`.env.local` está en `.gitignore`: no se sube. `SUPABASE_SERVICE_ROLE_KEY` solo se usa en `scripts/seed-demo.ts`, nunca en el navegador ni en Vercel.

## Notas operativas
- `service_role` no tiene privilegios sobre `public` en este proyecto; es intencional. `seed:demo` usa la Secret key solo para crear usuarios (API de Auth).
- `DEMO_PASSWORD` (≥ 12 caracteres) se define en `.env.local`; es la contraseña de las 4 cuentas demo (ana.martinez, carla.mendoza, diego.salazar, jorge.vasconez @epn.edu.ec).
- Verificación: `npm run check:env` (sin imprimir secretos) y `npm run verify:supabase` (solo lectura).
- La primera cuenta administradora se crea con la Secret key vía Auth admin API (`app_metadata.role='admin'`); nadie puede asignársela desde el cliente. Para producción, crea el admin real desde el dashboard con `app_metadata` y cambia las contraseñas demo.
- Limpieza opcional de datos de prueba: `docs/cleanup-test-data.sql`.

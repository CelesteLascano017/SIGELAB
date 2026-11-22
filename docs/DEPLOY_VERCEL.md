# Despliegue en Vercel
1. Sube el repositorio a GitHub (ver README).
2. En <https://vercel.com/new> importa el repositorio; framework detectado: Next.js (sin cambiar comandos).
3. *Environment Variables* (Production y Preview): `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` del proyecto SIGELAB nuevo. **No agregues** `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploy. Luego, en Supabase → Authentication → URL Configuration, define *Site URL* = URL de Vercel.
5. Ese enlace es el «enlace de ejecución» de la entrega.

> Aún **no se ha desplegado nada**. Antes: `npm run lint && npm test && npm run build`. Cambia las contraseñas demo o desactiva esas cuentas en producción y crea el administrador real desde el dashboard de Supabase (`app_metadata.role='admin'`).

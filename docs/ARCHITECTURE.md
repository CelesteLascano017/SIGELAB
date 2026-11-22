# Arquitectura
Next.js 16 (App Router, `proxy.ts`) · React 19 · TypeScript · Tailwind 4 · HeroUI 3 · Supabase (Auth + PostgreSQL + RLS).

```
Navegador ──HTTP──> Next.js (Server Components + Server Actions)
                       │  @supabase/ssr con la sesión (cookies) del usuario
                       ▼
                 Supabase Auth ── PostgREST ── PostgreSQL (RLS + funciones SECURITY DEFINER)
```
- `src/app` rutas; `src/components` UI; `src/lib/domain` lógica pura; `src/lib/validation` zod; `src/services` acceso a datos; `src/actions` Server Actions; `src/lib/supabase` clientes; `src/types`.
- **Defensa en capas:** `proxy.ts` (sesión) → `requireRole` (servidor) → funciones SQL que verifican rol → RLS → índice único parcial anti-solapamiento.
- Los textos visibles están en español; identificadores en inglés.

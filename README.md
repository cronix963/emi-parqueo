# 🚗 Sistema de Parqueo Automático — EMI

Sistema de parqueo automático para la **Escuela Militar de Ingeniería** (La Paz, Bolivia).
Consulta de espacios disponibles en tiempo real, autenticación con Google Workspace
y verificación anti‑robots con Cloudflare Turnstile.

Identidad visual institucional: azul EMI + amarillo oro.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router, RSC, Server Actions) |
| UI | React 19 + Tailwind CSS v4 |
| Datos / Auth | Supabase (`@supabase/ssr`, OAuth con Google) |
| Base de datos | PostgreSQL 16 en Supabase, 24 tablas, 8 vistas, 13 funciones |
| Anti‑bots | Cloudflare Turnstile |
| Validación de esquema | PGlite (PostgreSQL real en memoria) |
| Deploy | Vercel |

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # opcional: sin esto funciona en MODO DEMO
npm run dev
```

Abre <http://localhost:3000>. Si no hay credenciales configuradas la app entra en
**modo demo**: verifica el captcha de forma simulada y usa datos de parqueo de ejemplo.

### Modo demo

- CAPTCHA: se muestra el sustituto «No soy un robot (modo desarrollo)».
- Sesión: cookie local `emi_demo_session` en lugar de Supabase Auth.
- Datos: `src/lib/parking/demo-data.ts` (generador determinista, sin hydration mismatch).
- La interfaz muestra una insignia **«Datos demo»**.

## Base de datos

El modelo físico vive en `supabase/` y se aplica **en orden**. Cubre los 13 módulos
del sistema; el detalle módulo por módulo está en [`docs/CHECKLIST.md`](docs/CHECKLIST.md).

```
supabase/
├─ 01_schema.sql                  # usuarios, sesiones, intentos de acceso, RBAC
├─ 02_schema.sql                  # vehículos, autorizaciones, zonas, plazas, dispositivos
├─ 03_schema.sql                  # eventos de acceso, ALPR, historial de ocupación
├─ 04_schema.sql                  # alertas, auditoría, fallas, reportes, respaldos, push
├─ 05_rls.sql                     # RLS sobre las 24 tablas (39 políticas)
├─ 06_views.sql                   # KPIs + vistas de compatibilidad con el frontend
└─ 07_seed.sql                    # roles, permisos, zonas, 116 plazas, hardware, vehículos
```

### Validar sin credenciales

```bash
npm run db:validate
```

Levanta un PostgreSQL real en memoria (PGlite), aplica los siete scripts y ejecuta
**106 verificaciones**: inventario del esquema, seed, fail‑safe de la barrera,
antirrebote, normalización de placas, sincronización de ocupación, deduplicación de
alertas, inmutabilidad de la bitácora, bloqueo por intentos fallidos, RLS y contrato
entre las vistas y `src/lib/parking/types.ts`.

### Aplicar en un proyecto Supabase real

```bash
# .env.local
DATABASE_URL=postgresql://postgres:...@db.TU_PROJECT.supabase.co:5432/postgres
npm run db:push
```

También puedes pegar los scripts en el **SQL Editor** en el mismo orden.
Requiere las extensiones `pgcrypto`, `citext` y `btree_gist` (se crean solas).

### Puntos de seguridad del modelo

- RLS activa en las 24 tablas y `security_invoker` en las vistas de compatibilidad.
- `bitacora_auditoria` es inmutable por trigger: no admite `UPDATE` ni `DELETE`.
- Fail‑safe: la barrera solo abre con vehículo autorizado y legible; ante cualquier
  otra situación (incluido un dispositivo caído) queda cerrada.
- Sin reconocimiento facial ni biometría; la evidencia vehicular son rutas, nunca `bytea`.
- Las contraseñas las administra Supabase Auth; el modelo solo conserva un
  `contrasena_hash` para migración.

## Configurar Supabase + Google

1. Crea el proyecto en [supabase.com](https://supabase.com).
2. Aplica el modelo con `npm run db:push` o con el SQL Editor.
3. Copia **Project Settings → API**: `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` a `.env.local`.
4. En **Authentication → Providers → Google**:
   - Activa Google.
   - Client ID / Client Secret de un proyecto de Google Cloud con la *OAuth consent
     screen* configurada.
   - Callback de Google: `https://TU_PROJECT.supabase.co/auth/v1/callback`
   - Redirect URI de la app: `http://localhost:3000/auth/callback`
     (y `https://TU_DOMINIO.vercel.app/auth/callback` en producción).

## Configurar Cloudflare Turnstile

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile** → crear widget
   tipo *Managed* con el dominio `localhost` y tu dominio de Vercel.
2. Pega `NEXT_PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`.

### Cómo se valida el captcha

El token de Turnstile es de **un solo uso**, así que no puede viajar en la URL del
callback de Google. El flujo es:

1. El widget entrega el token al navegador.
2. La Server Action `iniciarSesion` lo verifica **server‑side** contra
   `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
3. Si es válido, marca una cookie `emi_captcha_ok` (10 min) y redirige a Google.
4. `/auth/callback` **exige y consume** esa cookie; sin ella rechaza el ingreso.

## Estructura

```
supabase/                # modelo físico (ver arriba)
scripts/
├─ validar-bd.mjs        # 106 verificaciones sobre PGlite
├─ aplicar-bd.mjs        # aplica el esquema a Supabase con DATABASE_URL
└─ supabase-auth-shim.sql# emula auth.users/auth.uid/auth.jwt en las pruebas
docs/CHECKLIST.md        # trazabilidad de los 13 módulos
src/
├─ app/
│  ├─ layout.tsx              # raíz, metadata, fuentes
│  ├─ page.tsx                # redirige a /dashboard
│  ├─ login/
│  │  ├─ page.tsx             # pantalla de acceso
│  │  └─ acciones.ts          # Server Actions (login / logout)
│  ├─ auth/callback/route.ts  # intercambio de código OAuth + validación captcha
│  └─ dashboard/page.tsx      # panel principal
├─ components/
│  ├─ emblema-emi.tsx         # escudo SVG
│  ├─ login-form.tsx          # formulario Google + estado del captcha
│  ├─ turnstile.tsx           # widget Turnstile (script on‑demand)
│  ├─ mapa-parqueo.tsx        # grilla de espacios por zona + filtros
│  ├─ metricas.tsx            # tarjetas de KPIs y disponibilidad por zona
│  ├─ encabezado.tsx          # barra superior con usuario y logout
│  └─ tabla-ingresos.tsx      # vehículos estacionados
├─ lib/
│  ├─ supabase/{client,server}.ts
│  ├─ parking/{types,demo-data,queries}.ts
│  ├─ auth-cookies.ts
│  ├─ turnstile.ts            # verificación server‑side
│  └─ fechas.ts
└─ proxy.ts                   # refreshing de sesión + control de acceso
```

## Scripts

```bash
npm run dev         # desarrollo
npm run build       # build de producción
npm run start       # sirve el build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run db:validate # aplica y verifica el esquema en PGlite
npm run db:push     # aplica el esquema en Supabase (requiere DATABASE_URL)
npm run verify      # typecheck + lint + db:validate + build
```

## Despliegue en Vercel

1. Sube el repo a GitHub e impórtalo en Vercel (framework detectado: Next.js).
2. En **Settings → Environment Variables** agrega todas las de `.env.example`
   con los valores reales, y define `NEXT_PUBLIC_SITE_URL` con el dominio final.
3. Agrega ese dominio en la lista de dominios permitidos de Turnstile.
4. En Supabase, actualiza el **Redirect URI** de Google con el dominio de Vercel.
5. Deploy. `npm run build` es el build por defecto; no requiere configuración extra.

## Pendiente

- [x] Modelo físico completo de los 13 módulos, con RLS, seed y validación automática.
- [ ] Cargar el diseño definitivo del parqueo (plano SVG, pasillos, sentido de
      circulación y señalización) en `zonas.plano_layout`.
- [ ] Aplicar el esquema en un proyecto Supabase real y cargar las variables de
      entorno para salir del modo demo.
- [ ] Exponer los módulos 2, 3, 6, 9, 10, 11 y 13 en la interfaz (ver `docs/CHECKLIST.md`).
- [ ] Suscripción Realtime para el monitoreo en vivo del dashboard.
- [ ] Contrato de ingesta con el nodo edge y con el motor de visión artificial.

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
| Anti‑bots | Cloudflare Turnstile |
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

## Configurar Supabase + Google

1. Crea el proyecto en [supabase.com](https://supabase.com).
2. Ejecuta `supabase/schema.sql` en el **SQL Editor**. Crea `zonas`, `espacios` y
   `registros`, con RLS habilitado y datos iniciales de zona.
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
npm run dev      # desarrollo
npm run build    # build de producción
npm run start    # sirve el build
npm run lint     # ESLint
npx tsc --noEmit # chequeo de tipos
```

## Despliegue en Vercel

1. Sube el repo a GitHub e impórtalo en Vercel (framework detectado: Next.js).
2. En **Settings → Environment Variables** agrega todas las de `.env.example`
   con los valores reales, y define `NEXT_PUBLIC_SITE_URL` con el dominio final.
3. Agrega ese dominio en la lista de dominios permitidos de Turnstile.
4. En Supabase, actualiza el **Redirect URI** de Google con el dominio de Vercel.
5. Deploy. `npm run build` es el build por defecto; no requiere configuración extra.

## Pendiente

- [ ] Cargar el diseño definitivo del parqueo (filas, columnas, pasillos, sentido
      de circulación, zonas y sinalización).
- [ ] Sustituir el modo demo por datos reales de Supabase.
- [ ] Módulo de registro de ingreso/salida desde la caseta o barrier.

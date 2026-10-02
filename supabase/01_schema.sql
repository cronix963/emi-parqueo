-- ============================================================================
--  Sistema Automático e Inteligente de Gestión de Parqueos
--  mediante Visión Artificial e IoT — Caso EMI UALP
--
--  Script DDL principal — PostgreSQL 15+ / Supabase
--  Ejecución: Supabase → SQL Editor → New query → Run
--
--  Cubre los 13 módulos del sistema (ver docs/CHECKLIST.md).
--  ============================================================================

begin;

create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "btree_gist";

-- ============================================================================
--  SECCIÓN 0 — Tipos enumerados del dominio
-- ============================================================================

-- Módulo 2 — Identificadores de rol (coinciden con el RBAC de la aplicación)
create type public.rol_codigo as enum (
  'SEGURIDAD',      -- Control de acceso físico y apertura de portones
  'OPERACIONES',    -- Monitoreo y atención de alertas
  'ADMINISTRACION', -- Administración de usuarios, zonas y configuración
  'SOPORTE_TECNICO',-- Hardware, respaldos y auditoría
  'VISUALIZACION'   -- Solo lectura (invitados / app móvil pública)
);

-- Módulo 3 — Categoría del vehículo según tipo de usuario de la EMI
create type public.categoria_vehiculo as enum (
  'DOCENTE', 'ESTUDIANTE', 'PERSONAL', 'VISITANTE', 'PROVEEDOR', 'AUTORIDAD'
);

create type public.tipo_vehiculo as enum (
  'AUTOMOVIL', 'CAMIONETA', 'MOTOCICLISTA', 'CAMION', 'BUS', 'CICLO'
);

-- Módulo 5 — Resultado del reconocimiento óptico de placa (ALPR/ANPR)
create type public.estado_reconocimiento as enum (
  'RECONOCIDO',      -- Placa leída con alta confianza y encontrada
  'NO_ENCONTRADO',   -- Placa leída pero no está en el padrón autorizado
  'BAJA_CONFIANZA',  -- Score bajo: requiere validación manual
  'ILEGIBLE',        -- No se pudo leer la placa
  'VALIDADO_MANUAL'  -- Resuelto por un operador (Módulo 5, Módulo 4)
);

-- Módulo 4 — Sentido del evento en un punto de control
create type public.sentido_acceso as enum ('INGRESO', 'SALIDA');

-- Módulo 4 — Canal que originó el evento (arquitectura IoT segura)
create type public.canal_evento as enum (
  'SENSOR',      -- Detección física automática
  'IA',          -- Confirmación por visión artificial
  'MANUAL',      -- Excepción autorizada por un operador
  'BARRERA',     -- Acción física sobre el dispositivo
  'SISTEMA'      -- Proceso interno (cierre de turno, etc.)
);

create type public.estado_evento as enum (
  'PERMITIDO', 'DENEGADO', 'PENDIENTE_REVISION', 'ANULADO'
);

-- Módulo 7 — Estado de ocupación de una plaza
create type public.estado_plaza as enum (
  'LIBRE', 'OCUPADO', 'MANTENIMIENTO', 'SIN_DATOS'
);

-- Módulo 7 — Origen del estado calculado por el motor de visión artificial
create type public.origen_deteccion as enum (
  'VISION_ARTIFICIAL', 'SENSOR', 'OPERADOR', 'SISTEMA', 'ESTADO_INICIAL'
);

-- Módulo 6 — Tipo de hardware registrado
create type public.tipo_dispositivo as enum (
  'CAMARA', 'SENSOR_PRESENCIA', 'BARRIERA', 'LECTOR_QR', 'NODO_EDGE', 'OTRO'
);

create type public.estado_dispositivo as enum (
  'ACTIVO', 'MANTENIMIENTO', 'FUERA_DE_SERVICIO', 'DESCONECTADO'
);

-- Módulo 9 — Clasificación de alertas
create type public.categoria_alerta as enum (
  'CAPACIDAD_MAXIMA', 'UMBRAL_OCUPACION', 'DISPOSITIVO_DESCONECTADO',
  'FALTA_COMUNICACION', 'DATOS_INCONSISTENTES', 'EVENTO_DENEGADO',
  'SENSOR_REBOTE', 'FALLA_BARRERA'
);

create type public.criticidad_alerta as enum ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

create type public.estado_alerta as enum (
  'ABIERTA', 'EN_ATENCION', 'RESUELTA', 'DESCARTADA'
);

-- Módulo 3 — Tipo de autorización
create type public.tipo_autorizacion as enum (
  'PERMANENTE',     -- Vehículo routinely autorizado
  'TEMPORAL',       -- Visitante / proveedor con vigencia acotada
  'EXCEPCIONAL'     -- Autorización manual de un evento puntual (Módulo 4)
);

-- Módulo 1 — Tipo de sesión y registro de intentos fallidos
create type public.estado_sesion as enum ('ACTIVA', 'CERRADA', 'EXPIRADA', 'REVOCADA');

create type public.resultado_autenticacion as enum (
  'EXITOSO', 'FALLO_CREDENCIALES', 'FALLO_CAPTCHA', 'USUARIO_BLOQUEADO',
  'CUENTA_DESHABILITADA', 'CAPTCHA_INVALIDO'
);

-- Módulo 12 — Entidad y acción auditadas
create type public.entidad_auditada as enum (
  'USUARIO', 'ROL', 'PERMISO', 'VEHICULO', 'AUTORIZACION', 'ZONA', 'PLAZA',
  'DISPOSITIVO', 'EVENTO_ACCESO', 'RECONOCIMIENTO', 'ALERTA', 'BACKUP',
  'CONFIGURACION', 'SESION'
);

-- Módulo 11 — Formatos de exportación soportados
create type public.formato_reporte as enum ('PDF', 'XLSX', 'CSV', 'JSON');

-- ============================================================================
--  SECCIÓN 1 — MÓDULO 1: Identidad, autenticación y sesiones
--  ============================================================================

-- Perfil institucional. El hash de contraseña vive en auth.users (Supabase
-- Auth, PBKDF2/Bcrypt con salt). Nunca se almacena texto plano.
create table if not exists public.usuarios (
  id                  uuid primary key default gen_random_uuid(),
  auth_user_id        uuid unique references auth.users(id) on delete cascade,
  documento           text not null,
  correo              citext not null unique,
  nombres             text not null,
  apellidos           text not null,
  cargo               text,
  rol_codigo          public.rol_codigo not null default 'VISUALIZACION',
  unidad_organizacional text,
  telefono            text,
  activo               boolean not null default true,
  requiere_cambio_clave boolean not null default false,
  intentos_fallidos    int  not null default 0,
  bloqueado_hasta      timestamptz,
  ultimo_acceso        timestamptz,
  creado_por           uuid references public.usuarios(id) on delete set null,
  created_at           timestamptz not null default now(),
  actualizado_at       timestamptz not null default now(),

  constraint usuarios_documento_formato check (documento ~ '^[0-9A-Za-z-]{3,20}$')
);

create index if not exists idx_usuarios_rol     on public.usuarios (rol_codigo);
create index if not exists idx_usuarios_activo  on public.usuarios (activo);
create index if not exists idx_usuarios_correo  on public.usuarios (correo);

-- Sesiones: bloqueo por inactividad y cierre seguro.
create table if not exists public.sesiones (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references public.usuarios(id) on delete cascade,
  token_hash     text not null unique,
  direccion_ip   inet,
  agente_usuario text,
  estado         public.estado_sesion not null default 'ACTIVA',
  iniciada_en    timestamptz not null default now(),
  ultima_actividad timestamptz not null default now(),
  cerrada_en     timestamptz,
  motivo_cierre  text,
  creado_en      timestamptz not null default now()
);

create index if not exists idx_sesiones_usuario on public.sesiones (usuario_id, estado);
create index if not exists idx_sesiones_activas on public.sesiones (estado, ultima_actividad);

-- Registro de intentos de autenticación (Módulo 12: "intentos fallidos").
create table if not exists public.intentos_autenticacion (
  id             bigserial primary key,
  correo_intento citext not null,
  usuario_id     uuid references public.usuarios(id) on delete set null,
  resultado      public.resultado_autenticacion not null,
  direccion_ip   inet,
  agente_usuario text,
  detalle        text,
  created_at     timestamptz not null default now()
);

create index if not exists idx_intentos_correo_fecha
  on public.intentos_autenticacion (correo_intento, created_at desc);
create index if not exists idx_intentos_fallidos
  on public.intentos_autenticacion (resultado, created_at desc);

-- Política de bloqueo por intentos fallidos (Módulo 1).
create or replace function public.politica_bloqueo_usuario()
returns trigger
language plpgsql
as $$
declare
  v_fallidos int;
  v_bloqueado boolean;
begin
  update public.usuarios
     set intentos_fallidos = intentos_fallidos + 1,
         bloqueado_hasta = case
           when intentos_fallidos + 1 >= 5
             then now() + interval '15 minutes'
           else bloqueado_hasta
         end
   where correo = new.correo_intento
  returning intentos_fallidos, (bloqueado_hasta is not null) into v_fallidos, v_bloqueado;

  new.resultado = case when v_bloqueado then 'USUARIO_BLOQUEADO'::public.resultado_autenticacion
                       else new.resultado end;
  return new;
exception
  when foreign_key_violation then
    -- Correo inexistente: se registra igual, sin revelar información.
    return new;
end;
$$;

create trigger trg_intentos_bloqueo
  before insert on public.intentos_autenticacion
  for each row execute function public.politica_bloqueo_usuario();

-- ============================================================================
--  SECCIÓN 2 — MÓDULO 2: RBAC (roles, permisos y su asignación)
--  ============================================================================

create table if not exists public.roles (
  id          uuid primary key default gen_random_uuid(),
  codigo      public.rol_codigo not null unique,
  nombre      text not null unique,
  descripcion text,
  sistema     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Permisos granulares: consulta, operación, administración, reportes,
-- configuración técnica. El prefijo del recurso agrupa por módulo.
create table if not exists public.permisos (
  id          uuid primary key default gen_random_uuid(),
  codigo      text not null unique,
  modulo      int  not null check (modulo between 1 and 13),
  recurso     text not null,
  accion      text not null,
  descripcion text,
  created_at  timestamptz not null default now(),

  constraint permisos_codigo_formato check (codigo ~ '^[a-z_]+:[a-z_]+$')
);

create index if not exists idx_permisos_modulo on public.permisos (modulo);

create table if not exists public.roles_permisos (
  rol_id      uuid not null references public.roles(id) on delete cascade,
  permiso_id  uuid not null references public.permisos(id) on delete cascade,
  asignado_por uuid references public.usuarios(id) on delete set null,
  created_at  timestamptz not null default now(),

  primary key (rol_id, permiso_id)
);

-- Trazabilidad de cambios de roles y permisos (Módulo 2, RNF).
create table if not exists public.usuarios_roles_historico (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null references public.usuarios(id) on delete cascade,
  rol_anterior  public.rol_codigo,
  rol_nuevo     public.rol_codigo not null,
  motivo        text,
  realizado_por uuid references public.usuarios(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_usr_roles_hist_usuario
  on public.usuarios_roles_historico (usuario_id, created_at desc);

-- Helper de aplicación: verifica si el usuario tiene un permiso concreto.
-- security definer porque la política RBAC se consulta desde el frontend con
-- el token del usuario, y las políticas RLS de permisos no son recursivas.
create or replace function public.usuario_tiene_permiso(
  p_usuario_id uuid,
  p_permiso    text
) returns boolean
language sql
stable
as $$
  select exists (
    select 1
      from public.usuarios u
      join public.roles r               on r.codigo = u.rol_codigo
      join public.roles_permisos rp     on rp.rol_id = r.id
      join public.permisos p            on p.id = rp.permiso_id
     where u.id = p_usuario_id
       and u.activo
       and p.codigo = p_permiso
  );
$$;

commit;

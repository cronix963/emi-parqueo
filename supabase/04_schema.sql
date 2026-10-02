-- ============================================================================
--  SECCIÓN 5 — MÓDULOS 8, 9, 11 y 12: Alertas, auditoría, reportes,
--  respaldo, Row Level Security y vistas de indicadores
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
--  Módulo 9 — Alertas y notificaciones
--  Deduplicación: no se repiten alertas idénticas mientras la anterior siga
--  abierta (índice único parcial sobre la huella).
-- ---------------------------------------------------------------------------
create table if not exists public.alertas (
  id             uuid primary key default gen_random_uuid(),
  categoria      public.categoria_alerta not null,
  criticidad     public.criticidad_alerta not null default 'MEDIA',
  estado         public.estado_alerta not null default 'ABIERTA',
  zona_id        uuid references public.zonas(id) on delete cascade,
  plaza_id       uuid references public.plazas(id) on delete cascade,
  dispositivo_id uuid references public.dispositivos(id) on delete cascade,
  evento_id      uuid references public.eventos_acceso(id) on delete set null,
  titulo         text not null,
  mensaje        text not null,
  contexto       jsonb not null default '{}'::jsonb,
  -- Huella para deduplicar: sha256 sobre (categoria, recurso, valor).
  huella         text not null,
  valor_umbral   numeric(10,2),
  valor_observado numeric(10,2),
  detectada_en   timestamptz not null default now(),
  cerrada_en     timestamptz,
  atendida_por   uuid references public.usuarios(id) on delete set null,
  cerrada_por    uuid references public.usuarios(id) on delete set null,
  comentarios    text,
  created_at     timestamptz not null default now(),
  actualizado_at timestamptz not null default now(),

  constraint alertas_ventana check (cerrada_en is null or cerrada_en >= detectada_en)
);

-- Deduplicación de alertas repetitivas mientras la anterior siga abierta.
create unique index if not exists uq_alertas_huella_abierta
  on public.alertas (huella)
  where estado in ('ABIERTA', 'EN_ATENCION');

create index if not exists idx_alertas_estado  on public.alertas (estado, criticidad desc);
create index if not exists idx_alertas_fecha   on public.alertas (detectada_en desc);
create index if not exists idx_alertas_zona    on public.alertas (zona_id, detectada_en desc);

-- Historial de atención: quién hizo qué sobre cada alerta (Módulo 9 + 12).
create table if not exists public.alertas_acciones (
  id          uuid primary key default gen_random_uuid(),
  alerta_id   uuid not null references public.alertas(id) on delete cascade,
  accion      text not null check (accion in ('MARCAR_VISTA','ATENDER','RESOLVER','DESCARTAR','REABRIR','COMENTAR')),
  estado_anterior public.estado_alerta,
  estado_nuevo    public.estado_alerta,
  comentario  text,
  usuario_id  uuid not null references public.usuarios(id) on delete restrict,
  created_at  timestamptz not null default now()
);

create index if not exists idx_alertas_acciones_alerta
  on public.alertas_acciones (alerta_id, created_at);

-- ---------------------------------------------------------------------------
--  Módulo 12 — Bitácora de auditoría (append-only, inmutable)
--  Restringida a ADMINISTRACION y SOPORTE_TECNICO mediante RLS.
-- ---------------------------------------------------------------------------
create table if not exists public.bitacora_auditoria (
  id             bigserial primary key,
  entidad        public.entidad_auditada not null,
  entidad_id     text,
  accion         text not null check (accion in ('CREAR','ACTUALIZAR','ELIMINAR','HABILITAR','DESHABILITAR','AUTORIZAR','DENEGAR','EXPORTAR','ACCESO')),
  datos_antes    jsonb,
  datos_despues  jsonb,
  campos_alterados text[],
  usuario_id     uuid references public.usuarios(id) on delete set null,
  usuario_correo citext,
  sesion_id      uuid references public.sesiones(id) on delete set null,
  direccion_ip   inet,
  agente_usuario text,
  resultado      text not null default 'EXITOSO',
  created_at     timestamptz not null default now()
);

create index if not exists idx_audit_entidad   on public.bitacora_auditoria (entidad, created_at desc);
create index if not exists idx_audit_usuario   on public.bitacora_auditoria (usuario_id, created_at desc);
create index if not exists idx_audit_fecha     on public.bitacora_auditoria (created_at desc);
create index if not exists idx_audit_exportes  on public.bitacora_auditoria (accion)
  where accion = 'EXPORTAR';

-- Inmutabilidad: la bitácora sólo admite INSERT.
create or replace function public.bloquear_modificacion_auditoria()
returns trigger
language plpgsql
as $$
begin
  raise exception 'La bitácora de auditoría es inmutable (operación % rechazada)', tg_op
    using errcode = '42501';
end;
$$;

create trigger trg_auditoria_inmutable
  before update or delete on public.bitacora_auditoria
  for each row execute function public.bloquear_modificacion_auditoria();

-- Helper: el backend inserta aquí tras cada operación sensible.
create or replace function public.registrar_auditoria(
  p_entidad      public.entidad_auditada,
  p_entidad_id   text,
  p_accion       text,
  p_datos_antes  jsonb default null,
  p_datos_despues jsonb default null,
  p_usuario_id   uuid default null,
  p_ip           inet default null,
  p_agente       text default null,
  p_sesion_id    uuid default null
) returns void
language sql
as $$
  insert into public.bitacora_auditoria (
    entidad, entidad_id, accion, datos_antes, datos_despues,
    usuario_id, usuario_correo, sesion_id, direccion_ip, agente_usuario
  )
  values (
    p_entidad, p_entidad_id, p_accion, p_datos_antes, p_datos_despues,
    p_usuario_id,
    (select u.correo from public.usuarios u where u.id = p_usuario_id),
    p_sesion_id, p_ip, p_agente
  );
$$;

-- ---------------------------------------------------------------------------
--  Módulo 6 — Registro de fallas de comunicación con el hardware (Módulo 12)
-- ---------------------------------------------------------------------------
create table if not exists public.dispositivos_fallas (
  id             bigserial primary key,
  dispositivo_id uuid not null references public.dispositivos(id) on delete cascade,
  tipo           text not null check (tipo in ('TIMEOUT','DESCONEXION','ERROR_EQUIPO','FALLA_BARRERA','TIMEOUT_IA')),
  mensaje        text,
  detalle        jsonb not null default '{}'::jsonb,
  duracion_s     int check (duracion_s >= 0),
  recuperada_en  timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists idx_fallas_disp_fecha
  on public.dispositivos_fallas (dispositivo_id, created_at desc);
create index if not exists idx_fallas_abiertas
  on public.dispositivos_fallas (created_at desc)
  where recuperada_en is null;

-- ---------------------------------------------------------------------------
--  Módulo 11 — Reportes: catálogo y solicitudes de exportación
--  La generación es asíncrona (RNF): no bloquea la operación principal.
-- ---------------------------------------------------------------------------
create table if not exists public.reportes (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  tipo          text not null check (tipo in ('FLUJO_VEHICULAR','OCUPACION','HORAS_PICO','ROTACION','ALERTAS','FALLAS','AUDITORIA')),
  formato       public.formato_reporte not null default 'XLSX',
  parametros    jsonb not null default '{}'::jsonb,
  estado        text not null default 'PENDIENTE'
                check (estado in ('PENDIENTE','PROCESANDO','COMPLETADO','ERROR','DESCARTADO')),
  url_descarga  text,
  tamano_bytes  bigint,
  error_mensaje text,
  filas         int,
  solicitado_por uuid references public.usuarios(id) on delete set null,
  generado_at   timestamptz,
  expira_en     timestamptz,
  created_at    timestamptz not null default now(),

  constraint reportes_expiracion check (expira_en is null or expira_en > created_at)
);

create index if not exists idx_reportes_estado on public.reportes (estado, created_at desc);
create index if not exists idx_reportes_usuario on public.reportes (solicitado_por, created_at desc);

-- ---------------------------------------------------------------------------
--  Módulo 12 — Respaldo y continuidad (Disaster Recovery)
-- ---------------------------------------------------------------------------
create table if not exists public.backups (
  id             uuid primary key default gen_random_uuid(),
  etiqueta       text not null unique,
  tipo           text not null default 'COMPLETO' check (tipo in ('COMPLETO','INCREMENTAL')),
  motor          text not null default 'pg_dump',
  ruta_almacenamiento text,
  hash_sha256    text,
  tamano_bytes   bigint,
  estado         text not null default 'EN_PROCESO'
                 check (estado in ('EN_PROCESO','COMPLETADO','ERROR','RESTAURADO','DESCARTADO')),
  iniciado_por   uuid references public.usuarios(id) on delete set null,
  iniciado_en    timestamptz not null default now(),
  finalizado_en  timestamptz,
  mensaje        text,

  constraint backups_finalizado check (finalizado_en is null or finalizado_en >= iniciado_en)
);

create index if not exists idx_backups_fecha on public.backups (iniciado_en desc);

-- Registro de restauraciones (DR): qué backup se restauró y cuándo.
create table if not exists public.restauraciones (
  id             uuid primary key default gen_random_uuid(),
  backup_id      uuid not null references public.backups(id) on delete restrict,
  ejecutado_por  uuid not null references public.usuarios(id) on delete restrict,
  motivo         text not null,
  resultado      text not null check (resultado in ('EXITOSO','ERROR','PARCIAL')),
  duracion_s     int check (duracion_s >= 0),
  mensaje        text,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  Módulo 13 — Tokens de push para la PWA
-- ---------------------------------------------------------------------------
create table if not exists public.dispositivos_usuario (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references public.usuarios(id) on delete cascade,
  push_endpoint  text not null,
  plataforma     text not null check (plataforma in ('ANDROID','IOS','WEB')),
  app_version    text,
  activa         boolean not null default true,
  ultimo_uso     timestamptz,
  created_at     timestamptz not null default now(),

  unique (usuario_id, push_endpoint)
);

create index if not exists idx_push_usuarios on public.dispositivos_usuario (usuario_id, activa);

commit;

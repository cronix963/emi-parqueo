-- ============================================================================
--  SECCIÓN 4 — MÓDULOS 4, 5 y 7: Eventos de acceso, reconocimiento de placa
--  y detección de ocupación mediante visión artificial
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
--  Módulo 4 — Control automático de ingreso y salida
--  Cada fila es un evento inmutable: sensor → IA → decisión de la barrera.
--  Fail-safe: ante falla de software, la barrera permanece cerrada.
-- ---------------------------------------------------------------------------
create table if not exists public.eventos_acceso (
  id                  uuid primary key default gen_random_uuid(),
  dispositivo_id      uuid references public.dispositivos(id) on delete set null,
  vehiculo_id         uuid references public.vehiculos(id) on delete set null,
  plaza_id            uuid references public.plazas(id) on delete set null,
  sentido             public.sentido_acceso not null,
  canal               public.canal_evento not null default 'SENSOR',
  estado              public.estado_evento not null default 'PENDIENTE_REVISION',

  -- Datos observados por el sensor/IA en el momento del evento
  placa_detectada     text,
  confianza_placa     numeric(5,4) check (confianza_placa between 0 and 1),
  ocupacion_detectada boolean,
  hora_deteccion      timestamptz not null default now(),
  hora_evento         timestamptz not null default now(),

  -- Evidencia (Módulo 4 y Módulo 10). Ruta en el bucket, no el binario.
  imagen_evidencia    text,

  -- Decisión y autorización
  decision            text,
  autorizado_por      uuid references public.usuarios(id) on delete set null,
  motivo_autorizacion text,

  -- Acción sobre la barrera (arquitectura segura: por defecto NO se abre)
  barrera_accionada   boolean not null default false,
  barrera_modo        text not null default 'CERRADA'
                      check (barrera_modo in ('CERRADA', 'ABIERTA', 'MANUAL', 'FALLA_SEGURA')),

  -- Resultado de la validación contra el padrón (Módulo 3)
  autorizacion_id     uuid references public.autorizaciones(id) on delete set null,
  requiere_revision   boolean not null default false,

  origen_api_key      text,
  created_at          timestamptz not null default now(),

  -- Un mismo dispositivo no puede generar dos ingresos del mismo vehículo
  -- dentro de la ventana antirrebote (se valida en el trigger siguiente).
  constraint eventos_confianza_rango check (
    confianza_placa is null or (confianza_placa >= 0 and confianza_placa <= 1)
  )
);

create index if not exists idx_eventos_hora    on public.eventos_acceso (hora_evento desc);
create index if not exists idx_eventos_placa   on public.eventos_acceso (placa_detectada, hora_evento desc);
create index if not exists idx_eventos_estado  on public.eventos_acceso (estado, hora_evento desc);
create index if not exists idx_eventos_disp    on public.eventos_acceso (dispositivo_id, hora_evento desc);

-- Hora de salida: se añade como columna real para permitir índices parciales.
alter table public.eventos_acceso
  add column if not exists hora_salida timestamptz;

create index if not exists idx_eventos_sin_salida
  on public.eventos_acceso (hora_evento desc)
  where hora_salida is null;

create index if not exists idx_eventos_hora_salida
  on public.eventos_acceso (hora_salida)
  where hora_salida is not null;

-- Control antirrebote (Módulo 4, RNF): un segundo evento del mismo vehículo
-- por el mismo dispositivo dentro de la ventana configurada se marca como
-- rebote y no se considera para la trazabilidad.
create or replace function public.validar_antirebote()
returns trigger
language plpgsql
as $$
declare
  v_ventana int;
  v_existe  boolean;
begin
  if new.placa_detectada is null then
    return new;
  end if;

  select coalesce(d.ventana_antirebote_s, 90)
    into v_ventana
    from public.dispositivos d
   where d.id = new.dispositivo_id;

  select exists (
    select 1
      from public.eventos_acceso e
     where e.dispositivo_id is not distinct from new.dispositivo_id
       and upper(e.placa_detectada) = upper(new.placa_detectada)
       and e.id <> new.id
       and e.hora_evento > new.hora_evento - make_interval(secs => v_ventana)
  ) into v_existe;

  if v_existe then
    new.estado := 'ANULADO';
    new.decision := 'REBOTE_DETECTADO';
    new.barrera_modo := 'CERRADA';
  end if;

  return new;
end;
$$;

create trigger trg_eventos_antirebote
  before insert on public.eventos_acceso
  for each row execute function public.validar_antirebote();

-- ---------------------------------------------------------------------------
--  Módulo 5 — Captura y reconocimiento vehicular (ALPR/ANPR)
--  Un evento puede tener varios intentos de reconocimiento.
--  RNF: el score de confianza es obligatorio; prohibido biometría/rostro.
-- ---------------------------------------------------------------------------
create table if not exists public.reconocimientos_placa (
  id                  uuid primary key default gen_random_uuid(),
  evento_id           uuid not null references public.eventos_acceso(id) on delete cascade,
  motor               text not null default 'alpr',   -- versión del motor
  version_modelo      text,
  placa_esperada      text,
  placa_leida         text,
  -- Obligatorio: nivel de confianza de la IA (RNF Módulo 5)
  score_confianza     numeric(5,4) not null check (score_confianza between 0 and 1),
  estado              public.estado_reconocimiento not null default 'BAJA_CONFIANZA',
  tiempo_inferencia_ms int check (tiempo_inferencia_ms >= 0),
  imagen_recorte      text,
  requiere_validacion_manual boolean generated always as (
    estado in ('BAJA_CONFIANZA', 'ILEGIBLE')
  ) stored,
  validado_por        uuid references public.usuarios(id) on delete set null,
  validado_en         timestamptz,
  placa_validada      text,
  created_at          timestamptz not null default now(),

  constraint recognicimientos_placa_formato check (
    placa_leida is null or placa_leida ~ '^[A-Z0-9]{4,10}$'
  ),
  constraint recognicimientos_validacion check (
    validado_por is null or estado = 'VALIDADO_MANUAL'
  )
);

create index if not exists idx_recon_evento  on public.reconocimientos_placa (evento_id);
create index if not exists idx_recon_placa   on public.reconocimientos_placa (placa_leida, created_at desc);
create index if not exists idx_recon_pendientes
  on public.reconocimientos_placa (created_at)
  where requiere_validacion_manual and validado_por is null;

-- ---------------------------------------------------------------------------
--  Módulo 7 — Estado de ocupación e historial de cambios
--  El estado actual vive en plazas.estado (lectura rápida); el histórico es
--  append-only para trazabilidad (Módulo 10).
-- ---------------------------------------------------------------------------
create table if not exists public.estados_ocupacion_historial (
  id                bigserial primary key,
  plaza_id          uuid not null references public.plazas(id) on delete cascade,
  estado_anterior   public.estado_plaza,
  estado_nuevo      public.estado_plaza not null,
  origen            public.origen_deteccion not null default 'VISION_ARTIFICIAL',
  dispositivo_id    uuid references public.dispositivos(id) on delete set null,
  -- Confianza del detector: clave para el objetivo de 90% de precisión
  confianza         numeric(5,4) check (confianza between 0 and 1),
  ocupacion_pct     numeric(5,2) check (ocupacion_pct between 0 and 100),
  imagen_evidencia  text,
  climate           text,   -- 'soleado' | 'nublado' | 'lluvia' | 'noche' (RNF M7)
  registrado_en     timestamptz not null default now(),
  registrado_por    uuid references public.usuarios(id) on delete set null
);

create index if not exists idx_ocu_plaza_fecha
  on public.estados_ocupacion_historial (plaza_id, registrado_en desc);
create index if not exists idx_ocu_fecha
  on public.estados_ocupacion_historial (registrado_en desc);
create index if not exists idx_ocu_zona_estado
  on public.estados_ocupacion_historial (estado_nuevo, registrado_en desc);

-- ---------------------------------------------------------------------------
--  Sincronización: cada cambio de ocupación actualiza plazas.estado y queda
--  registrado en el histórico (Módulo 7: "registro histórico de cambios").
-- ---------------------------------------------------------------------------
create or replace function public.registrar_cambio_ocupacion()
returns trigger
language plpgsql
as $$
begin
  -- Disparador BEFORE INSERT: sincroniza el estado vigente de la plaza
  -- (lectura rápida para el dashboard) a partir de la traza histórica.
  update public.plazas
     set estado              = new.estado_nuevo,
         ultima_deteccion_at = new.registrado_en,
         actualizado_at      = now()
   where id = new.plaza_id;

  return new;
end;
$$;

create trigger trg_ocupacion_sync
  before insert on public.estados_ocupacion_historial
  for each row execute function public.registrar_cambio_ocupacion();

commit;

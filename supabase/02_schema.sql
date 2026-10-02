-- ============================================================================
--  SECCIÓN 3 — MÓDULO 3: Vehículos y autorizaciones
--  Módulo 6: Zonas, plazas y dispositivos (IoT / hardware)
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
--  Módulo 3 — Padrón de vehículos autorizados
--  Minimización de datos (RNF): no se almacenan biometría ni rostro; sólo los
--  campos estrictamente necesarios para el control de acceso.
-- ---------------------------------------------------------------------------
create table if not exists public.vehiculos (
  id                uuid primary key default gen_random_uuid(),
  placa             text not null,
  tipo              public.tipo_vehiculo not null default 'AUTOMOVIL',
  categoria         public.categoria_vehiculo not null default 'PERSONAL',
  marca             text,
  modelo            text,
  color             text,
  propietario_nombre text,
  propietario_documento text,
  -- Vínculo opcional: el vehículo puede pertenecer a un usuario del padrón.
  propietario_usuario_id uuid references public.usuarios(id) on delete set null,
  activo            boolean not null default true,
  observaciones     text,
  creado_por        uuid references public.usuarios(id) on delete set null,
  created_at        timestamptz not null default now(),
  actualizado_at    timestamptz not null default now(),

  constraint vehiculos_placa_formato check (placa ~ '^[A-Z0-9]{4,10}$')
);

-- RNF: prevención de placas activas duplicadas (índice parcial único).
create unique index if not exists uq_vehiculos_placa_activa
  on public.vehiculos (upper(placa))
  where activo;

create index if not exists idx_vehiculos_categoria on public.vehiculos (categoria);
create index if not exists idx_vehiculos_propietario on public.vehiculos (propietario_usuario_id);

-- ---------------------------------------------------------------------------
--  Módulo 3 — Autorizaciones (permanentes, temporales y excepcionales)
-- ---------------------------------------------------------------------------
create table if not exists public.autorizaciones (
  id               uuid primary key default gen_random_uuid(),
  vehiculo_id      uuid not null references public.vehiculos(id) on delete cascade,
  tipo             public.tipo_autorizacion not null default 'PERMANENTE',
  vigente_desde    timestamptz not null default now(),
  vigente_hasta    timestamptz,
  zona_id          uuid,  -- FK agregada en la sección 4 (dependencia cruzada)
  referencia       text,   -- nro. de documento, contrato o orden de servicio
  motivo           text,
  permitido_acceso boolean not null default true,
  emitido_por      uuid references public.usuarios(id) on delete set null,
  created_at       timestamptz not null default now(),
  actualizado_at   timestamptz not null default now(),

  constraint autorizaciones_periodo check (
    vigente_hasta is null or vigente_hasta > vigente_desde
  ),
  -- Una autorización temporal siempre debe tener fecha de expiración.
  constraint autorizaciones_temporal_con_vigencia check (
    tipo <> 'TEMPORAL' or vigente_hasta is not null
  )
);

create index if not exists idx_autorizaciones_vehiculo
  on public.autorizaciones (vehiculo_id, vigente_desde desc);
-- Nota: no se indexa con predicado `vigente_hasta > now()` porque `now()` es
-- STABLE y PostgreSQL exige IMMUTABLE en el predicado de un índice parcial.
create index if not exists idx_autorizaciones_vigencia
  on public.autorizaciones (vigente_hasta)
  where vigente_hasta is not null;

-- ---------------------------------------------------------------------------
--  Módulo 6 — Zonas de parqueo
-- ---------------------------------------------------------------------------
create table if not exists public.zonas (
  id               uuid primary key default gen_random_uuid(),
  codigo           text not null unique,
  nombre           text not null,
  descripcion      text,
  plano_layout     text,          -- SVG/JSON del plano (Módulo 8: mapa 2D)
  capacidad_maxima int  not null default 0,
  umbral_alerta_pct int not null default 85
                  check (umbral_alerta_pct between 1 and 100),
  activa           boolean not null default true,
  created_at       timestamptz not null default now(),
  actualizado_at   timestamptz not null default now(),

  constraint zonas_capacidad_no_negativa check (capacidad_maxima >= 0)
);

-- ---------------------------------------------------------------------------
--  Módulo 6 — Plazas de estacionamiento
--  Relación única y consistente plaza → zona (RNF). Una plaza pertenece a
--  exactamente una zona y a lo sumo a una cámara de supervisión.
-- ---------------------------------------------------------------------------
create table if not exists public.plazas (
  id                 uuid primary key default gen_random_uuid(),
  zona_id            uuid not null references public.zonas(id) on delete restrict,
  codigo             text not null unique,
  fila               int,
  columna            int,
  tipo_vehiculo_permitido public.tipo_vehiculo default 'AUTOMOVIL',
  accesible          boolean not null default false,
  reservada          boolean not null default false,   -- fuera del cálculo público
  estado             public.estado_plaza not null default 'SIN_DATOS',
  -- Módulo 7: Región de Interés (ROI) normalizada 0..1 para el motor de visión
  roi_x               numeric(6,4) check (roi_x between 0 and 1),
  roi_y               numeric(6,4) check (roi_y between 0 and 1),
  roi_ancho           numeric(6,4) check (roi_ancho between 0 and 1),
  roi_alto            numeric(6,4) check (roi_alto between 0 and 1),
  ultima_deteccion_at timestamptz,
  activo             boolean not null default true,   -- habilitación por mantenimiento
  creado_por          uuid references public.usuarios(id) on delete set null,
  created_at          timestamptz not null default now(),
  actualizado_at      timestamptz not null default now(),

  constraint plazas_roi_completa check (
    num_nulls(roi_x, roi_y, roi_ancho, roi_alto) in (0, 4)
  ),
  constraint plazas_codigo_formato check (codigo ~ '^[A-Z0-9-]{2,12}$')
);

create index if not exists idx_plazas_zona   on public.plazas (zona_id);
create index if not exists idx_plazas_estado on public.plazas (estado);
create index if not exists idx_plazas_activas on public.plazas (activo);

-- ---------------------------------------------------------------------------
--  Módulo 6 — Hardware: cámaras, sensores, barreras, nodos edge
-- ---------------------------------------------------------------------------
create table if not exists public.dispositivos (
  id                uuid primary key default gen_random_uuid(),
  codigo            text not null unique,
  tipo              public.tipo_dispositivo not null,
  nombre            text not null,
  zona_id           uuid references public.zonas(id) on delete set null,
  ubicacion         text,          -- descripción lógica de la ubicación
  -- Configuración del endpoint (Módulo 4: registro de fallas de comunicación)
  direccion_ip      inet,
  puerto            int  check (puerto between 1 and 65535),
  api_key           text,          -- hash en producción, para nodos edge
  intervalo_lectura_s int not null default 30
                    check (intervalo_lectura_s between 1 and 86400),
  -- Ventana antirrebote (Módulo 4, RNF): ignora lecturas repetidas del mismo
  -- vehículo dentro de este intervalo.
  ventana_antirebote_s int not null default 90
                    check (ventana_antirebote_s between 10 and 3600),
  estado            public.estado_dispositivo not null default 'DESCONECTADO',
  ultimo_heartbeat  timestamptz,
  firmware          text,
  creado_por        uuid references public.usuarios(id) on delete set null,
  created_at        timestamptz not null default now(),
  actualizado_at    timestamptz not null default now()
);

create index if not exists idx_dispositivos_zona   on public.dispositivos (zona_id);
create index if not exists idx_dispositivos_estado on public.dispositivos (estado);
create index if not exists idx_dispositivos_tipo   on public.dispositivos (tipo);

-- Relación plaza ↔ cámara de supervisión (relación única, 1:N desde la cámara).
create table if not exists public.plazas_camaras (
  plaza_id       uuid not null references public.plazas(id) on delete cascade,
  dispositivo_id uuid not null references public.dispositivos(id) on delete cascade,
  es_principal   boolean not null default true,
  asignado_por   uuid references public.usuarios(id) on delete set null,
  created_at     timestamptz not null default now(),

  primary key (plaza_id, dispositivo_id)
);

-- Una sola cámara principal por plaza (garantiza la relación única del RNF).
create unique index if not exists uq_plazas_camara_principal
  on public.plazas_camaras (plaza_id)
  where es_principal;

-- ---------------------------------------------------------------------------
--  Autorizaciones → Zonas (FK diferida por dependencia cruzada)
-- ---------------------------------------------------------------------------
alter table public.autorizaciones
  drop constraint if exists autorizaciones_zona_id_fkey;
alter table public.autorizaciones
  add constraint autorizaciones_zona_id_fkey
  foreign key (zona_id) references public.zonas(id) on delete set null;

commit;

-- =====================================================================
--  Sistema de Parqueo Automático — EMI
--  Esquema base para Supabase (SQL Editor → New query → Run)
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
--  Zonas del parqueo
--  Ajustar filas/columnas cuando se entregue el diseño definitivo.
-- ---------------------------------------------------------------------
create table if not exists public.zonas (
  id           text primary key,
  nombre       text        not null,
  descripcion  text,
  filas        int         not null default 4,
  columnas     int         not null default 8,
  capacidades  jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  Espacios (plazas de estacionamiento)
-- ---------------------------------------------------------------------
create table if not exists public.espacios (
  id                    text primary key default ('esp-' || gen_random_uuid()::text),
  zona_id               text        not null references public.zonas(id) on delete cascade,
  codigo                text        not null unique,
  fila                  int         not null,
  columna               int         not null,
  estado                text        not null default 'libre'
                          check (estado in ('libre','ocupado','reservado','mantenimiento')),
  tipo_permitido        text        not null default 'cualquiera'
                          check (tipo_permitido in ('cualquiera','automovil','camioneta','motocicleta','camion')),
  accesible             boolean     not null default false,
  placa                 text,
  modelo                text,
  hora_ingreso          timestamptz,
  hora_salida_prevista  timestamptz,
  updated_at            timestamptz not null default now(),
  unique (zona_id, fila, columna)
);

create index if not exists idx_espacios_zona   on public.espacios (zona_id);
create index if not exists idx_espacios_estado on public.espacios (estado);

-- ---------------------------------------------------------------------
--  Registros de ingreso / salida
-- ---------------------------------------------------------------------
create table if not exists public.registros (
  id                   uuid primary key default gen_random_uuid(),
  espacio_codigo       text        not null,
  zona_id              text        not null references public.zonas(id) on delete cascade,
  placa                text        not null,
  modelo               text,
  tipo                 text        not null default 'automovil'
                         check (tipo in ('automovil','camioneta','motocicleta','camion')),
  hora_ingreso         timestamptz not null default now(),
  hora_salida_prevista timestamptz,
  hora_salida          timestamptz,
  estado               text        not null default 'ocupado'
                         check (estado in ('ocupado','reservado','finalizado')),
  usuario_id           uuid        references auth.users(id) on delete set null
);

create index if not exists idx_registros_placa on public.registros (placa);
create index if not exists idx_registros_ingreso on public.registros (hora_ingreso desc);

-- ---------------------------------------------------------------------
--  RLS: sólo usuarios autenticados leen; el parqueo se actualiza desde
--  el backend/servicio. Ajustar según la política real del campus.
-- ---------------------------------------------------------------------
alter table public.zonas    enable row level security;
alter table public.espacios enable row level security;
alter table public.registros enable row level security;

create policy "lectura zonas para autenticados"
  on public.zonas for select to authenticated using (true);

create policy "lectura espacios para autenticados"
  on public.espacios for select to authenticated using (true);

create policy "lectura registros para autenticados"
  on public.registros for select to authenticated using (true);

-- ---------------------------------------------------------------------
--  Datos iniciales (idempotente)
-- ---------------------------------------------------------------------
insert into public.zonas (id, nombre, descripcion, filas, columnas, capacidades) values
  ('zona-a', 'Pabellón A — Estacionamiento Norte',
      'Acceso principal por la calle de servicio. Plazas para automóviles y camionetas.', 4, 8,
      '{"automovil":24,"camioneta":8}'),
  ('zona-b', 'Pabellón B — Estacionamiento Sur',
      'Plazas mixtas, incluye dos espacios reservados para personas con movilidad reducida.', 3, 8,
      '{"automovil":16,"camioneta":8}'),
  ('zona-c', 'Polideportivo — Motocicletas',
      'Área techada para motocicletas y ciclos del personal.', 2, 10,
      '{"motocicleta":20}'),
  ('zona-d', 'Cuartel — Camiones y carga',
      'Estacionamiento de vehículos pesados y unidades de la institución.', 2, 6,
      '{"camion":12}')
on conflict (id) do nothing;

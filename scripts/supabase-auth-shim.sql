-- ============================================================================
--  Shim de Supabase para el validador local (PGlite)
--
--  ESTE ARCHIVO NO SE EJECUTA EN SUPABASE.
--  Supabase ya provee el schema `auth` (usuarios de Auth, sesiones, JWT).
--  PGlite es un PostgreSQL pelado, así que este script crea una versión
--  mínima con la misma forma para poder validar el esquema fuera de línea.
--
--  Simula únicamente: auth.users (tabla), auth.uid() (función) y los roles
--  `anon` / `authenticated` que Supabase crea en cada proyecto.
-- ============================================================================

-- Roles provisioned por Supabase (idénticos a los del proyecto real).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
end
$$;

grant usage on schema public to anon, authenticated;

create schema if not exists auth;

create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  raw_user_meta_data jsonb not null default '{}'::jsonb
);

-- En Supabase, auth.uid() extrae el ID del claim del JWT de la petición.
-- Aquí devuelve NULL porque el validador no emite tokens.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select null::uuid;
$$;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select '{}'::jsonb;
$$;

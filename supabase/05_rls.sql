-- ============================================================================
--  SECCIÓN 6 — Row Level Security (RLS)
--  Principio de mínimo privilegio: cada rol ve exactamente lo que le
--  corresponde según el RBAC del Módulo 2.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  Helpers de contexto.
--  Son SECURITY DEFINER a propósito: sin esto, consultar public.usuarios desde
--  la política de public.usuarios causaría recursión infinita de RLS.
-- ---------------------------------------------------------------------------
create or replace function public.id_usuario_actual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id from public.usuarios u where u.auth_user_id = auth.uid() and u.activo;
$$;

create or replace function public.rol_actual()
returns public.rol_codigo
language sql
stable
security definer
set search_path = public
as $$
  select u.rol_codigo
    from public.usuarios u
   where u.auth_user_id = auth.uid()
     and u.activo;
$$;

create or replace function public.es_admin_o_soporte()
returns boolean
language sql
stable
as $$
  select coalesce(public.rol_actual() in ('ADMINISTRACION','SOPORTE_TECNICO'), false);
$$;

-- ============================================================================
--  RLS por tabla
-- ============================================================================

-- --- usuarios (Módulo 2) ---------------------------------------------------
alter table public.usuarios enable row level security;

create policy usuarios_select on public.usuarios
  for select to authenticated
  using (id = public.id_usuario_actual() or public.es_admin_o_soporte());

create policy usuarios_admin_all on public.usuarios
  for all to authenticated
  using (public.rol_actual() = 'ADMINISTRACION')
  with check (public.rol_actual() = 'ADMINISTRACION');

-- --- roles y permisos (Módulo 2) -------------------------------------------
alter table public.roles       enable row level security;
alter table public.permisos    enable row level security;
alter table public.roles_permisos enable row level security;

create policy roles_select on public.roles for select to authenticated using (true);
create policy permisos_select on public.permisos for select to authenticated using (true);
create policy roles_permisos_select on public.roles_permisos
  for select to authenticated using (true);
create policy roles_permisos_admin on public.roles_permisos
  for all to authenticated
  using (public.rol_actual() = 'ADMINISTRACION')
  with check (public.rol_actual() = 'ADMINISTRACION');

-- Trazabilidad de cambios de rol (RNF del Módulo 2): sólo lectura para
-- autenticados y escritura exclusiva de la administración.
alter table public.usuarios_roles_historico enable row level security;

create policy roles_historico_select on public.usuarios_roles_historico
  for select to authenticated using (rol_actual() is not null);

create policy roles_historico_admin on public.usuarios_roles_historico
  for all to authenticated
  using (public.rol_actual() = 'ADMINISTRACION')
  with check (public.rol_actual() = 'ADMINISTRACION');

-- --- vehículos y autorizaciones (Módulo 3) --------------------------------
alter table public.vehiculos      enable row level security;
alter table public.autorizaciones enable row level security;

create policy vehiculos_select on public.vehiculos
  for select to authenticated
  using (rol_actual() is not null);
create policy vehiculos_write on public.vehiculos
  for all to authenticated
  using (public.rol_actual() in ('ADMINISTRACION','SEGURIDAD','OPERACIONES'))
  with check (public.rol_actual() in ('ADMINISTRACION','SEGURIDAD','OPERACIONES'));

create policy autorizaciones_select on public.autorizaciones
  for select to authenticated using (rol_actual() is not null);
create policy autorizaciones_write on public.autorizaciones
  for all to authenticated
  using (public.rol_actual() in ('ADMINISTRACION','SEGURIDAD'))
  with check (public.rol_actual() in ('ADMINISTRACION','SEGURIDAD'));

-- --- zonas, plazas, dispositivos (Módulo 6) ---------------------------------
alter table public.zonas            enable row level security;
alter table public.plazas           enable row level security;
alter table public.dispositivos     enable row level security;
alter table public.plazas_camaras   enable row level security;

-- El público (PWA sin sesión, Módulo 13) sólo ve disponibilidad agregada,
-- nunca la detalle de cada plaza con placa asociada.
create policy zonas_select_public on public.zonas
  for select to anon, authenticated using (activa);

create policy plazas_select_autenticados on public.plazas
  for select to authenticated using (rol_actual() is not null);

create policy plazas_admin_all on public.plazas
  for all to authenticated
  using (public.rol_actual() in ('ADMINISTRACION','SOPORTE_TECNICO'))
  with check (public.rol_actual() in ('ADMINISTRACION','SOPORTE_TECNICO'));

create policy dispositivos_select on public.dispositivos
  for select to authenticated using (rol_actual() is not null);
create policy dispositivos_admin_all on public.dispositivos
  for all to authenticated
  using (public.rol_actual() in ('ADMINISTRACION','SOPORTE_TECNICO'))
  with check (public.rol_actual() in ('ADMINISTRACION','SOPORTE_TECNICO'));

create policy plazas_camaras_select on public.plazas_camaras
  for select to authenticated using (rol_actual() is not null);

-- --- eventos de acceso y reconocimiento (Módulos 4 y 5) --------------------
alter table public.eventos_acceso        enable row level security;
alter table public.reconocimientos_placa enable row level security;

create policy eventos_select on public.eventos_acceso
  for select to authenticated using (rol_actual() is not null);
create policy eventos_write on public.eventos_acceso
  for all to authenticated
  using (public.rol_actual() in ('SEGURIDAD','OPERACIONES','ADMINISTRACION'))
  with check (public.rol_actual() in ('SEGURIDAD','OPERACIONES','ADMINISTRACION'));

-- La validación manual de baja confianza (Módulo 5) es tarea de Seguridad u
-- Operaciones; el motor de IA escribe vía service_role, no por esta política.
create policy recognimientos_select on public.reconocimientos_placa
  for select to authenticated using (rol_actual() is not null);
create policy recognimientos_manual on public.reconocimientos_placa
  for update to authenticated
  using (public.rol_actual() in ('SEGURIDAD','OPERACIONES','ADMINISTRACION'))
  with check (public.rol_actual() in ('SEGURIDAD','OPERACIONES','ADMINISTRACION'));

-- --- ocupación (Módulo 7) --------------------------------------------------
alter table public.estados_ocupacion_historial enable row level security;

create policy ocupacion_select on public.estados_ocupacion_historial
  for select to authenticated using (rol_actual() is not null);
create policy ocupacion_write on public.estados_ocupacion_historial
  for insert to authenticated
  with check (rol_actual() in ('ADMINISTRACION', 'OPERACIONES'));

-- --- alertas (Módulo 9) ----------------------------------------------------
alter table public.alertas         enable row level security;
alter table public.alertas_acciones enable row level security;

create policy alertas_select on public.alertas
  for select to authenticated using (rol_actual() is not null);
create policy alertas_write on public.alertas
  for update to authenticated
  using (public.rol_actual() in ('OPERACIONES','ADMINISTRACION'))
  with check (public.rol_actual() in ('OPERACIONES','ADMINISTRACION'));
create policy alertas_acciones_insert on public.alertas_acciones
  for insert to authenticated with check (auth.uid() is not null);
create policy alertas_acciones_select on public.alertas_acciones
  for select to authenticated using (rol_actual() is not null);

-- --- auditoría y respaldo (Módulo 12): sólo Admin y Soporte -----------------
alter table public.bitacora_auditoria  enable row level security;
alter table public.backups            enable row level security;
alter table public.restauraciones     enable row level security;
alter table public.intentos_autenticacion enable row level security;

create policy auditoria_select on public.bitacora_auditoria
  for select to authenticated using (public.es_admin_o_soporte());
create policy auditoria_insert on public.bitacora_auditoria
  for insert to authenticated with check (public.es_admin_o_soporte());

create policy backups_select on public.backups
  for select to authenticated using (public.es_admin_o_soporte());
create policy backups_write on public.backups
  for all to authenticated
  using (public.rol_actual() = 'ADMINISTRACION')
  with check (public.rol_actual() = 'ADMINISTRACION');

create policy restauraciones_all on public.restauraciones
  for all to authenticated
  using (public.rol_actual() = 'ADMINISTRACION')
  with check (public.rol_actual() = 'ADMINISTRACION');

create policy intentos_select on public.intentos_autenticacion
  for select to authenticated using (public.es_admin_o_soporte());

-- --- reportes (Módulo 11) --------------------------------------------------
alter table public.reportes enable row level security;

create policy reportes_all on public.reportes
  for all to authenticated using (rol_actual() is not null)
  with check (rol_actual() is not null);

-- --- fallas de hardware (Módulo 12) ----------------------------------------
alter table public.dispositivos_fallas enable row level security;

create policy fallas_select on public.dispositivos_fallas
  for select to authenticated using (rol_actual() is not null);
create policy fallas_insert on public.dispositivos_fallas
  for insert to authenticated with check (rol_actual() in ('ADMINISTRACION','SOPORTE_TECNICO'));

-- --- sesiones (Módulo 1) ---------------------------------------------------
alter table public.sesiones enable row level security;

create policy sesiones_own on public.sesiones
  for select to authenticated
  using (usuario_id = public.id_usuario_actual() or public.es_admin_o_soporte());

-- --- push PWA (Módulo 13) --------------------------------------------------
alter table public.dispositivos_usuario enable row level security;

create policy push_own on public.dispositivos_usuario
  for all to authenticated
  using (usuario_id = public.id_usuario_actual())
  with check (usuario_id = public.id_usuario_actual());

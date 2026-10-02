-- ============================================================================
--  SECCIÓN 7 — Vistas de indicadores y funciones de ingesta
--  Módulo 8 (dashboard en tiempo real), Módulo 11 (reportes) y soporte para
--  los objetivos métricos del proyecto (≥90% precisión, ≥95% trazabilidad).
-- ============================================================================

-- ---------------------------------------------------------------------------
--  Indicador: ocupación actual por zona (Módulo 8)
-- ---------------------------------------------------------------------------
create or replace view public.vw_ocupacion_zona
with (security_invoker = true) as
select
  z.id                as zona_id,
  z.codigo            as zona_codigo,
  z.nombre            as zona_nombre,
  z.capacidad_maxima,
  count(p.id)                                        as total_plazas,
  count(*) filter (where p.estado = 'LIBRE')         as libres,
  count(*) filter (where p.estado = 'OCUPADO')       as ocupadas,
  count(*) filter (where p.estado = 'MANTENIMIENTO') as mantenimiento,
  count(*) filter (where p.estado = 'SIN_DATOS')     as sin_datos,
  count(*) filter (where p.activo)                   as plazas_activas,
  round(
    100.0 * count(*) filter (where p.estado = 'OCUPADO')
    / nullif(count(*) filter (where p.activo), 0), 2
  )                                                   as ocupacion_pct,
  case
    when z.capacidad_maxima > 0
      then round(
        100.0 * count(*) filter (where p.estado = 'OCUPADO') / z.capacidad_maxima, 2)
    else null
  end                                                 as ocupacion_capacidad_pct
from public.zonas z
left join public.plazas p on p.zona_id = z.id
where z.activa
group by z.id, z.codigo, z.nombre, z.capacidad_maxima;

-- ---------------------------------------------------------------------------
--  Indicador: salud del hardware (Módulo 8, Módulo 9)
-- ---------------------------------------------------------------------------
create or replace view public.vw_salud_dispositivos
with (security_invoker = true) as
select
  d.id              as dispositivo_id,
  d.codigo,
  d.nombre,
  d.tipo,
  d.estado,
  d.zona_id,
  z.nombre          as zona_nombre,
  d.ultimo_heartbeat,
  extract(epoch from (now() - d.ultimo_heartbeat))::int as segundos_sin_heartbeat,
  case
    when d.ultimo_heartbeat is null                        then 'SIN_DATOS'
    when now() - d.ultimo_heartbeat > interval '2 minutes' then 'DESCONECTADO'
    else d.estado::text
  end                as estado_efectivo,
  (select count(*) from public.dispositivos_fallas f
    where f.dispositivo_id = d.id and f.recuperada_en is null) as fallas_abiertas
from public.dispositivos d
left join public.zonas z on z.id = d.zona_id;

-- ---------------------------------------------------------------------------
--  Indicador: trazabilidad de eventos (objetivo: ≥95% de eventos registrados)
--  Compara los eventos detectados por el sensor contra los que dejaron registro
--  trazable (con hora de salida cerrada o anulada explícitamente).
-- ---------------------------------------------------------------------------
create or replace view public.vw_indicador_trazabilidad
with (security_invoker = true) as
select
  date_trunc('day', e.hora_evento)                as dia,
  count(*)                                        as eventos_totales,
  count(*) filter (where e.estado <> 'ANULADO')    as eventos_efectivos,
  count(*) filter (where e.estado = 'ANULADO')     as rebotes_descartados,
  count(*) filter (where e.hora_salida is not null) as ciclos_completos,
  count(*) filter (where e.imagen_evidencia is not null) as con_evidencia,
  round(
    100.0 * count(*) filter (where e.estado <> 'ANULADO') / nullif(count(*), 0), 2
  )                                               as pct_trazabilidad
from public.eventos_acceso e
group by date_trunc('day', e.hora_evento);

-- ---------------------------------------------------------------------------
--  Indicador: precisión estimada del reconocimiento de placa
--  (objetivo: ≥90% de acierto con placas reales de la EMI UALP)
-- ---------------------------------------------------------------------------
create or replace view public.vw_indicador_precision_placa
with (security_invoker = true) as
select
  r.motor,
  r.version_modelo,
  count(*)                                                      as total_lecturas,
  count(*) filter (where r.estado = 'RECONOCIDO')               as aciertos,
  count(*) filter (where r.estado = 'NO_ENCONTRADO')            as no_autorizados,
  count(*) filter (where r.estado = 'ILEGIBLE')                 as ilegibles,
  count(*) filter (where r.estado in ('BAJA_CONFIANZA','VALIDADO_MANUAL')) as a_validar,
  round(avg(r.score_confianza) * 100, 2)                        as confianza_promedio_pct,
  round(
    100.0 * count(*) filter (where r.estado = 'RECONOCIDO') / nullif(count(*), 0), 2
  )                                                             as precision_pct,
  round(avg(r.tiempo_inferencia_ms)::numeric, 2)               as latencia_promedio_ms
from public.reconocimientos_placa r
group by r.motor, r.version_modelo;

-- ---------------------------------------------------------------------------
--  Tiempo de permanencia por vehículo (Módulo 10)
-- ---------------------------------------------------------------------------
create or replace view public.vw_tiempo_permanencia
with (security_invoker = true) as
select
  e.placa_detectada,
  min(e.hora_evento)                                          as primer_ingreso,
  max(e.hora_evento)                                          as ultimo_evento,
  count(*) filter (where e.sentido = 'INGRESO')               as ingresos,
  count(*) filter (where e.sentido = 'SALIDA')                as salidas,
  round(extract(epoch from (max(e.hora_evento) - min(e.hora_evento))) / 60) as minutos_dentro
from public.eventos_acceso e
where e.placa_detectada is not null
  and e.estado <> 'ANULADO'
group by e.placa_detectada;

-- ---------------------------------------------------------------------------
--  Flujo vehicular por hora (Módulo 11: horas pico)
-- ---------------------------------------------------------------------------
create or replace view public.vw_flujo_por_hora
with (security_invoker = true) as
select
  date_trunc('day', e.hora_evento)     as dia,
  extract(hour  from e.hora_evento)::int as hora,
  extract(dow   from e.hora_evento)::int as dia_semana,
  count(*) filter (where e.sentido = 'INGRESO')    as ingresos,
  count(*) filter (where e.sentido = 'SALIDA')     as salidas,
  count(*)                                          as total,
  count(*) filter (where e.estado = 'DENEGADO')     as denegados
from public.eventos_acceso e
where e.estado <> 'ANULADO'
group by 1, 2, 3;

-- ---------------------------------------------------------------------------
--  Vistas de compatibilidad con el frontend actual (Next.js → Supabase).
--  Mapean plazas/eventos al contrato que consume src/lib/parking/queries.ts.
-- ---------------------------------------------------------------------------
create or replace view public.espacios
with (security_invoker = true) as
select
  p.id::text                                   as id,
  p.codigo,
  p.fila,
  p.columna,
  lower(p.estado::text)                        as estado,
  -- El enum usa MOTOCICLISTA/CAMIONETA; el contrato del frontend (TipoVehiculo)
  -- usa keys en snake_case, de modo que se traduce en la capa de vista.
  case p.tipo_vehiculo_permitido
    when 'AUTOMOVIL'    then 'automovil'
    when 'CAMIONETA'    then 'camioneta'
    when 'MOTOCICLISTA' then 'motocicleta'
    when 'CAMION'       then 'camion'
    when 'BUS'          then 'bus'
    when 'CICLO'        then 'ciclo'
  end                                              as tipo_permitido,
  p.zona_id::text                              as zona_id,
  (select e.placa_detectada
     from public.eventos_acceso e
    where e.plaza_id = p.id
      and e.sentido = 'INGRESO'
      and e.estado <> 'ANULADO'
    order by e.hora_evento desc
    limit 1)                                  as placa,
  null::text                                   as modelo,
  (select e.hora_evento
     from public.eventos_acceso e
    where e.plaza_id = p.id and e.sentido = 'INGRESO' and e.estado <> 'ANULADO'
    order by e.hora_evento desc limit 1)       as hora_ingreso,
  null::timestamptz                            as hora_salida_prevista,
  p.accesible,
  p.activo
from public.plazas p;

create or replace view public.registros
with (security_invoker = true) as
select
  e.id::uuid                                   as id,
  p.codigo                                     as espacio_codigo,
  p.zona_id::text                              as zona_id,
  coalesce(e.placa_detectada, 'DESCONOCIDA')   as placa,
  v.modelo                                     as modelo,
  case v.tipo
    when 'AUTOMOVIL'    then 'automovil'
    when 'CAMIONETA'    then 'camioneta'
    when 'MOTOCICLISTA' then 'motocicleta'
    when 'CAMION'       then 'camion'
    when 'BUS'          then 'bus'
    when 'CICLO'        then 'ciclo'
    else 'automovil'
  end                                          as tipo,
  e.hora_evento                                as hora_ingreso,
  null::timestamptz                            as hora_salida_prevista,
  salida.hora_evento                           as hora_salida,
  -- Sin plaza asignada el evento sigue siendo un ingreso en curso; con plaza
  -- asignada se refleja el estado vigente de esa plaza.
  coalesce(lower(p.estado::text), 'ocupado')   as estado
from public.eventos_acceso e
left join public.plazas   p on p.id = e.plaza_id
left join public.vehiculos v on v.id = e.vehiculo_id
left join lateral (
  select s.hora_evento
    from public.eventos_acceso s
   where s.sentido = 'SALIDA'
     and s.plaza_id = e.plaza_id
     and s.estado <> 'ANULADO'
     and s.hora_evento >= e.hora_evento
   order by s.hora_evento asc
   limit 1
) salida on true
where e.sentido = 'INGRESO'
  and e.estado <> 'ANULADO';

-- ---------------------------------------------------------------------------
--  Función de ingesta para el Módulo 4 (sensores IoT).
--  El nodo edge llama a esta función vía PostgREST con service_role.
--  Fail-safe: nunca deja la barrera abierta por falla de software.
-- ---------------------------------------------------------------------------
create or replace function public.registrar_evento_sensor(
  p_dispositivo_codigo text,
  p_sentido            public.sentido_acceso,
  p_placa_detectada    text default null,
  p_ocupacion_detectada boolean default null,
  p_imagen_evidencia   text default null,
  p_origen_api_key     text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dispositivo public.dispositivos%rowtype;
  v_vehiculo    uuid;
  v_autorizacion uuid;
  v_evento      uuid;
  v_permitido   boolean := false;
begin
  select * into v_dispositivo
    from public.dispositivos
   where codigo = p_dispositivo_codigo and estado <> 'FUERA_DE_SERVICIO';

  if not found then
    raise exception 'Dispositivo desconocido o fuera de servicio: %', p_dispositivo_codigo
      using errcode = 'P0002';
  end if;

  -- Se busca el vehículo autorizado vigente para la placa leída.
  if p_placa_detectada is not null then
    select v.id into v_vehiculo
      from public.vehiculos v
     where upper(v.placa) = upper(p_placa_detectada) and v.activo
     limit 1;

    if v_vehiculo is not null then
      select a.id into v_autorizacion
        from public.autorizaciones a
       where a.vehiculo_id = v_vehiculo
         and a.permitido_acceso
         and a.vigente_desde <= now()
         and (a.vigente_hasta is null or a.vigente_hasta > now())
       order by a.vigente_desde desc
       limit 1;

      v_permitido := v_autorizacion is not null;
    end if;
  end if;

  insert into public.eventos_acceso (
    dispositivo_id, vehiculo_id, sentido, canal, estado,
    placa_detectada, ocupacion_detectada, imagen_evidencia,
    autorizacion_id, requiere_revision,
    -- Fail-safe: sólo se abre si el evento es claramente válido y autorizado.
    barrera_accionada, barrera_modo,
    decision, origen_api_key
  ) values (
    v_dispositivo.id, v_vehiculo, p_sentido, 'SENSOR',
    (case when p_placa_detectada is null then 'PENDIENTE_REVISION'
          when v_permitido then 'PERMITIDO'
          else 'DENEGADO' end)::public.estado_evento,
    p_placa_detectada, p_ocupacion_detectada, p_imagen_evidencia,
    v_autorizacion, p_placa_detectada is null,
    v_permitido and p_placa_detectada is not null,
    case when v_permitido then 'ABIERTA' else 'CERRADA' end,
    case when v_permitido then 'ACCESO_AUTORIZADO'
         else 'VEHICULO_NO_AUTORIZADO' end,
    p_origen_api_key
  )
  returning id into v_evento;

  update public.dispositivos
     set ultimo_heartbeat = now(), actualizado_at = now()
   where id = v_dispositivo.id;

  return v_evento;
end;
$$;

-- ---------------------------------------------------------------------------
--  Función de ingesta para el Módulo 7 (motor de visión artificial).
--  Actualiza el estado de una plaza y deja traza en el histórico.
-- ---------------------------------------------------------------------------
create or replace function public.reportar_ocupacion_plaza(
  p_plaza_codigo   text,
  p_estado        public.estado_plaza,
  p_dispositivo_codigo text default null,
  p_confianza     numeric default null,
  p_ocupacion_pct numeric default null,
  p_climate       text default null,
  p_imagen        text default null,
  p_origen        public.origen_deteccion default 'VISION_ARTIFICIAL'
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plaza       public.plazas%rowtype;
  v_dispositivo uuid;
  v_id_hist     bigint;
begin
  select * into v_plaza from public.plazas where codigo = p_plaza_codigo;

  if not found then
    raise exception 'Plaza desconocida: %', p_plaza_codigo using errcode = 'P0002';
  end if;

  select d.id into v_dispositivo
    from public.dispositivos d
   where d.codigo = p_dispositivo_codigo;

  insert into public.estados_ocupacion_historial (
    plaza_id, estado_anterior, estado_nuevo, origen, dispositivo_id,
    confianza, ocupacion_pct, imagen_evidencia, climate
  ) values (
    v_plaza.id, v_plaza.estado, p_estado, p_origen, v_dispositivo,
    p_confianza, p_ocupacion_pct, p_imagen, p_climate
  )
  returning id into v_id_hist;

  -- Actualiza también el estado de la plaza cuando el detector es la IA,
  -- para que el dashboard muestre el último dato sin consultar el histórico.
  update public.plazas
     set estado = p_estado, ultima_deteccion_at = now(), actualizado_at = now()
   where id = v_plaza.id;

  return v_id_hist;
end;
$$;

-- ---------------------------------------------------------------------------
--  Función de ingesta para el Módulo 5 (reconocimiento de placa).
-- ---------------------------------------------------------------------------
create or replace function public.reportar_reconocimiento(
  p_evento_id     uuid,
  p_placa_leida   text,
  p_score         numeric,
  p_estado        public.estado_reconocimiento,
  p_tiempo_ms     int default null,
  p_imagen        text default null,
  p_motor         text default 'alpr',
  p_version_modelo text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_score is null or p_score < 0 or p_score > 1 then
    raise exception 'El score de confianza es obligatorio y debe estar entre 0 y 1'
      using errcode = '22003';
  end if;

  insert into public.reconocimientos_placa (
    evento_id, motor, version_modelo, placa_leida, score_confianza,
    estado, tiempo_inferencia_ms, imagen_recorte
  ) values (
    p_evento_id, p_motor, p_version_modelo,
    upper(trim(p_placa_leida)), p_score, p_estado, p_tiempo_ms, p_imagen
  )
  returning id into v_id;

  -- Se refleja el score en el evento para el módulo de historial.
  update public.eventos_acceso
     set confianza_placa = p_score,
         placa_detectada  = coalesce(placa_detectada, upper(trim(p_placa_leida)))
   where id = p_evento_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
--  Módulo 9: generación de alerta con deduplicación
-- ---------------------------------------------------------------------------
create or replace function public.registrar_alerta(
  p_categoria    public.categoria_alerta,
  p_titulo       text,
  p_mensaje      text,
  p_criticidad   public.criticidad_alerta default 'MEDIA',
  p_huella       text default null,
  p_zona_id      uuid default null,
  p_plaza_id     uuid default null,
  p_dispositivo_id uuid default null,
  p_umbral       numeric default null,
  p_observado    numeric default null,
  p_contexto     jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_huella text := coalesce(
    p_huella,
    -- sha256() recibe bytea: se convierte el texto a UTF-8 explícitamente.
    encode(
      sha256(convert_to(
        concat_ws('|', p_categoria::text, coalesce(p_zona_id::text, ''),
                 coalesce(p_plaza_id::text, ''),
                 coalesce(p_dispositivo_id::text, '')),
        'UTF8')),
      'hex')
  );
  v_id uuid;
begin
  insert into public.alertas (
    categoria, criticidad, zona_id, plaza_id, dispositivo_id,
    titulo, mensaje, contexto, huella, valor_umbral, valor_observado
  ) values (
    p_categoria, p_criticidad, p_zona_id, p_plaza_id, p_dispositivo_id,
    p_titulo, p_mensaje, coalesce(p_contexto, '{}'::jsonb), v_huella,
    p_umbral, p_observado
  )
  returning id into v_id;

  return v_id;

exception
  when unique_violation then
    -- Alerta idéntica ya abierta: se actualiza la observación y no se duplica.
    update public.alertas
       set valor_observado = coalesce(p_observado, valor_observado),
           actualizado_at  = now(),
           mensaje         = p_mensaje
     where huella = v_huella
       and estado in ('ABIERTA', 'EN_ATENCION')
    returning id into v_id;

    return v_id;
end;
$$;

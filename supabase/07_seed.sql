-- ============================================================================
--  SECCIÓN 8 — Datos iniciales (seed) de la EMI UALP
--  Roles, permisos, zonas, plazas, dispositivos y alertas de umbral.
--  Es idempotente: se puede ejecutar más de una vez.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
--  Módulo 2 — Catálogo de roles del sistema
-- ---------------------------------------------------------------------------
insert into public.roles (codigo, nombre, descripcion, sistema) values
  ('SEGURIDAD', 'Personal de Seguridad',
      'Control de acceso vehicular, validación manual de placas y apertura de portones.', true),
  ('OPERACIONES', 'Personal de Operaciones',
      'Monitoreo de plazas, atención de alertas y reportes operativos.', true),
  ('ADMINISTRACION', 'Administración',
      'Gestión de usuarios, roles, zonas, plazas, dispositivos y configuración.', true),
  ('SOPORTE_TECNICO', 'Soporte Técnico',
      'Hardware, respaldos, auditoría técnica y diagnóstico de fallas.', true),
  ('VISUALIZACION', 'Visualización',
      'Acceso de sólo lectura a la disponibilidad de espacios.', true)
on conflict (codigo) do nothing;

-- ---------------------------------------------------------------------------
--  Módulo 2 — Catálogo de permisos granulares por módulo (1..13)
-- ---------------------------------------------------------------------------
insert into public.permisos (codigo, modulo, recurso, accion, descripcion) values
  -- Módulo 1 — Autenticación
  ('auth:login',        1,  'sesiones',    'crear',    'Iniciar sesión'),
  ('auth:logout',       1,  'sesiones',    'eliminar', 'Cerrar sesión'),
  ('auth:sesion_admin', 1,  'sesiones',    'leer',     'Ver y revocar sesiones de terceros'),
  -- Módulo 2 — Usuarios, roles y permisos
  ('usuarios:leer',     2,  'usuarios',        'leer',    'Consultar usuarios'),
  ('usuarios:crear',    2,  'usuarios',        'crear',   'Crear usuarios'),
  ('usuarios:actualizar', 2,'usuarios',        'actualizar','Editar y habilitar usuarios'),
  ('roles:leer',        2,  'roles',           'leer',    'Consultar roles y permisos'),
  ('roles:gestionar',   2,  'roles',           'actualizar','Asignar roles y permisos'),
  -- Módulo 3 — Vehículos y autorizaciones
  ('vehiculos:leer',    3,  'vehiculos',       'leer',    'Consultar el padrón vehicular'),
  ('vehiculos:gestionar', 3,'vehiculos',       'actualizar', 'Alta, baja y edición de vehículos'),
  ('autorizaciones:gestionar', 3,'autorizaciones','actualizar', 'Emitir autorizaciones temporales'),
  -- Módulo 4 — Control de acceso
  ('accesos:leer',      4,  'eventos_acceso',  'leer',    'Consultar eventos de acceso'),
  ('accesos:operar',    4,  'eventos_acceso',  'crear',   'Autorizar excepción manual'),
  ('accesos:validar',   4,  'eventos_acceso',  'actualizar', 'Validar eventos pendientes'),
  -- Módulo 5 — Reconocimiento vehicular
  ('reconocimientos:leer', 5,'reconocimientos_placa','leer','Consultar lecturas de placa'),
  ('reconocimientos:validar', 5,'reconocimientos_placa','actualizar','Validar lecturas de baja confianza'),
  -- Módulo 6 — Zonas, plazas y dispositivos
  ('infraestructura:leer',  6,'plazas',        'leer',    'Consultar zonas, plazas y dispositivos'),
  ('infraestructura:gestionar', 6,'plazas',    'actualizar', 'Administrar zonas, plazas y hardware'),
  -- Módulo 7 — Visión artificial
  ('ocupacion:leer',    7,  'ocupacion',      'leer',    'Consultar estado de ocupación'),
  ('ocupacion:recalibrar', 7,'ocupacion',    'actualizar', 'Recalibrar ROIs de plazas'),
  -- Módulo 8 — Dashboard
  ('dashboard:leer',    8,  'dashboard',      'leer',    'Ver el mapa en tiempo real'),
  -- Módulo 9 — Alertas
  ('alertas:leer',      9,  'alertas',        'leer',    'Consultar alertas'),
  ('alertas:gestionar', 9,  'alertas',        'actualizar', 'Atender, resolver y descartar alertas'),
  -- Módulo 10 — Historial y trazabilidad
  ('historial:leer',    10, 'historial',      'leer',    'Consultar historial vehicular'),
  ('historial:exportar',10, 'historial',      'leer',    'Exportar historial'),
  -- Módulo 11 — Reportes
  ('reportes:leer',     11, 'reportes',       'leer',    'Consultar reportes'),
  ('reportes:generar',  11, 'reportes',       'crear',   'Generar reportes PDF/XLSX'),
  -- Módulo 12 — Auditoría y respaldo
  ('auditoria:leer',    12, 'bitacora',       'leer',    'Consultar la bitácora de auditoría'),
  ('backups:gestionar', 12, 'backups',        'actualizar', 'Ejecutar y restaurar respaldos'),
  -- Módulo 13 — PWA móvil
  ('pwa:leer',          13, 'pwa',            'leer',    'Consultar disponibilidad desde el móvil'),
  ('pwa:operar',        13, 'pwa',            'crear',   'Atender alertas desde el móvil')
on conflict (codigo) do nothing;

-- ---------------------------------------------------------------------------
--  Asignación de permisos por rol (mínimo privilegio)
-- ---------------------------------------------------------------------------
insert into public.roles_permisos (rol_id, permiso_id)
select r.id, p.id
  from public.roles r
 cross join public.permisos p
 where (r.codigo = 'ADMINISTRACION')                    -- acceso operativo completo
    or (r.codigo = 'SOPORTE_TECNICO'
        and (p.modulo in (6, 12)
             or p.codigo in ('dashboard:leer', 'alertas:leer', 'alertas:gestionar',
                             'historial:leer', 'ocupacion:leer', 'ocupacion:recalibrar',
                             'accesos:leer', 'infraestructura:leer', 'roles:leer')))
    or (r.codigo = 'SEGURIDAD'
        and p.codigo in ('auth:login', 'auth:logout',
                         'vehiculos:leer', 'vehiculos:gestionar',
                         'autorizaciones:gestionar',
                         'accesos:leer', 'accesos:operar', 'accesos:validar',
                         'reconocimientos:leer', 'reconocimientos:validar',
                         'dashboard:leer', 'alertas:leer', 'alertas:gestionar',
                         'historial:leer', 'infraestructura:leer', 'pwa:leer', 'pwa:operar'))
    or (r.codigo = 'OPERACIONES'
        and p.codigo in ('auth:login', 'auth:logout',
                         'vehiculos:leer',
                         'accesos:leer', 'accesos:validar',
                         'reconocimientos:leer', 'reconocimientos:validar',
                         'dashboard:leer', 'ocupacion:leer',
                         'alertas:leer', 'alertas:gestionar',
                         'historial:leer', 'historial:exportar',
                         'reportes:leer', 'reportes:generar',
                         'infraestructura:leer', 'pwa:leer', 'pwa:operar'))
    or (r.codigo = 'VISUALIZACION'
        and p.codigo in ('auth:login', 'auth:logout',
                         'dashboard:leer', 'pwa:leer', 'infraestructura:leer'))
on conflict do nothing;

-- ---------------------------------------------------------------------------
--  Módulo 6 — Zonas del campus de la EMI UALP
--  La geometría por defecto es un placeholder en JSON; se reemplaza por el
--  plano definitivo (SVG) cuando se entregue el diseño del parqueo.
-- ---------------------------------------------------------------------------
insert into public.zonas (codigo, nombre, descripcion, capacidad_maxima, umbral_alerta_pct) values
  ('EMB-01', 'Estacionamiento Norte — Pabellón A',
      'Acceso principal por la calle de servicio. Plazas para automóviles y camionetas.', 48, 85),
  ('EMB-02', 'Estacionamiento Sur — Pabellón B',
      'Plazas mixtas, incluye espacios reservados para personas con movilidad reducida.', 32, 85),
  ('EMB-03', 'Área techada de motocicletas — Polideportivo',
      'Cobertura techada para motocicletas y ciclos del personal.', 24, 90),
  ('EMB-04', 'Estacionamiento de carga — Cuartel',
      'Unidades pesadas y vehículos de servicio de la institución.', 12, 80)
on conflict (codigo) do nothing;

-- ---------------------------------------------------------------------------
--  Plazas (Módulo 6) — se generan a partir del layout por defecto.
--  A1..A8 → filas 1..6 ; B1..B8 → filas 1..4 ; M1..M12 → 2 filas ; C1..C6 → 2 filas
-- ---------------------------------------------------------------------------
insert into public.plazas (zona_id, codigo, fila, columna, tipo_vehiculo_permitido, accesible, activo)
select z.id,
       z.codigo || '-' || lpad(f.fila::text, 2, '0') || lpad(c.col::text, 2, '0'),
       f.fila, c.col,
       case
         when z.codigo = 'EMB-03' then 'MOTOCICLISTA'::public.tipo_vehiculo
         when z.codigo = 'EMB-04' then 'CAMION'::public.tipo_vehiculo
         else 'AUTOMOVIL'::public.tipo_vehiculo
       end,
       (f.fila = 1 and c.col <= 2 and z.codigo <> 'EMB-03'),
       true
  from public.zonas z
  cross join lateral (
    select z.codigo as zc,
           case z.codigo
             when 'EMB-01' then 6
             when 'EMB-02' then 4
             when 'EMB-03' then 2
             when 'EMB-04' then 2
           end as filas,
           case z.codigo
             when 'EMB-01' then 8
             when 'EMB-02' then 8
             when 'EMB-03' then 12
             when 'EMB-04' then 6
           end as columnas
  ) lay
  cross join lateral generate_series(1, lay.filas)  as f(fila)
  cross join lateral generate_series(1, lay.columnas) as c(col)
 where z.codigo in ('EMB-01','EMB-02','EMB-03','EMB-04')
on conflict (codigo) do nothing;

-- Recalcula la capacidad declarada de cada zona según las plazas creadas.
update public.zonas z
   set capacidad_maxima = (
     select count(*) from public.plazas p
      where p.zona_id = z.id and p.activo
   )
 where z.codigo in ('EMB-01','EMB-02','EMB-03','EMB-04');

-- ---------------------------------------------------------------------------
--  Módulo 6 — Hardware inicial (cámaras y sensores por punto de control)
-- ---------------------------------------------------------------------------
insert into public.dispositivos (codigo, tipo, nombre, zona_id, ubicacion, intervalo_lectura_s, ventana_antirebote_s, estado) values
  ('CAM-N-01', 'CAMARA',   'Cámara ANPR acceso norte',   (select id from public.zonas where codigo='EMB-01'),
      'Pórtico de entrada, carril 1', 30, 90, 'ACTIVO'),
  ('SEN-N-01', 'SENSOR_PRESENCIA', 'Sensor de presencia norte', (select id from public.zonas where codigo='EMB-01'),
      'Pórtico de entrada, carril 1', 5, 60, 'ACTIVO'),
  ('SEN-N-02', 'SENSOR_PRESENCIA', 'Sensor de presencia sur',   (select id from public.zonas where codigo='EMB-02'),
      'Pórtico de salida, carril 1', 5, 60, 'ACTIVO'),
  ('CAM-P-01', 'CAMARA',   'Cámara de supervisión norte',  (select id from public.zonas where codigo='EMB-01'),
      'Mastil este, cobertura de filas 1-3', 30, 90, 'ACTIVO'),
  ('CAM-P-02', 'CAMARA',   'Cámara de supervisión sur',   (select id from public.zonas where codigo='EMB-02'),
      'Mastil oeste, cobertura de filas 1-2', 30, 90, 'ACTIVO'),
  ('CAM-M-01', 'CAMARA',   'Cámara área techada',         (select id from public.zonas where codigo='EMB-03'),
      'Techo del polideportivo', 30, 90, 'MANTENIMIENTO'),
  ('BAR-N-01', 'BARRIERA', 'Barrera de acceso norte',     (select id from public.zonas where codigo='EMB-01'),
      'Pórtico de entrada', 5, 60, 'ACTIVO'),
  ('NODO-01',  'NODO_EDGE','Nodo edge perimetral',        (select id from public.zonas where codigo='EMB-01'),
      'Caseta de control, gabinete 1', 15, 60, 'ACTIVO')
on conflict (codigo) do nothing;

-- ---------------------------------------------------------------------------
--  Asociación plaza ↔ cámara principal (relación única del Módulo 6)
-- ---------------------------------------------------------------------------
insert into public.plazas_camaras (plaza_id, dispositivo_id, es_principal)
select p.id, d.id, true
  from public.plazas p
  join public.zonas z on z.id = p.zona_id
  join public.dispositivos d
    on d.zona_id = z.id
   and d.tipo = 'CAMARA'
   and d.codigo like 'CAM-P%'
  left join public.plazas_camaras pc
    on pc.plaza_id = p.id and pc.es_principal
 where pc.plaza_id is null
on conflict do nothing;

-- ---------------------------------------------------------------------------
--  Vehículos de prueba del padrón (Módulo 3)
--  Placas Bolivia: 4 caracteres + 4 dígitos (formato normalizado).
-- ---------------------------------------------------------------------------
insert into public.vehiculos (placa, tipo, categoria, marca, modelo, color, propietario_nombre) values
  ('1234ABC', 'AUTOMOVIL',   'DOCENTE',  'Toyota',     'Yaris',    'Blanco',    'Doc. titular de prueba'),
  ('2345BCD', 'CAMIONETA',   'ESTUDIANTE','Suzuki',    'Vitara',   'Gris',      'Estudiante de prueba'),
  ('3456CDE', 'MOTOCICLISTA','PERSONAL', 'Honda',      'CB 190R',  'Negro',     'Personal de prueba'),
  ('4567DEF', 'CAMION',      'PROVEEDOR','Volvo',     'FH 460',   'Azul',      'Proveedor externo'),
  ('5678EFG', 'AUTOMOVIL',   'VISITANTE','Hyundai',   'Tucson',   'Rojo',      'Visitante eventual')
on conflict do nothing;

-- Autorización permanente para el padrón inicial (Módulo 3).
insert into public.autorizaciones (vehiculo_id, tipo, referencia, motivo)
select v.id, 'PERMANENTE', 'PADRON-EMI-2026', 'Vehículo del padrón institucional'
  from public.vehiculos v
 where v.categoria <> 'VISITANTE'
   and not exists (
     select 1 from public.autorizaciones a
      where a.vehiculo_id = v.id and a.tipo = 'PERMANENTE'
   );

-- ---------------------------------------------------------------------------
--  Módulo 7 — Estado inicial de las plazas
-- ---------------------------------------------------------------------------
insert into public.estados_ocupacion_historial (plaza_id, estado_nuevo, origen, ocupacion_pct, climate)
select p.id, 'SIN_DATOS', 'ESTADO_INICIAL', 0, 'soleado'
  from public.plazas p
 where not exists (
   select 1 from public.estados_ocupacion_historial h where h.plaza_id = p.id
 );

commit;

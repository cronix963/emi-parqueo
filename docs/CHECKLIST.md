# Checklist de implementación — Sistema de Parqueo Inteligente EMI UALP

Trazabilidad módulo → base de datos → aplicación. Marca el estado real de cada pieza:

- `[x]` implementado y verificado automáticamente por `npm run db:validate`
- `[~]` implementado en la base de datos, pendiente de exponer en la interfaz
- `[ ]` pendiente

Estado actual de la validación: **106 verificaciones en verde** sobre PostgreSQL real
en memoria (PGlite), incluida la aplicación completa de `supabase/01_schema.sql` … `07_seed.sql`.

---

## Cómo se aplica y se verifica

| Acción | Comando |
| --- | --- |
| Validar el modelo en memoria (sin credenciales) | `npm run db:validate` |
| Aplicar el modelo a un proyecto Supabase real | `npm run db:push` (requiere `DATABASE_URL`) |
| Verificación completa (tipos, lint, base, build) | `npm run verify` |

En Supabase, los scripts se aplican en orden en el SQL Editor:
`01_schema.sql` → `02_schema.sql` → `03_schema.sql` → `04_schema.sql` → `05_rls.sql` → `06_views.sql` → `07_seed.sql`.

---

## Módulo 1 — Autenticación y gestión de usuarios

| Pieza | Estado | Detalle |
| --- | --- | --- |
| `usuarios` | `[x]` | documento único, correo `citext`, rol, intentos fallidos, ventana de bloqueo, `activo` |
| `sesiones` | `[x]` | `token_hash` único, expiración, IP y agente de origen |
| `intentos_autenticacion` | `[x]` | enum `resultado_autenticacion`; registra IP, correo y resultado |
| `politica_bloqueo_usuario()` | `[x]` | trigger `trg_intentos_bloqueo`: 5° fallo consecutivo → `USUARIO_BLOQUEADO` |
| Comportamiento sin revelar información | `[x]` | un correo inexistente no bloquea ni crea cuentas fantasma |
| Login Google OAuth + Turnstile | `[~]` | `src/app/login/page.tsx`, `src/app/auth/callback/route.ts`, `proxy.ts` |
| Gestión de usuarios (CRUD) | `[ ]` | la tabla existe; falta la pantalla de administración |

## Módulo 2 — Roles y permisos

| Pieza | Estado | Detalle |
| --- | --- | --- |
| `roles` | `[x]` | 5 roles: ADMINISTRACION, SEGURIDAD, OPERACIONES, SOPORTE, CONSULTA |
| `permisos` | `[x]` | 31 permisos en formato `modulo:recurso:accion` |
| `roles_permisos` | `[x]` | 83 asignaciones en el seed |
| `usuarios_roles_historico` | `[x]` | trazabilidad de cambios de rol con RLS propia |
| `rol_actual()`, `id_usuario_actual()` | `[x]` | contexto de sesión `SECURITY DEFINER`, sin recursión de RLS |
| `es_admin_o_soporte()` | `[x]` | gate de lectura de la bitácora de auditoría |
| `usuario_tiene_permiso()` | `[x]` | consulta de permisos por rol |
| Asignación de roles en la interfaz | `[ ]` | pendiente |

## Módulo 3 — Padrón vehicular y autorizaciones

| Pieza | Estado | Detalle |
| --- | --- | --- |
| `vehiculos` | `[x]` | placa única entre activos, categoría, propietario, `activo` |
| Índice parcial de placa activa | `[x]` | `unique (upper(placa)) where activo` — una placa, un registro vigente |
| `autorizaciones` | `[x]` | permanente/temporal/visitante, vigencia,Permiso de acceso |
| Constraint de temporal con expiración | `[x]` | `autorizaciones_temporal_con_vigencia` |
| Búsqueda por placa | `[~]` | índice listo; falta la pantalla de padrón y búsqueda |

## Módulo 4 — Control de acceso e ingresos (IoT)

| Pieza | Estado | Detalle |
| --- | --- | --- |
| `eventos_acceso` | `[x]` | sentido, estado, `barrera_modo`, placa, dispositivo, imagen por ruta |
| `registrar_evento_sensor()` | `[x]` | ingesta desde el nodo edge; fail-safe: la barrera nunca queda abierta por falla |
| Fail-safe verificado | `[x]` | autorizado → `ABIERTA`; no autorizado, ilegible o score bajo → `CERRADA` |
| `validar_antirebote()` + `trg_eventos_antirebote` | `[x]` | 3 lecturas del mismo vehículo → 1 evento efectivo, 2 `ANULADO` |
| Dispositivo desconocido | `[x]` | la ingesta se aborta con excepción controlada |
| Integración con hardware físico | `[ ]` | contrato HTTP/PubSub del nodo edge pendiente |

## Módulo 5 — Reconocimiento de placa (ALPR/ANPR)

| Pieza | Estado | Detalle |
| --- | --- | --- |
| `reconocimientos_placa` | `[x]` | score obligatorio (RNF), estado, ROI, modelo, versión |
| `reportar_reconocimiento()` | `[x]` | normaliza la placa a mayúsculas y refleja el score en el evento |
| Score obligatorio y en rango | `[x]` | `NOT NULL` + `CHECK (0..1)` |
| Cola de validación manual | `[x]` | `requiere_validacion_manual` para score bajo o ilegible |
| Sin biometría | `[x]` | ninguna columna de rostro/huella digital; la evidencia es una ruta |

## Módulo 6 — Zonas, plazas y dispositivos

| Pieza | Estado | Detalle |
| --- | --- | --- |
| `zonas` | `[x]` | 4 zonas del campus, capacidad y umbral de alerta por zona |
| `plazas` | `[x]` | 116 plazas; `fila`/`columna`, tipo permitido, accesible, activa |
| Capacidad declarada coherente | `[x]` | el seed recalcula `capacidad_maxima` = número de plazas (48/32/24/12) |
| Exclusión de plazas superpuestas | `[x]` | `EXCLUDE USING gist` sobre `fila`/`columna` |
| `dispositivos` | `[x]` | 8 dispositivos: cámaras ANPR, cámaras de supervisión, sensores, barrera, nodo edge |
| `plazas_camaras` | `[x]` | una cámara principal por plaza |
| `vw_salud_dispositivos` | `[x]` | estado, último heartbeat y alertas abiertas por dispositivo |
| Editor de zonas/plazas/dispositivos | `[ ]` | pendiente |
| Plano SVG definitivo | `[ ]` | `plano_layout` es un placeholder; depende del diseño |

## Módulo 7 — Detección de ocupación por visión artificial

| Pieza | Estado | Detalle |
| --- | --- | --- |
| `reportar_ocupacion_plaza()` | `[x]` | actualiza la plaza y deja traza; rechaza plazas desconocidas |
| `estados_ocupacion_historial` | `[x]` | traza por plaza con confianza, ROI, clima y origen |
| `registrar_cambio_ocupacion()` + `trg_ocupacion_sync` | `[x]` | toda transición queda registrada automáticamente |
| `vw_ocupacion_zona` | `[x]` | total/libres/ocupadas/mantenimiento/sin datos y % de ocupación |
| `SIN_DATOS` como estado inicial | `[x]` | una plaza registrada aún no evaluada no se cuenta como libre |
| Integración con el motor de visión | `[ ]` | contrato de ingesta del modelo pendiente |

## Módulo 8 — Panel de control y monitoreo

| Pieza | Estado | Detalle |
| --- | --- | --- |
| `espacios` (vista de compatibilidad) | `[x]` | contrato exacto del frontend: 13 columnas en snake_case |
| `registros` (vista de compatibilidad) | `[x]` | ingresos con tipo de vehículo y hora de salida resuelta |
| Traducción de enums | `[x]` | `MOTOCICLISTA` → `motocicleta`, estados en minúsculas |
| `/dashboard` | `[~]` | KPIs, mapa de 116 plazas, filtros, detalle y tabla de ingresos |
| Actualización en tiempo real | `[ ]` | falta suscripción Realtime a `plazas` y `eventos_acceso` |
| Mapa por zona con SVG | `[ ]` | hoy se usa el layout de filas × columnas |

## Módulo 9 — Alertas y notificaciones

| Pieza | Estado | Detalle |
| --- | --- | --- |
| `alertas` | `[x]` | tipo, severidad, huella, entidad afectada, valor observado y umbral |
| `registrar_alerta()` | `[x]` | deduplica por huella: si está abierta, actualiza valor y severidad |
| `alertas_acciones` | `[x]` | bitácora de la atención con estado anterior/nuevo y responsable |
| Flujo de estados | `[x]` | `ABIERTA → EN_ATENCION → RESUELTA` |
| Umbral por zona | `[~]` | `umbral_alerta_pct` en `zonas`; el disparador automático queda pendiente |
| Push/email al personal | `[ ]` | pendiente |

## Módulo 10 — Historial y trazabilidad

| Pieza | Estado | Detalle |
| --- | --- | --- |
| `eventos_acceso` | `[x]` | historial completo de ingresos y salidas |
| `vw_tiempo_permanencia` | `[x]` | duración por vehículo y rango de salida |
| `vw_indicador_trazabilidad` | `[x]` | objetivo ≥95% de trazabilidad |
| `vw_indicador_precision_placa` | `[x]` | objetivo ≥90% de precisión de lectura |
| `vw_flujo_por_hora` | `[x]` | flujo por hora para el análisis de horas pico |
| Consulta histórica en la interfaz | `[ ]` | pendiente |

## Módulo 11 — Reportes y estadísticas

| Pieza | Estado | Detalle |
| --- | --- | --- |
| `reportes` | `[x]` | tipo, parámetros,_filters, estado, archivo generado, solicitante |
| KPIs de gestión | `[x]` | ocupación, trazabilidad, precisión y permanencia como vistas |
| Generación/exportación | `[ ]` | falta la vista de reportes y el job de exportación |
| Reducción de tiempo de control ≥30% | `[ ]` | requiere medición con el dato de `vw_flujo_por_hora` |

## Módulo 12 — Auditoría, respaldo y recuperación

| Pieza | Estado | Detalle |
| --- | --- | --- |
| `bitacora_auditoria` | `[x]` | entidad, acción, antes/después, actor, IP y agente |
| `registrar_auditoria()` | `[x]` | captura la IP y el agente reales de la petición |
| Inmutabilidad | `[x]` | `trg_auditoria_inmutable` bloquea `UPDATE` y `DELETE` |
| Acceso restringido | `[x]` | lectura solo para ADMINISTRACION y SOPORTE |
| `backups` / `restauraciones` | `[x]` | hash SHA-256, resultado y motivo de cada restauración |
| `dispositivos_fallas` | `[x]` | historial de fallas de hardware con tiempo fuera de servicio |
| Politica de respaldos programados | `[ ]` | `pg_cron` y retención pendientes |

## Módulo 13 — PWA y operación en campo

| Pieza | Estado | Detalle |
| --- | --- | --- |
| `dispositivos_usuario` | `[x]` | tokens de push por usuario, únicos y desactivables |
| Manifiesto y modo offline | `[ ]` | pendiente |
| Turnos/bloqueo de caseta | `[ ]` | pendiente |

---

## Seguridad transversal

| Pieza | Estado | Detalle |
| --- | --- | --- |
| RLS activa | `[x]` | 24/24 tablas de negocio |
| Políticas RLS | `[x]` | 39 políticas sobre lectura, escritura y borrado |
| Vistas con `security_invoker` | `[x]` | `espacios` y `registros` heredan las políticas de las tablas base |
| Contraseñas | `[x]` | las maneja Supabase Auth; el modelo solo guarda `contrasena_hash` para migración |
| API keys de hardware | `[x]` | columna de texto; en producción debe almacenarse solo el hash |
| Sin reconocimiento facial | `[x]` | verificado por consulta sobre el catálogo de columnas |
| Evidencia vehicular | `[x]` | rutas (`img://…`), nunca `bytea` |

## Inventario

- 24 tablas · 8 vistas · 13 funciones de negocio · 4 triggers + 1 función de bloqueo · 39 políticas RLS
- Seed: 5 roles · 31 permisos · 83 asignaciones · 4 zonas · 116 plazas · 8 dispositivos · 5 vehículos

## Fuera de alcance (por decisión del proyecto)

Cobro de tarifas, reservas previas, multas automáticas, conducción autónoma y control de
vehículos fuera del perímetro institucional. El sistema **no** realiza reconocimiento facial
ni ningún tratamiento biométrico.
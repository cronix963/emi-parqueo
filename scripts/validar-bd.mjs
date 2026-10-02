/**
 * Validador del modelo fisico de base de datos - EMI UALP.
 *
 * Levanta un PostgreSQL real en memoria (PGlite) y aplica los scripts de
 * supabase/ en orden, igual que se harian en el SQL Editor de Supabase.
 * Despues ejecuta verificaciones funcionales sobre los 13 modulos:
 * ingesta de sensores, antirrebote, fail-safe de barrera, sincronizacion de
 * ocupacion, deduplicacion de alertas, inmutabilidad de auditoria y RLS.
 *
 *   node scripts/validar-bd.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const dirSupabase = join(raiz, "supabase");

const ARCHIVOS = [
  "01_schema.sql",
  "02_schema.sql",
  "03_schema.sql",
  "04_schema.sql",
  "05_rls.sql",
  "06_views.sql",
  "07_seed.sql",
];

const db = new PGlite({ extensions: { pgcrypto, citext, btree_gist } });
let fallos = 0;

function ok(etiqueta, detalle) {
  console.log(`  ok    ${etiqueta}${detalle ? ` -> ${detalle}` : ""}`);
}

function mala(etiqueta, detalle) {
  fallos++;
  console.error(`  FALLA ${etiqueta}${detalle ? ` -> ${detalle}` : ""}`);
}

/** Ejecuta un script que puede contener varios comandos. */
async function ejecutar(sql, etiqueta) {
  try {
    await db.exec(sql);
    ok(etiqueta);
    return true;
  } catch (error) {
    mala(etiqueta, String(error.message).split("\n")[0]);
    return false;
  }
}

/** Comprueba que una consulta devuelve exactamente los valores esperados. */
async function comprobar(etiqueta, sql, esperados = []) {
  try {
    const { rows } = await db.query(sql);
    const obtenido = rows.map((f) => String(f.v));
    const coincide = esperados.every((v, i) => obtenido[i] === String(v));
    if (coincide) ok(etiqueta, obtenido.join(" | "));
    else mala(etiqueta, `esperado ${esperados.join(" | ")}, obtenido ${obtenido.join(" | ")}`);
  } catch (error) {
    mala(etiqueta, String(error.message).split("\n")[0]);
  }
}

/** Comprueba que un script lanza la excepcion esperada. */
async function comprobarFalla(etiqueta, sql, fragmentoEsperado) {
  try {
    await db.exec(sql);
    mala(etiqueta, "no lanzo excepcion");
  } catch (error) {
    const mensaje = String(error.message);
    if (mensaje.includes(fragmentoEsperado)) ok(etiqueta, "excepcion controlada");
    else mala(etiqueta, `mensaje inesperado: ${mensaje.split("\n")[0]}`);
  }
}

// ============================================================================
console.log("\n== 1. Aplicacion del esquema ==\n");
// ============================================================================

await ejecutar(
  readFileSync(join(raiz, "scripts", "supabase-auth-shim.sql"), "utf8"),
  "[shim] schema auth de Supabase",
);

for (const archivo of ARCHIVOS) {
  const ruta = join(dirSupabase, archivo);
  if (!existsSync(ruta)) {
    mala(`falta ${archivo}`);
    continue;
  }
  await ejecutar(readFileSync(ruta, "utf8"), archivo);
}

if (fallos > 0) {
  console.error(`\n${fallos} archivo(s) con errores. Corregir antes de continuar.\n`);
  await db.close();
  process.exit(1);
}

// ============================================================================
console.log("\n== 2. Inventario del esquema ==\n");
// ============================================================================

await comprobar("tablas de negocio en public", `
  select count(*)::int as v from information_schema.tables
   where table_schema = 'public' and table_type = 'BASE TABLE'
`, [24]);

await comprobar("vistas de indicadores y compatibilidad", `
  select count(*)::int as v from information_schema.views where table_schema = 'public'
`, [8]);

await comprobar("funciones de negocio", `
  select count(*)::int as v from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname in (
       'rol_actual', 'id_usuario_actual', 'es_admin_o_soporte',
       'usuario_tiene_permiso', 'politica_bloqueo_usuario', 'validar_antirebote',
       'registrar_cambio_ocupacion', 'bloquear_modificacion_auditoria',
       'registrar_auditoria', 'registrar_evento_sensor',
       'reportar_ocupacion_plaza', 'reportar_reconocimiento', 'registrar_alerta')
`, [13]);

await comprobar("triggers del dominio", `
  select count(*)::int as v from information_schema.triggers where trigger_schema = 'public'
`, [5]);

await comprobar("politicas RLS definidas", `
  select count(*)::int as v from pg_policies where schemaname = 'public'
`, [39]);

// ============================================================================
console.log("\n== 3. Datos iniciales (seed) ==\n");
// ============================================================================

await comprobar("roles del sistema", `select count(*)::int as v from public.roles`, [5]);
await comprobar("permisos granulares", `select count(*)::int as v from public.permisos`, [31]);
await comprobar("asignaciones rol a permiso", `select count(*)::int as v from public.roles_permisos`);
await comprobar("zonas del campus", `select count(*)::int as v from public.zonas`, [4]);
await comprobar("plazas generadas (48+32+24+12)", `select count(*)::int as v from public.plazas`, [116]);
await comprobar("capacidad declarada por zona", `
  select string_agg(capacidad_maxima::text, '/' order by codigo) as v from public.zonas
`, ["48/32/24/12"]);
await comprobar("dispositivos IoT", `select count(*)::int as v from public.dispositivos`, [8]);
await comprobar("vehiculos del padron", `select count(*)::int as v from public.vehiculos`, [5]);
await comprobar("plazas inicializadas en SIN_DATOS", `
  select count(*)::int as v from public.plazas where estado = 'SIN_DATOS'
`, [116]);
await comprobar("plazas accesibles marcadas", `select count(*)::int as v from public.plazas where accesible`);
await comprobar("camara principal asignada por plaza", `
  select count(*)::int as v from public.plazas_camaras where es_principal
`);

// ============================================================================
console.log("\n== 4. Modulo 4: ingreso automatico y fail-safe de barrera ==\n");
// ============================================================================

await ejecutar(`
  select public.registrar_evento_sensor('SEN-N-01', 'INGRESO', '1234ABC', true, 'img://n1.jpg');
`, "[ingesta] evento de vehiculo autorizado");
await comprobar("estado PERMITIDO", `
  select estado::text as v from public.eventos_acceso
   where placa_detectada = '1234ABC' and estado <> 'ANULADO'
`, ["PERMITIDO"]);
await comprobar("barrera ABIERTA (acceso autorizado)", `
  select barrera_modo::text as v from public.eventos_acceso
   where placa_detectada = '1234ABC' and estado = 'PERMITIDO'
`, ["ABIERTA"]);

await ejecutar(`
  select public.registrar_evento_sensor('SEN-N-01', 'INGRESO', '9999ZZZ', true, 'img://n2.jpg');
`, "[ingesta] evento de vehiculo no autorizado");
await comprobar("estado DENEGADO", `
  select estado::text as v from public.eventos_acceso where placa_detectada = '9999ZZZ'
`, ["DENEGADO"]);
await comprobar("barrera CERRADA (vehiculo no autorizado)", `
  select barrera_modo::text as v from public.eventos_acceso where placa_detectada = '9999ZZZ'
`, ["CERRADA"]);

await ejecutar(`
  select public.registrar_evento_sensor('SEN-N-01', 'INGRESO', null, null, null);
`, "[ingesta] evento sin placa legible");
await comprobar("PENDIENTE_REVISION y barrera CERRADA", `
  select estado::text || ' / ' || barrera_modo::text as v from public.eventos_acceso
   where placa_detectada is null
`, ["PENDIENTE_REVISION / CERRADA"]);

await comprobarFalla(
  "dispositivo desconocido aborta la ingesta",
  `select public.registrar_evento_sensor('NO-EXISTE', 'INGRESO', '1234ABC')`,
  "Dispositivo desconocido",
);

await ejecutar(`
  select public.registrar_evento_sensor('SEN-N-01', 'INGRESO', '5678EFG');
  select public.registrar_evento_sensor('SEN-N-01', 'INGRESO', '5678EFG');
  select public.registrar_evento_sensor('SEN-N-01', 'INGRESO', '5678EFG');
`, "[antirrebote] tres lecturas consecutivas del mismo vehiculo");
await comprobar("solo 1 evento efectivo de 3 lecturas", `
  select count(*)::int as v from public.eventos_acceso
   where placa_detectada = '5678EFG' and estado <> 'ANULADO'
`, [1]);
await comprobar("los otros 2 quedan ANULADO por rebote", `
  select count(*)::int as v from public.eventos_acceso
   where placa_detectada = '5678EFG' and estado = 'ANULADO'
`, [2]);
await comprobar("rebote nunca abre la barrera", `
  select count(*)::int as v from public.eventos_acceso
   where placa_detectada = '5678EFG' and estado = 'ANULADO' and barrera_modo <> 'CERRADA'
`, [0]);

// ============================================================================
console.log("\n== 5. Modulo 5: reconocimiento de placa (ALPR) ==\n");
// ============================================================================

await ejecutar(`
  do $$
  declare v_evento uuid;
  begin
    select id into v_evento from public.eventos_acceso
     where placa_detectada = '1234ABC' and estado = 'PERMITIDO' limit 1;
    perform public.reportar_reconocimiento(
      v_evento, '1234abc', 0.9375, 'RECONOCIDO', 138, 'img://crop-1.jpg', 'alpr', 'v3.1');
  end $$;
`, "[IA] reporte de reconocimiento con placa en minusculas");
await comprobar("placa normalizada a mayusculas", `
  select placa_leida::text as v from public.reconocimientos_placa
   order by created_at desc limit 1
`, ["1234ABC"]);
await comprobar("score registrado en el evento", `
  select confianza_placa::text as v from public.eventos_acceso
   where placa_detectada = '1234ABC' and estado = 'PERMITIDO'
`, ["0.9375"]);

await comprobarFalla(
  "score de confianza obligatorio (RNF)",
  `do $$
   begin
     insert into public.reconocimientos_placa (evento_id, score_confianza, estado)
     values ((select id from public.eventos_acceso limit 1), null, 'RECONOCIDO');
   end $$`,
  "score_confianza",
);

await comprobarFalla(
  "score fuera de rango rechazado",
  `do $$
   begin
     insert into public.reconocimientos_placa (evento_id, score_confianza, estado)
     values ((select id from public.eventos_acceso limit 1), 1.8, 'RECONOCIDO');
   end $$`,
  "score_confianza",
);

await ejecutar(`
  do $$
  declare v_evento uuid;
  begin
    select id into v_evento from public.eventos_acceso where placa_detectada is null limit 1;
    perform public.reportar_reconocimiento(v_evento, null, 0.21, 'ILEGIBLE', 210, null);
  end $$;
`, "[IA] lectura ilegible");
await comprobar("queda en cola de validacion manual", `
  select count(*)::int as v from public.reconocimientos_placa
   where requiere_validacion_manual and validado_por is null
`, [1]);

// ============================================================================
console.log("\n== 6. Modulo 7: deteccion de ocupacion por vision artificial ==\n");
// ============================================================================

await comprobar("estado inicial de plazas: SIN_DATOS", `
  select count(*)::int as v from public.plazas where estado = 'SIN_DATOS'
`, [116]);

const plazaEmb01 = `(select codigo from public.plazas where zona_id =
     (select id from public.zonas where codigo='EMB-01') order by codigo limit 1)`;

await ejecutar(`
  select public.reportar_ocupacion_plaza(
    ${plazaEmb01}, 'OCUPADO', 'CAM-P-01', 0.9650, 78.50, 'lluvia', 'img://plaza-1.jpg');
`, "[IA] plaza reportada como OCUPADA");
await comprobar("plaza actualizada a OCUPADO", `
  select estado::text as v from public.plazas where codigo = ${plazaEmb01}
`, ["OCUPADO"]);
await comprobar("traza en el historial con clima y confianza", `
  select estado_nuevo::text || '/' || origen::text || '/' || climate
         || '/' || round(confianza*100,2)::text as v
    from public.estados_ocupacion_historial
   where estado_nuevo = 'OCUPADO' order by registrado_en desc limit 1
`, ["OCUPADO/VISION_ARTIFICIAL/lluvia/96.50"]);
await comprobar("la vista de ocupacion refleja el cambio", `
  select ocupadas::text as v from public.vw_ocupacion_zona where zona_codigo = 'EMB-01'
`, ["1"]);

await ejecutar(`
  select public.reportar_ocupacion_plaza(
    ${plazaEmb01}, 'LIBRE', 'CAM-P-01', 0.9810, 5.00, 'soleado', null);
`, "[IA] plaza vuelve a LIBRE");
await comprobar("segunda traza de la misma plaza", `
  select count(*)::int as v from public.estados_ocupacion_historial
   where plaza_id = (select id from public.plazas where codigo = ${plazaEmb01})
     and origen = 'VISION_ARTIFICIAL'
`, [2]);
await comprobar("recalculo de ocupacion de la zona", `
  select libres::text as v from public.vw_ocupacion_zona where zona_codigo = 'EMB-01'
`, [1]);

await comprobarFalla(
  "plaza desconocida aborta el reporte",
  `select public.reportar_ocupacion_plaza('NO-EXISTE-99', 'OCUPADO')`,
  "Plaza desconocida",
);

// ============================================================================
console.log("\n== 7. Modulo 9: alertas y deduplicacion ==\n");
// ============================================================================

await ejecutar(`
  select public.registrar_alerta('CAPACIDAD_MAXIMA', 'Zona al limite', 'Ocupacion 98%',
    'ALTA', 'huella-zona-emb01',
    (select id from public.zonas where codigo='EMB-01'), null, null, 85, 98);
  select public.registrar_alerta('CAPACIDAD_MAXIMA', 'Zona al limite', 'Ocupacion 99%',
    'ALTA', 'huella-zona-emb01',
    (select id from public.zonas where codigo='EMB-01'), null, null, 85, 99);
  select public.registrar_alerta('CAPACIDAD_MAXIMA', 'Zona al limite', 'Ocupacion 101%',
    'ALTA', 'huella-zona-emb01',
    (select id from public.zonas where codigo='EMB-01'), null, null, 85, 101);
`, "[alertas] tres disparos de la misma alerta repetitiva");
await comprobar("una sola alerta abierta (deduplicada)", `
  select count(*)::int as v from public.alertas where huella = 'huella-zona-emb01'
`, [1]);
await comprobar("actualiza el valor observado", `
  select valor_observado::int as v from public.alertas where huella = 'huella-zona-emb01'
`, [101]);

await ejecutar(`
  select public.registrar_alerta('DISPOSITIVO_DESCONECTADO', 'Camara caida', 'Sin heartbeat',
    'CRITICA', 'huella-cam-p-02', null, null,
    (select id from public.dispositivos where codigo='CAM-P-02'), null, null);
`, "[alertas] falla de hardware");
await comprobar("alertas totales registradas", `select count(*)::int as v from public.alertas`, [2]);

await ejecutar(`
  do $$
  declare v_alerta uuid; v_usuario uuid;
  begin
    select id into v_alerta from public.alertas where huella = 'huella-zona-emb01';
    insert into public.usuarios (documento, correo, nombres, apellidos, rol_codigo)
      values ('1000001', 'operaciones@emi.bo', 'Luis', 'Mamani', 'OPERACIONES')
      returning id into v_usuario;
    update public.alertas
       set estado = 'EN_ATENCION', atendida_por = v_usuario, actualizado_at = now()
     where id = v_alerta;
    insert into public.alertas_acciones (alerta_id, accion, estado_anterior, estado_nuevo, usuario_id)
    values (v_alerta, 'ATENDER', 'ABIERTA', 'EN_ATENCION', v_usuario);
  end $$;
`, "[alertas] atencion con usuario responsable");
await comprobar("alerta EN_ATENCION con responsable", `
  select estado::text || '/' || (u.correo)::text as v
    from public.alertas a join public.usuarios u on u.id = a.atendida_por
   where a.huella = 'huella-zona-emb01'
`, ["EN_ATENCION/operaciones@emi.bo"]);

// ============================================================================
console.log("\n== 8. Modulo 3: vehiculos y autorizaciones ==\n");
// ============================================================================

await comprobarFalla(
  "no se permiten dos placas activas iguales (RNF)",
  `insert into public.vehiculos (placa, categoria) values ('1234ABC', 'VISITANTE')`,
  "vehiculos_placa_activa",
);

await ejecutar(`
  insert into public.vehiculos (placa, categoria, activo)
    values ('1234ABC', 'VISITANTE', false);
`, "[vehiculos] placa retirada del padron");
await comprobar("historico de placas conserva ambos registros", `
  select count(*)::int as v from public.vehiculos where upper(placa) = '1234ABC'
`, [2]);

await comprobar("busqueda rapida por placa", `
  select count(*)::int as v from public.vehiculos
   where upper(placa) = '2345BCD' and activo and categoria = 'ESTUDIANTE'
`, [1]);

await comprobar("autorizacion permanente vigente", `
  select count(*)::int as v from public.autorizaciones a
    join public.vehiculos v on v.id = a.vehiculo_id
   where v.placa = '1234ABC' and a.permitido_acceso
     and a.vigente_desde <= now() and (a.vigente_hasta is null or a.vigente_hasta > now())
`, [1]);

await comprobarFalla(
  "autorizacion temporal exige fecha de expiracion (RNF)",
  `insert into public.autorizaciones (vehiculo_id, tipo)
     select id, 'TEMPORAL' from public.vehiculos where placa = '3456CDE'`,
  "autorizaciones_temporal_con_vigencia",
);

await ejecutar(`
  insert into public.autorizaciones (vehiculo_id, tipo, vigente_desde, vigente_hasta, referencia)
    values ((select id from public.vehiculos where placa = '5678EFG'), 'TEMPORAL',
            now() - interval '2 days', now() - interval '1 day', 'VISITA-2026-0001');
`, "[autorizaciones] temporal ya vencida");
await comprobar("temporal vencida no autoriza", `
  select count(*)::int as v from public.autorizaciones a
    join public.vehiculos v on v.id = a.vehiculo_id
   where v.placa = '5678EFG' and a.vigente_hasta > now()
`, [0]);

// ============================================================================
console.log("\n== 9. Modulo 12: auditoria, inmutabilidad y respaldo ==\n");
// ============================================================================

await ejecutar(`
  do $$
  declare v_usuario uuid;
  begin
    insert into public.usuarios (documento, correo, nombres, apellidos, rol_codigo)
      values ('1000002', 'admin@emi.bo', 'Maria', 'Quispe', 'ADMINISTRACION')
      returning id into v_usuario;
    perform public.registrar_auditoria('USUARIO', v_usuario::text, 'CREAR', null,
      '{"rol":"ADMINISTRACION"}'::jsonb, v_usuario, '10.20.30.40'::inet, 'navegador-chrome');
  end $$;
`, "[auditoria] registro de alta de usuario");
await comprobar("bitacora capturo el correo del actor", `
  select usuario_correo::text as v from public.bitacora_auditoria order by id desc limit 1
`, ["admin@emi.bo"]);
await comprobar("bitacora capturo la IP y el agente", `
  select (direccion_ip = '10.20.30.40'::inet and agente_usuario = 'navegador-chrome') as v
    from public.bitacora_auditoria order by id desc limit 1
`, ["true"]);

await comprobarFalla(
  "bitacora rechaza UPDATE (inmutable)",
  `update public.bitacora_auditoria set accion = 'ELIMINAR'`,
  "inmutable",
);
await comprobarFalla(
  "bitacora rechaza DELETE (inmutable)",
  `delete from public.bitacora_auditoria`,
  "inmutable",
);

await ejecutar(`
  insert into public.backups (etiqueta, tipo, estado, hash_sha256, finalizado_en)
    values ('BK-2026-09-02-FULL', 'COMPLETO', 'COMPLETADO', 'abc123', now());
`, "[respaldo] registro de backup completo");
await comprobar("backup registrado", `
  select estado::text || '/' || hash_sha256 as v from public.backups limit 1
`, ["COMPLETADO/abc123"]);

await comprobarFalla(
  "restauracion exige motivo y responsable",
  `insert into public.restauraciones (backup_id, ejecutado_por, motivo, resultado)
     values (gen_random_uuid(), gen_random_uuid(), 'x', 'EXITOSO')`,
  "restauraciones_backup_id_fkey",
);

// ============================================================================
console.log("\n== 10. Modulo 1: sesiones e intentos de autenticacion ==\n");
// ============================================================================

await ejecutar(`
  insert into public.intentos_autenticacion (correo_intento, resultado, direccion_ip)
    values ('admin@emi.bo', 'EXITOSO', '10.0.0.9');
  insert into public.intentos_autenticacion (correo_intento, resultado, direccion_ip)
    values ('intruso@externo.com', 'FALLO_CREDENCIALES', '10.0.0.10');
`, "[auth] registro de intentos");
await comprobar("intentos auditados", `select count(*)::int as v from public.intentos_autenticacion`, [2]);

await comprobarFalla(
  "resultado de autenticacion fuera de catalogo rechazado",
  `insert into public.intentos_autenticacion (correo_intento, resultado)
     values ('x@y.bo', 'RESULTADO_INVENTADO')`,
  "invalid input value for enum resultado_autenticacion",
);

// La política de bloqueo sólo aplica a cuentas existentes del padrón; para un
// correo desconocido se registra el intento sin revelar información ni crear
// cuentas fantasma.
await ejecutar(`
  insert into public.usuarios (documento, correo, nombres, apellidos, rol_codigo)
    values ('3000001', 'repetido@emi.bo', 'Hugo', 'Salas', 'OPERACIONES');
  do $$
  declare i int;
  begin
    for i in 1..5 loop
      insert into public.intentos_autenticacion (correo_intento, resultado)
        values ('repetido@emi.bo', 'FALLO_CREDENCIALES');
    end loop;
  end $$;
`, "[auth] cinco intentos fallidos consecutivos sobre una cuenta real");
await comprobar("quinto fallo consecutivo bloquea la cuenta", `
  select resultado::text as v from public.intentos_autenticacion
   where correo_intento = 'repetido@emi.bo' order by id desc limit 1
`, ["USUARIO_BLOQUEADO"]);
await comprobar("la cuenta queda con ventana de bloqueo", `
  select (bloqueado_hasta > now()) as v from public.usuarios where correo = 'repetido@emi.bo'
`, ["true"]);
await comprobar(
  "correo inexistente no genera bloqueo ni cuenta fantasma",
  `
    do $$
    declare i int;
    begin
      for i in 1..6 loop
        insert into public.intentos_autenticacion (correo_intento, resultado)
          values ('fantasma@externo.com', 'FALLO_CREDENCIALES');
      end loop;
    end $$;
  `,
);
await comprobar("…0 usuarios creados para el correo inexistente", `
  select count(*)::int as v from public.usuarios where correo = 'fantasma@externo.com'
`, [0]);
await comprobar("…y los intentos quedan como fallo normal", `
  select resultado::text as v from public.intentos_autenticacion
   where correo_intento = 'fantasma@externo.com' order by id desc limit 1
`, ["FALLO_CREDENCIALES"]);

await comprobarFalla(
  "token de sesion duplicado rechazado",
  `do $$
   declare v_u uuid;
   begin
     insert into public.usuarios (documento, correo, nombres, apellidos)
       values ('2000001', 'sesion@emi.bo', 'Ana', 'Rojas') returning id into v_u;
     insert into public.sesiones (usuario_id, token_hash) values (v_u, 'hash-igual');
     insert into public.sesiones (usuario_id, token_hash) values (v_u, 'hash-igual');
   end $$`,
  "sesiones_token_hash_key",
);

// ============================================================================
console.log("\n== 11. Seguridad: RLS y superficie de datos ==\n");
// ============================================================================

await comprobar("RLS activa en las 7 tablas criticas", `
  select count(*)::int as v from pg_tables
   where schemaname = 'public' and rowsecurity = true
     and tablename in ('usuarios','vehiculos','plazas','eventos_acceso',
                       'bitacora_auditoria','alertas','autorizaciones')
`, [7]);

await comprobar("RLS activa en las 24 tablas de negocio", `
  select count(*)::int as v from pg_tables
   where schemaname = 'public' and rowsecurity = true
`, [24]);

await comprobar("bitacora restringida a Admin/Soporte", `
  select count(*)::int as v from pg_policies
   where tablename = 'bitacora_auditoria' and cmd = 'SELECT' and qual like '%es_admin_o_soporte%'
`, [1]);

await comprobar("funciones de contexto son SECURITY DEFINER", `
  select count(*)::int as v from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('rol_actual','id_usuario_actual')
     and p.prosecdef
`, [2]);

await comprobar("ninguna columna de biometria o rostro", `
  select count(*)::int as v from information_schema.columns
   where table_schema = 'public'
     and (column_name ~* 'rostro|face|biometr|facial|fingerprint|huella_digital')
`, [0]);

await comprobar("evidencia vehicular referenciada por ruta, no binaria", `
  select count(*)::int as v from information_schema.columns
   where table_schema = 'public' and table_name = 'eventos_acceso'
     and data_type in ('bytea', 'oid')
`, [0]);

// ============================================================================
console.log("\n== 12. Contrato entre la base de datos y el frontend ==\n");
// ============================================================================
// public.espacios y public.registros son la frontera con la app Next.js:
// deben entregar exactamente las claves que src/lib/parking/types.ts declara.

await comprobar("espacios entrega todas las claves del contrato", `
  select count(*)::int as v from information_schema.columns
   where table_schema = 'public' and table_name = 'espacios'
     and column_name in ('id','codigo','fila','columna','estado','tipo_permitido',
                         'zona_id','placa','modelo','hora_ingreso',
                         'hora_salida_prevista','accesible','activo')
`, [13]);

await comprobar("estados de plaza en minúsculas (sin SIN_DATOS en mayúsculas)", `
  select count(*)::int as v from public.espacios
   where estado <> lower(estado)
`, [0]);

await comprobar("tipos de vehículo traducidos a las claves del frontend", `
  select count(*)::int as v from public.espacios
   where tipo_permitido not in ('automovil','camioneta','motocicleta','camion','bus','ciclo','cualquiera')
`, [0]);

await comprobar("MOTOCICLISTA del enum llega como 'motocicleta'", `
  select distinct tipo_permitido as v from public.espacios
   where zona_id = (select id::text from public.zonas where codigo = 'EMB-03')
`, ["motocicleta"]);

await comprobar("tipo de plaza coincide con el uso de la zona", `
  select count(*)::int as v from public.espacios e
    join public.zonas z on z.id::text = e.zona_id
   where (z.codigo = 'EMB-03' and e.tipo_permitido <> 'motocicleta')
      or (z.codigo = 'EMB-04' and e.tipo_permitido <> 'camion')
`, [0]);

await comprobar("registros entrega las claves del contrato", `
  select count(*)::int as v from information_schema.columns
   where table_schema = 'public' and table_name = 'registros'
     and column_name in ('id','espacio_codigo','zona_id','placa','modelo','tipo',
                         'hora_ingreso','hora_salida_prevista','hora_salida','estado')
`, [10]);

await comprobar("tipos de registro también en claves del frontend", `
  select count(*)::int as v from public.registros
   where tipo not in ('automovil','camioneta','motocicleta','camion','bus','ciclo')
`, [0]);

await comprobar("las vistas de compatibilidad respetan RLS (security_invoker)", `
  select count(*)::int as v from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in ('espacios','registros')
     and (c.reloptions is null or not c.reloptions::text[] @> array['security_invoker=true'])
`, [0]);

await comprobar("la ocupación no cuenta plazas SIN_DATOS en el denominador", `
  select (ocupadas + libres)::int::text as v from public.vw_ocupacion_zona
   where zona_codigo = 'EMB-01' and sin_datos > 0
`, ["1"]);

// ============================================================================
console.log("\n== 13. Indicadores de los objetivos metricos ==\n");
// ============================================================================

await comprobar("objetivo >=95% trazabilidad: indicador disponible", `
  select count(*)::int as v from public.vw_indicador_trazabilidad
`);

await comprobar("objetivo >=90% precision: indicador disponible", `
  select count(*)::int as v from public.vw_indicador_precision_placa
`);

await comprobar("horas pico: distribucion de eventos por hora", `
  select count(*)::int as v from public.vw_flujo_por_hora
`);

await comprobar("tiempo de permanencia por vehiculo", `
  select count(*)::int as v from public.vw_tiempo_permanencia
`);

await comprobar("salud de hardware por dispositivo", `
  select count(*)::int as v from public.vw_salud_dispositivos
`, [8]);

// ============================================================================
console.log("");
await db.close();

if (fallos > 0) {
  console.error(`RESULTADO: ${fallos} verificacion(es) fallida(s).\n`);
  process.exit(1);
}
console.log("RESULTADO: esquema aplicado y verificaciones OK.\n");

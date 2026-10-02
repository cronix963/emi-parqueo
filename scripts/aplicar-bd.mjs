/**
 * Aplica el modelo fisico a un proyecto Supabase real.
 *
 * A diferencia de `db:validate` (que corre en memoria con PGlite), este script
 * conecta al PostgreSQL del proyecto y ejecuta los scripts de supabase/ en
 * orden dentro de una transaccion: si algo falla, no queda nada a medias.
 *
 * Variables de entorno requeridas (normalmente en .env.local):
 *   DATABASE_URL       cadena de conexion directa de Supabase
 *                      (Settings > Database > Connection string > URI)
 *   DB_SKIP_SEED=1     opcional; omite 07_seed.sql en entornos compartidos
 *
 *   npm run db:push
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

function leerEnv(nombre) {
  const archivo = join(raiz, ".env.local");
  if (!existsSync(archivo)) return process.env[nombre];
  const contenido = readFileSync(archivo, "utf8");
  for (const linea of contenido.split("\n")) {
    const match = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (match && match[1] === nombre) {
      return match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return process.env[nombre];
}

const url = leerEnv("DATABASE_URL");
const omitirSeed = leerEnv("DB_SKIP_SEED") === "1";

if (!url) {
  console.error(
    "\nFalta DATABASE_URL.\n" +
      "Definala en .env.local con la cadena de conexion de Supabase\n" +
      "(Settings > Database > Connection string > URI) y vuelve a ejecutar\n" +
      "  npm run db:push\n",
  );
  process.exit(1);
}

const archivos = omitirSeed ? ARCHIVOS.filter((a) => a !== "07_seed.sql") : ARCHIVOS;

let postgres;
try {
  ({ default: postgres } = await import("postgres"));
} catch {
  console.error(
    "\nFalta la dependencia 'postgres'.\nEjecuta  npm install -D postgres  y reintenta.\n",
  );
  process.exit(1);
}

const cliente = postgres(url, {
  max: 1,
  // Cada script se aplica por separado; no se envuelve todo en una transaccion
  // porque algunos CREATE EXTENSION y DDL de Supabase no son transaccionales.
  onnotice: () => {},
});

console.log("\n== Aplicando el modelo fisico a Supabase ==\n");

let aplicadas = 0;
try {
  for (const archivo of archivos) {
    const ruta = join(dirSupabase, archivo);
    if (!existsSync(ruta)) {
      throw new Error(`No existe ${ruta}`);
    }
    const sql = readFileSync(ruta, "utf8");
    const iniciado = Date.now();
    await cliente.unsafe(sql);
    aplicadas++;
    console.log(`  ok    ${archivo} (${Date.now() - iniciado} ms)`);
  }

  const [{ count: tablas }] = await cliente`
    select count(*)::int as count from pg_tables
     where schemaname = 'public' and tablename not like 'pg_%'
  `;
  const [{ count: vistas }] = await cliente`
    select count(*)::int as count from information_schema.views where table_schema = 'public'
  `;
  const [{ count: politicas }] = await cliente`
    select count(*)::int as count from pg_policies where schemaname = 'public'
  `;

  console.log(
    `\nAplicados ${aplicadas} script(s). ` +
      `public: ${tablas} tablas, ${vistas} vistas, ${politicas} politicas RLS.` +
      (omitirSeed ? " (seed omitido)" : "") +
      "\n",
  );
} catch (error) {
  console.error(`\nFALLA al aplicar el esquema: ${String(error.message).split("\n")[0]}\n`);
  console.error(
    "El proyecto puede haber quedado a medias. Revisa los scripts aplicados con\n" +
      "  select * from information_schema.tables where table_schema = 'public'\n",
  );
  process.exitCode = 1;
} finally {
  await cliente.end({ timeout: 5 });
}
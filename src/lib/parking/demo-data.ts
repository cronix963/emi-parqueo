import type {
  EstadoEspacio,
  Espacio,
  RegistroIngreso,
  ResumenParqueo,
  TipoVehiculo,
  Zona,
} from "./types";

/**
 * Generador determinista (mulberry32) para que el modo demo produzca
 * exactamente los mismos datos en servidor y cliente y no haya
 *hydration mismatch.
 */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Espejo de `public.zonas` sembrado en supabase/07_seed.sql, incluidas las
 * geometrías por defecto (filas x columnas) que generan las 116 plazas.
 */
export const ZONAS_DEMO: Zona[] = [
  {
    id: "EMB-01",
    codigo: "EMB-01",
    nombre: "Estacionamiento Norte — Pabellón A",
    descripcion:
      "Acceso principal por la calle de servicio. Plazas para automóviles y camionetas.",
    plano_layout: null,
    capacidad_maxima: 48,
    umbral_alerta_pct: 85,
    activa: true,
  },
  {
    id: "EMB-02",
    codigo: "EMB-02",
    nombre: "Estacionamiento Sur — Pabellón B",
    descripcion:
      "Plazas mixtas, incluye espacios reservados para personas con movilidad reducida.",
    plano_layout: null,
    capacidad_maxima: 32,
    umbral_alerta_pct: 85,
    activa: true,
  },
  {
    id: "EMB-03",
    codigo: "EMB-03",
    nombre: "Área techada de motocicletas — Polideportivo",
    descripcion: "Cobertura techada para motocicletas y ciclos del personal.",
    plano_layout: null,
    capacidad_maxima: 24,
    umbral_alerta_pct: 90,
    activa: true,
  },
  {
    id: "EMB-04",
    codigo: "EMB-04",
    nombre: "Estacionamiento de carga — Cuartel",
    descripcion: "Unidades pesadas y vehículos de servicio de la institución.",
    plano_layout: null,
    capacidad_maxima: 12,
    umbral_alerta_pct: 80,
    activa: true,
  },
];

/** Geometría por defecto usada por el seed para generar las plazas. */
const LAYOUT_DEMO: Record<string, { filas: number; columnas: number }> = {
  "EMB-01": { filas: 6, columnas: 8 },
  "EMB-02": { filas: 4, columnas: 8 },
  "EMB-03": { filas: 2, columnas: 12 },
  "EMB-04": { filas: 2, columnas: 6 },
};

const MODELOS: Record<TipoVehiculo, string[]> = {
  automovil: [
    "Toyota Yaris",
    "Suzuki Vitara",
    "Hyundai Tucson",
    "Chevrolet Sail",
    "Kia Rio",
    "Nissan March",
    "Volkswagen Gol",
  ],
  camioneta: [
    "Toyota Hilux",
    "Ford Ranger",
    "Chevrolet Tracker",
    "Mitsubishi L200",
    "Nissan Frontier",
  ],
  motocicleta: ["Honda CB 190R", "Yamaha MT-03", "Suzuki VZR 180", "Kawasaki Ninja 650"],
  camion: ["Volvo FH 460", "Freightliner Cascadia", "Hino 500"],
  bus: ["Mercedes-Benz O500", "Volvo B7R"],
  ciclo: ["Bicycle", "Mountain bike"],
};

const LETRAS = "ABCDEFGHJKLMNPRSTUVWXYZ";

function placa(rnd: () => number): string {
  const letra = () => LETRAS[Math.floor(rnd() * LETRAS.length)];
  return `${letra()}${letra()}${letra()}-${Math.floor(rnd() * 9000 + 1000)}`;
}

function horaISO(rnd: () => number, minutosAtrasMax: number): string {
  const ahora = Date.now();
  const minutos = Math.floor(rnd() * minutosAtrasMax) + 5;
  return new Date(ahora - minutos * 60_000).toISOString();
}

/** Traduce public.tipo_vehiculo al contrato del frontend. */
function tipoPermitidoZona(zona: Zona): Espacio["tipoPermitido"] {
  switch (zona.codigo) {
    case "EMB-03":
      return "motocicleta";
    case "EMB-04":
      return "camion";
    default:
      return "cualquiera";
  }
}

export function generarEspaciosDemo(semilla = 20260902): Espacio[] {
  const rnd = prng(semilla);
  const espacios: Espacio[] = [];

  for (const zona of ZONAS_DEMO) {
    const layout = LAYOUT_DEMO[zona.codigo] ?? { filas: 1, columnas: zona.capacidad_maxima };

    for (let fila = 1; fila <= layout.filas; fila++) {
      for (let col = 1; col <= layout.columnas; col++) {
        const codigo = `${zona.codigo}-${String(fila).padStart(2, "0")}${String(col).padStart(2, "0")}`;
        const dado = rnd();
        let estado: Espacio["estado"];
        if (dado < 0.16) estado = "libre";
        else if (dado < 0.72) estado = "ocupado";
        else if (dado < 0.86) estado = "reservado";
        else if (dado < 0.93) estado = "mantenimiento";
        else estado = "sin_datos";

        const tipoPermitido = tipoPermitidoZona(zona);
        const esMoto = tipoPermitido === "motocicleta";
        const tipo: TipoVehiculo = esMoto
          ? "motocicleta"
          : tipoPermitido === "camion"
            ? "camion"
            : rnd() < 0.28
              ? "camioneta"
              : "automovil";

        const accesoMin = Math.floor(rnd() * 3) + 2;
        const ocupado = estado === "ocupado" || estado === "reservado";

        espacios.push({
          id: `${zona.codigo}-${fila}-${col}`,
          codigo,
          fila,
          columna: col,
          estado,
          tipoPermitido,
          zonaId: zona.id,
          placa: ocupado ? placa(rnd) : null,
          modelo: ocupado
            ? MODELOS[tipo][Math.floor(rnd() * MODELOS[tipo].length)]
            : null,
          horaIngreso: estado === "ocupado" ? horaISO(rnd, accesoMin * 60) : null,
          horaSalidaPrevista:
            estado === "ocupado"
              ? new Date(Date.now() + (Math.floor(rnd() * 4) + 1) * 3_600_000).toISOString()
              : null,
          accesible: fila === 1 && col <= 2 && zona.codigo !== "EMB-03",
        });
      }
    }
  }

  return espacios;
}

export function registrosDemo(espacios: Espacio[]): RegistroIngreso[] {
  const rnd = prng(7788);
  return espacios
    .filter((e) => e.estado === "ocupado")
    .slice(0, 14)
    .map((espacio, i) => {
      const tipo: TipoVehiculo =
        espacio.tipoPermitido === "motocicleta"
          ? "motocicleta"
          : espacio.tipoPermitido === "camion"
            ? "camion"
            : rnd() < 0.3
              ? "camioneta"
              : "automovil";
      return {
        id: `reg-${i + 1}`,
        espacioCodigo: espacio.codigo,
        zonaId: espacio.zonaId,
        placa: espacio.placa ?? "—",
        modelo: espacio.modelo ?? "—",
        tipo,
        horaIngreso: espacio.horaIngreso ?? new Date().toISOString(),
        horaSalidaPrevista: espacio.horaSalidaPrevista,
        estado: espacio.estado,
      };
    });
}

export function resumir(espacios: Espacio[]): ResumenParqueo {
  const total = espacios.length;
  const cuenta = (estado: EstadoEspacio) =>
    espacios.filter((espacio) => espacio.estado === estado).length;

  const libres = cuenta("libre");
  const ocupados = cuenta("ocupado");
  const reservados = cuenta("reservado");
  const mantenimiento = cuenta("mantenimiento");
  // Coincide con public.vw_ocupacion_zona: las plazas SIN_DATOS no entran al
  // denominador porque todavía no fueron evaluadas por el motor de visión.
  const denominador = total - cuenta("sin_datos");

  return {
    total,
    libres,
    ocupados,
    reservados,
    mantenimiento,
    ocupacionPct:
      denominador === 0 ? 0 : Math.round(((ocupados + reservados) / denominador) * 100),
  };
}

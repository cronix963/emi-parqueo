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

export const ZONAS_DEMO: Zona[] = [
  {
    id: "zona-a",
    nombre: "Pabellón A — Estacionamiento Norte",
    descripcion: "Acceso principal por calle_loop. Plazas para automata y camionetas.",
    filas: 4,
    columnas: 8,
    capacidades: { automovil: 24, camioneta: 8 },
  },
  {
    id: "zona-b",
    nombre: "Pabellón B — Estacionamiento Sur",
    descripcion: "Plazas mixtas con dos espacios reservados para personas con movilidad reducida.",
    filas: 3,
    columnas: 8,
    capacidades: { automovil: 16, camioneta: 8 },
  },
  {
    id: "zona-c",
    nombre: "Polideportivo — Motocicletas",
    descripcion: "Área techada para motocicletas y ciclos del personal.",
    filas: 2,
    columnas: 10,
    capacidades: { motocicleta: 20 },
  },
  {
    id: "zona-d",
    nombre: "Cuartel — Camiones y carga",
    descripcion: "Estacionamiento de vehículos pesados y unidades de la institución.",
    filas: 2,
    columnas: 6,
    capacidades: { camion: 12 },
  },
];

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

function tipoPermitidoZona(zona: Zona, index: number): Espacio["tipoPermitido"] {
  const capacidades = zona.capacidades;
  if (!capacidades.motocicleta) return "cualquiera";
  return index % capacidades.motocicleta === 0 ? "cualquiera" : "motocicleta";
}

export function generarEspaciosDemo(semilla = 20260902): Espacio[] {
  const rnd = prng(semilla);
  const espacios: Espacio[] = [];

  for (const zona of ZONAS_DEMO) {
    for (let fila = 1; fila <= zona.filas; fila++) {
      for (let col = 1; col <= zona.columnas; col++) {
        const codigo = `${zona.id.split("-")[1].toUpperCase()}${fila}${String(col).padStart(2, "0")}`;
        const dado = rnd();
        let estado: Espacio["estado"];
        if (dado < 0.16) estado = "libre";
        else if (dado < 0.72) estado = "ocupado";
        else if (dado < 0.86) estado = "reservado";
        else if (dado < 0.93) estado = "mantenimiento";
        else estado = "libre";

        const tipoPermitido = tipoPermitidoZona(zona, fila * zona.columnas + col);
        const esMoto = tipoPermitido === "motocicleta";
        const tipo: TipoVehiculo = esMoto
          ? "motocicleta"
          : rnd() < 0.28
            ? "camioneta"
            : "automovil";

        const accesoMin = Math.floor(rnd() * 3) + 2;
        const ocupado = estado === "ocupado" || estado === "reservado";

        espacios.push({
          id: `${zona.id}-${fila}-${col}`,
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
          accesible: fila === zona.filas && col <= 2 && zona.id !== "zona-c",
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
      const tipo = espacio.tipoPermitido === "motocicleta" ? "motocicleta" : rnd() < 0.3 ? "camioneta" : "automovil";
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

  return {
    total,
    libres,
    ocupados,
    reservados,
    mantenimiento,
    ocupacionPct: total === 0 ? 0 : Math.round(((ocupados + reservados) / total) * 100),
  };
}

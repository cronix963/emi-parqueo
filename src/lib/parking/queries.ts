import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ZONAS_DEMO, generarEspaciosDemo, registrosDemo, resumir } from "./demo-data";
import type {
  EstadoEspacio,
  Espacio,
  RegistroIngreso,
  ResumenParqueo,
  TipoVehiculo,
  Zona,
} from "./types";

export interface CargaParqueo {
  zonas: Zona[];
  espacios: Espacio[];
  resumen: ResumenParqueo;
  registros: RegistroIngreso[];
  origen: "supabase" | "demo";
}

/** Filas tal como las exponen las vistas de compatibilidad (06_views.sql). */
interface FilaEspacio {
  id: string;
  codigo: string;
  fila: number;
  columna: number;
  estado: string;
  tipo_permitido: string;
  zona_id: string;
  placa: string | null;
  modelo: string | null;
  hora_ingreso: string | null;
  hora_salida_prevista: string | null;
  accesible: boolean;
  activo: boolean;
}

interface FilaRegistro {
  id: string;
  espacio_codigo: string | null;
  zona_id: string | null;
  placa: string;
  modelo: string | null;
  tipo: string;
  hora_ingreso: string;
  hora_salida_prevista: string | null;
}

interface FilaZona {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  plano_layout: string | null;
  capacidad_maxima: number;
  umbral_alerta_pct: number;
  activa: boolean;
}

const ESTADOS: readonly EstadoEspacio[] = [
  "libre",
  "ocupado",
  "reservado",
  "mantenimiento",
  "sin_datos",
];

const TIPOS: readonly TipoVehiculo[] = [
  "automovil",
  "camioneta",
  "motocicleta",
  "camion",
  "bus",
  "ciclo",
];

/** La base de datos es la fuente de verdad; un valor inesperado degrada a `libre`. */
function aEstado(valor: string): EstadoEspacio {
  return ESTADOS.includes(valor as EstadoEspacio) ? (valor as EstadoEspacio) : "libre";
}

function aTipo(valor: string): TipoVehiculo | "cualquiera" {
  return TIPOS.includes(valor as TipoVehiculo) ? (valor as TipoVehiculo) : "cualquiera";
}

function aEspacio(fila: FilaEspacio): Espacio {
  return {
    id: fila.id,
    codigo: fila.codigo,
    fila: fila.fila,
    columna: fila.columna,
    estado: aEstado(fila.estado),
    tipoPermitido: aTipo(fila.tipo_permitido),
    zonaId: fila.zona_id,
    placa: fila.placa,
    modelo: fila.modelo,
    horaIngreso: fila.hora_ingreso,
    horaSalidaPrevista: fila.hora_salida_prevista,
    accesible: fila.accesible,
  };
}

function aRegistro(fila: FilaRegistro): RegistroIngreso {
  return {
    id: fila.id,
    espacioCodigo: fila.espacio_codigo ?? "—",
    zonaId: fila.zona_id ?? "—",
    placa: fila.placa,
    modelo: fila.modelo ?? "—",
    tipo: aTipo(fila.tipo) === "cualquiera" ? "automovil" : (aTipo(fila.tipo) as TipoVehiculo),
    horaIngreso: fila.hora_ingreso,
    horaSalidaPrevista: fila.hora_salida_prevista,
    estado: "ocupado",
  };
}

function aZona(fila: FilaZona): Zona {
  return {
    id: fila.id,
    codigo: fila.codigo,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    plano_layout: fila.plano_layout,
    capacidad_maxima: fila.capacidad_maxima,
    umbral_alerta_pct: fila.umbral_alerta_pct,
    activa: fila.activa,
  };
}

/**
 * Carga el estado del parqueo. Si Supabase no está configurado, o si el
 * esquema todavía no se aplicó, devuelve el conjunto demo para que la interfaz
 * siempre sea utilizable.
 */
export async function cargarParqueo(): Promise<CargaParqueo> {
  if (!isSupabaseConfigured()) {
    return demo();
  }

  try {
    const supabase = await createClient();

    const { data: zonas, error: errorZonas } = await supabase
      .from("zonas")
      .select("id, codigo, nombre, descripcion, plano_layout, capacidad_maxima, umbral_alerta_pct, activa")
      .eq("activa", true)
      .order("nombre");

    if (errorZonas || !zonas?.length) {
      return demo();
    }

    const { data: espacios, error: errorEspacios } = await supabase
      .from("espacios")
      .select("*")
      .eq("activo", true)
      .order("codigo");

    if (errorEspacios || !espacios?.length) {
      return demo();
    }

    const lista = (espacios as FilaEspacio[]).map(aEspacio);

    const { data: registros } = await supabase
      .from("registros")
      .select("*")
      .order("hora_ingreso", { ascending: false })
      .limit(50);

    return {
      zonas: (zonas as FilaZona[]).map(aZona),
      espacios: lista,
      resumen: resumir(lista),
      registros: ((registros ?? []) as FilaRegistro[]).map(aRegistro),
      origen: "supabase",
    };
  } catch {
    return demo();
  }
}

function demo(): CargaParqueo {
  const espacios = generarEspaciosDemo();
  return {
    zonas: ZONAS_DEMO,
    espacios,
    resumen: resumir(espacios),
    registros: registrosDemo(espacios),
    origen: "demo",
  };
}
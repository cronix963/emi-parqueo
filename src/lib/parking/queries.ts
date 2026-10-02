import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { ZONAS_DEMO, generarEspaciosDemo, registrosDemo, resumir } from "./demo-data";
import type { Espacio, RegistroIngreso, ResumenParqueo, Zona } from "./types";

export interface CargaParqueo {
  zonas: Zona[];
  espacios: Espacio[];
  resumen: ResumenParqueo;
  registros: RegistroIngreso[];
  origen: "supabase" | "demo";
}

/**
 * Carga el estado del parqueo. Si Supabase no está configurado, o si las
 * tablas aún no existen, devuelve el conjunto demo para que la interfaz
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
      .select("*")
      .order("nombre");

    if (errorZonas || !zonas?.length) {
      return demo();
    }

    const { data: espacios, error: errorEspacios } = await supabase
      .from("espacios")
      .select("*")
      .order("codigo");

    if (errorEspacios || !espacios?.length) {
      return demo();
    }

    const lista = espacios as Espacio[];

    const { data: registros } = await supabase
      .from("registros")
      .select("*")
      .order("hora_ingreso", { ascending: false });

    return {
      zonas: zonas as Zona[],
      espacios: lista,
      resumen: resumir(lista),
      registros: (registros as RegistroIngreso[]) ?? [],
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

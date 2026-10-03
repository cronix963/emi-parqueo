import { MapaParqueo } from "@/components/mapa-parqueo";
import { Metricas, ResumenZonas } from "@/components/metricas";
import { Encabezado } from "@/components/encabezado";
import { TablaIngresos } from "@/components/tabla-ingresos";
import { Pie } from "@/components/emi/pie";
import { cargarParqueo } from "@/lib/parking/queries";
import { formatearFechaHora } from "@/lib/fechas";
import { ETIQUETA_ESTADO } from "@/lib/parking/types";
import type { EstadoEspacio } from "@/lib/parking/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel de monitoreo",
};

const PUNTOS: Record<EstadoEspacio, string> = {
  libre: "bg-libre",
  ocupado: "bg-ocupado",
  reservado: "bg-reservado",
  mantenimiento: "bg-mantenimiento",
  sin_datos: "bg-sin-datos",
};

export default async function DashboardPage() {
  const { zonas, espacios, resumen, registros, origen } = await cargarParqueo();
  // RSC con render por petición (force-dynamic): leer el reloj del servidor
  // es correcto y necesario para marcar "actualizado hace X".
  // eslint-disable-next-line react-hooks/purity
  const ahora = Date.now();
  const actualizado = formatearFechaHora(new Date(ahora).toISOString());

  return (
    <div className="flex min-h-dvh flex-col bg-cloud/40">
      <Encabezado
        origen={origen}
        actualizado={actualizado}
        libres={resumen.libres}
      />

      {/* Título del panel */}
      <div className="border-b border-line bg-white">
        <div className="contenedor py-6">
          <p className="antetitulo">SISTEMA DE PARQUEO</p>
          <h1 className="titulo-seccion !text-[2rem] !leading-[2.25rem]">
            PANEL DE MONITOREO
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            {(Object.keys(ETIQUETA_ESTADO) as EstadoEspacio[]).map((estado) => (
              <span
                key={estado}
                className="flex items-center gap-2 text-[13px] text-ink/70"
              >
                <span className={`h-2.5 w-2.5 ${PUNTOS[estado]}`} />
                {ETIQUETA_ESTADO[estado]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <main className="contenedor flex-1 py-6">
        <Metricas resumen={resumen} />

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <MapaParqueo zonas={zonas} espacios={espacios} />
          <div className="space-y-6">
            <ResumenZonas zonas={zonas} espacios={espacios} />
            <TablaIngresos registros={registros} ahora={ahora} />
          </div>
        </div>
      </main>

      <Pie />
    </div>
  );
}
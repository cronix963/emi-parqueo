import { MapaParqueo } from "@/components/mapa-parqueo";
import { Metricas, ResumenZonas } from "@/components/metricas";
import { Encabezado } from "@/components/encabezado";
import { TablaIngresos } from "@/components/tabla-ingresos";
import { cargarParqueo } from "@/lib/parking/queries";
import { formatearFechaHora } from "@/lib/fechas";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { zonas, espacios, resumen, registros, origen } = await cargarParqueo();
  // RSC con render por petición (force-dynamic): leer el reloj del servidor
  // es correcto y necesario para marcar "actualizado hace X".
  // eslint-disable-next-line react-hooks/purity
  const ahora = Date.now();
  const actualizado = formatearFechaHora(new Date(ahora).toISOString());

  return (
    <div className="bg-emi-mesh flex min-h-dvh flex-col">
      <Encabezado
        origen={origen}
        actualizado={actualizado}
        libres={resumen.libres}
      />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Metricas resumen={resumen} />

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
          <MapaParqueo zonas={zonas} espacios={espacios} />
          <div className="space-y-6">
            <ResumenZonas zonas={zonas} espacios={espacios} />
            <TablaIngresos registros={registros} ahora={ahora} />
          </div>
        </div>
      </main>

      <footer className="border-t border-emi-800/70 px-6 py-4 text-center text-xs text-emi-500">
        Escuela Militar de Ingeniería · Sistema de Parqueo Automático · La Paz,
        Bolivia
      </footer>
    </div>
  );
}

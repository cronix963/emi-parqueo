import type { Espacio, ResumenParqueo, Zona } from "@/lib/parking/types";
import { IconoAuto, IconoGrafico } from "@/components/emi/iconos";

/**
 * Tarjetas de indicadores. Siguen la escala del sitio: fondo blanco, borde
 * fino, número grande en Poppins y barra de progreso dorada.
 */
export function Metricas({ resumen }: { resumen: ResumenParqueo }) {
  const tarjetas = [
    {
      etiqueta: "Espacios libres",
      valor: resumen.libres,
      detalle: `${resumen.total} espacios en total`,
      color: "text-libre",
      barra: resumen.total ? (resumen.libres / resumen.total) * 100 : 0,
      icono: <IconoAuto />,
    },
    {
      etiqueta: "Ocupados",
      valor: resumen.ocupados,
      detalle: "Vehículos actualmente estacionados",
      color: "text-ocupado",
      barra: resumen.total ? (resumen.ocupados / resumen.total) * 100 : 0,
      icono: <IconoAuto />,
    },
    {
      etiqueta: "Reservados",
      valor: resumen.reservados,
      detalle: "Asignados con anticipación",
      color: "text-reservado",
      barra: resumen.total ? (resumen.reservados / resumen.total) * 100 : 0,
      icono: <IconoAuto />,
    },
    {
      etiqueta: "Ocupación",
      valor: `${resumen.ocupacionPct}%`,
      detalle: `${resumen.mantenimiento} en mantenimiento`,
      color: "text-marine",
      barra: resumen.ocupacionPct,
      icono: <IconoGrafico />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {tarjetas.map((t) => (
        <div key={t.etiqueta} className="tarjeta p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="font-heading text-[11px] font-semibold text-marine/60">
              {t.etiqueta.toUpperCase()}
            </p>
            <span className={`text-lg ${t.color}`}>{t.icono}</span>
          </div>
          <p className={`mt-2 font-heading text-3xl font-extrabold ${t.color}`}>
            {t.valor}
          </p>
          <p className="mt-1 text-[12px] text-ink/60">{t.detalle}</p>
          <div className="mt-4 h-1.5 w-full overflow-hidden bg-cloud">
            <div
              className="h-full bg-gold transition-[width] duration-700"
              style={{ width: `${Math.min(100, Math.max(2, t.barra))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResumenZonas({
  zonas,
  espacios,
}: {
  zonas: Zona[];
  espacios: Espacio[];
}) {
  return (
    <div className="tarjeta p-5">
      <h2 className="font-heading text-base font-bold text-marine">
        Disponibilidad por zona
      </h2>
      <ul className="mt-4 space-y-4">
        {zonas.map((z) => {
          const propios = espacios.filter((e) => e.zonaId === z.id);
          const libres = propios.filter((e) => e.estado === "libre").length;
          const pct = propios.length ? Math.round((libres / propios.length) * 100) : 0;
          const color =
            pct >= 50 ? "bg-libre" : pct >= 20 ? "bg-reservado" : "bg-ocupado";

          return (
            <li key={z.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-ink">{z.nombre}</span>
                <span className="shrink-0 font-mono text-sm font-semibold text-marine">
                  {libres}/{propios.length}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden bg-cloud">
                <div
                  className={`h-full ${color} transition-[width] duration-500`}
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
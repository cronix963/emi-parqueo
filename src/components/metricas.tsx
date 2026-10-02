import type { ResumenParqueo, Zona } from "@/lib/parking/types";

export function Metricas({ resumen }: { resumen: ResumenParqueo }) {
  const tarjetas = [
    {
      etiqueta: "Espacios libres",
      valor: resumen.libres,
      detalle: `${resumen.total} espacios en total`,
      color: "text-emerald-400",
      barra: resumen.total ? (resumen.libres / resumen.total) * 100 : 0,
    },
    {
      etiqueta: "Ocupados",
      valor: resumen.ocupados,
      detalle: "Vehículos actualmente estacionados",
      color: "text-red-400",
      barra: resumen.total ? (resumen.ocupados / resumen.total) * 100 : 0,
    },
    {
      etiqueta: "Reservados",
      valor: resumen.reservados,
      detalle: "Asignados con anticipación",
      color: "text-emi-gold-400",
      barra: resumen.total ? (resumen.reservados / resumen.total) * 100 : 0,
    },
    {
      etiqueta: "Ocupación",
      valor: `${resumen.ocupacionPct}%`,
      detalle: `${resumen.mantenimiento} en mantenimiento`,
      color: "text-emi-200",
      barra: resumen.ocupacionPct,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {tarjetas.map((t) => (
        <div key={t.etiqueta} className="panel-emi relative overflow-hidden p-5">
          <p className="text-[11px] font-medium tracking-widest text-emi-400 uppercase">
            {t.etiqueta}
          </p>
          <p className={`mt-2 text-3xl font-bold ${t.color}`}>{t.valor}</p>
          <p className="mt-1 text-xs text-emi-500">{t.detalle}</p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-emi-900">
            <div
              className="h-full rounded-full bg-emi-gold-400 transition-[width] duration-700"
              style={{ width: `${Math.min(100, Math.max(2, t.barra))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResumenZonas({ zonas, espacios }: { zonas: Zona[]; espacios: import("@/lib/parking/types").Espacio[] }) {
  return (
    <div className="panel-emi p-5">
      <h2 className="text-base font-semibold text-white">Disponibilidad por zona</h2>
      <ul className="mt-4 space-y-3.5">
        {zonas.map((z) => {
          const propios = espacios.filter((e) => e.zonaId === z.id);
          const libres = propios.filter((e) => e.estado === "libre").length;
          const pct = propios.length ? Math.round((libres / propios.length) * 100) : 0;
          const tono =
            pct >= 50 ? "text-emerald-400" : pct >= 20 ? "text-emi-gold-400" : "text-red-400";
          return (
            <li key={z.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-emi-200">{z.nombre}</span>
                <span className={`shrink-0 font-mono text-sm font-semibold ${tono}`}>
                  {libres}/{propios.length}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-emi-900">
                <div
                  className={`h-full rounded-full ${tono.replace("text-", "bg-")}`}
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

import type { RegistroIngreso } from "@/lib/parking/types";
import { ETIQUETA_TIPO } from "@/lib/parking/types";
import { antiguedad, formatearHora } from "@/lib/fechas";

export function TablaIngresos({
  registros,
  ahora,
}: {
  registros: RegistroIngreso[];
  ahora: number;
}) {
  const visibles = registros.slice(0, 12);

  return (
    <div className="panel-emi overflow-hidden">
      <div className="border-b border-emi-700/60 px-5 py-4">
        <h2 className="text-base font-semibold text-white">Vehículos estacionados</h2>
        <p className="mt-0.5 text-xs text-emi-400">
          Ingresos más recientes registrados en el sistema
        </p>
      </div>

      {visibles.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-emi-400">
          Todavía no hay vehículos registrados.
        </p>
      ) : (
        <ul className="divide-y divide-emi-800/70">
          {visibles.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-5 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emi-800 text-[10px] font-bold text-emi-gold-300">
                {r.espacioCodigo}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-semibold text-white">
                  {r.placa}
                </p>
                <p className="truncate text-xs text-emi-400">
                  {r.modelo} · {ETIQUETA_TIPO[r.tipo]}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-xs text-emi-200">
                  {r.horaIngreso ? formatearHora(r.horaIngreso) : "—"}
                </p>
                <p className="text-[11px] text-emi-500">
                  {r.horaIngreso ? antiguedad(r.horaIngreso, ahora) : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

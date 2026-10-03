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
    <div className="tarjeta">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-heading text-base font-bold text-marine">
          Vehículos estacionados
        </h2>
        <p className="mt-0.5 text-xs text-ink/60">
          Ingresos más recientes registrados en el sistema
        </p>
      </div>

      {visibles.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink/55">
          Todavía no hay vehículos registrados.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {visibles.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-5 py-3">
              <span className="grid h-9 min-w-14 shrink-0 place-items-center bg-marine px-1.5 font-mono text-[10px] font-bold text-white">
                {r.espacioCodigo}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-semibold text-marine">
                  {r.placa}
                </p>
                <p className="truncate text-xs text-ink/60">
                  {r.modelo} · {ETIQUETA_TIPO[r.tipo]}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-xs text-ink">
                  {r.horaIngreso ? formatearHora(r.horaIngreso) : "—"}
                </p>
                <p className="text-[11px] text-ink/50">
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
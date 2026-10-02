"use client";

import { useMemo, useState } from "react";
import type { Espacio, EstadoEspacio, Zona } from "@/lib/parking/types";
import { ETIQUETA_ESTADO } from "@/lib/parking/types";

const COLORES: Record<EstadoEspacio, { caja: string; punto: string }> = {
  libre: {
    caja: "border-emerald-500/70 bg-emerald-500/12 hover:bg-emerald-500/22",
    punto: "bg-emerald-400",
  },
  ocupado: {
    caja: "border-red-500/70 bg-red-500/12 hover:bg-red-500/20",
    punto: "bg-red-400",
  },
  reservado: {
    caja: "border-emi-gold-400/80 bg-emi-gold-400/15 hover:bg-emi-gold-400/25",
    punto: "bg-emi-gold-400",
  },
  mantenimiento: {
    caja: "border-violet-500/70 bg-violet-500/12 hover:bg-violet-500/20",
    punto: "bg-violet-400",
  },
  sin_datos: {
    caja: "border-slate-400/50 bg-slate-400/10 hover:bg-slate-400/20",
    punto: "bg-slate-300",
  },
};

const FILTROS: { valor: EstadoEspacio | "todos"; etiqueta: string }[] = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "libre", etiqueta: "Disponibles" },
  { valor: "ocupado", etiqueta: "Ocupados" },
  { valor: "reservado", etiqueta: "Reservados" },
  { valor: "mantenimiento", etiqueta: "Mantenimiento" },
  { valor: "sin_datos", etiqueta: "Sin datos" },
];

interface Props {
  zonas: Zona[];
  espacios: Espacio[];
}

export function MapaParqueo({ zonas, espacios }: Props) {
  const [filtro, setFiltro] = useState<EstadoEspacio | "todos">("todos");
  const [zonaActiva, setZonaActiva] = useState<string>(zonas[0]?.id ?? "");
  const [seleccion, setSeleccion] = useState<Espacio | null>(null);

  const visibles = useMemo(
    () =>
      espacios.filter(
        (e) => e.zonaId === zonaActiva && (filtro === "todos" || e.estado === filtro),
      ),
    [espacios, zonaActiva, filtro],
  );

  const porFila = useMemo(() => {
    const mapa = new Map<number, Espacio[]>();
    for (const e of visibles) {
      const lista = mapa.get(e.fila) ?? [];
      lista.push(e);
      mapa.set(e.fila, lista);
    }
    return [...mapa.entries()].sort((a, b) => a[0] - b[0]);
  }, [visibles]);

  const zona = zonas.find((z) => z.id === zonaActiva);

  return (
    <div className="panel-emi overflow-hidden">
      {/* Cabecera de zona */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emi-700/60 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {zona?.nombre ?? "Sin zona"}
          </h2>
          <p className="mt-0.5 text-xs text-emi-400">{zona?.descripcion}</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="zona" className="sr-only">
            Elegir zona
          </label>
          <select
            id="zona"
            value={zonaActiva}
            onChange={(e) => {
              setZonaActiva(e.target.value);
              setSeleccion(null);
            }}
            className="rounded-lg border border-emi-700 bg-emi-900 px-3 py-2 text-sm text-emi-100 outline-none focus:border-emi-gold-400"
          >
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 px-5 py-4">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => setFiltro(f.valor)}
            aria-pressed={filtro === f.valor}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              filtro === f.valor
                ? "border-emi-gold-400 bg-emi-gold-400 text-emi-950"
                : "border-emi-700 bg-emi-900/60 text-emi-200 hover:border-emi-500"
            }`}
          >
            {f.etiqueta}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-emi-400">
          {visibles.length} espacio{visibles.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-y border-emi-800/70 bg-emi-950/40 px-5 py-3">
        {(Object.keys(COLORES) as EstadoEspacio[]).map((e) => (
          <span key={e} className="flex items-center gap-2 text-xs text-emi-300">
            <span className={`h-2.5 w-2.5 rounded-sm ${COLORES[e].punto}`} />
            {ETIQUETA_ESTADO[e]}
          </span>
        ))}
      </div>

      {/* Mapa */}
      <div className="space-y-3 px-5 py-5">
        {porFila.length === 0 ? (
          <p className="py-8 text-center text-sm text-emi-400">
            No hay espacios con ese estado en esta zona.
          </p>
        ) : (
          porFila.map(([fila, lista]) => (
            <div key={fila} className="flex items-center gap-3">
              <span className="w-8 shrink-0 text-right font-mono text-xs text-emi-500">
                {fila}
              </span>
              <div className="flex flex-1 flex-wrap gap-2">
                {lista.map((e) => {
                  const activo = seleccion?.id === e.id;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setSeleccion(e)}
                      aria-pressed={activo}
                      title={`${e.codigo} · ${ETIQUETA_ESTADO[e.estado]}${e.placa ? ` · ${e.placa}` : ""}`}
                      className={`relative h-12 w-16 rounded-lg border font-mono text-[11px] font-semibold transition ${
                        COLORES[e.estado].caja
                      } ${activo ? "ring-2 ring-emi-gold-300 ring-offset-2 ring-offset-emi-950" : ""} ${
                        e.accesible ? "after:absolute after:right-1 after:bottom-1 after:text-[8px] after:text-emi-200 after:content-['♿']" : ""
                      }`}
                    >
                      {e.codigo}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detalle */}
      {seleccion ? (
        <div className="mx-5 mb-5 rounded-lg border border-emi-gold-500/40 bg-emi-900/80 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-bold text-emi-gold-300">
                Espacio {seleccion.codigo}
              </p>
              <p className="mt-1 text-sm text-emi-200">
                {ETIQUETA_ESTADO[seleccion.estado]}
                {seleccion.accesible ? " · Plaza accesible" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSeleccion(null)}
              className="rounded-md border border-emi-700 px-3 py-1.5 text-xs text-emi-300 transition hover:border-emi-500"
            >
              Cerrar
            </button>
          </div>

          {seleccion.placa ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-emi-500">Placa</dt>
                <dd className="mt-0.5 font-mono font-semibold text-white">
                  {seleccion.placa}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-emi-500">Vehículo</dt>
                <dd className="mt-0.5 text-emi-100">{seleccion.modelo}</dd>
              </div>
              <div>
                <dt className="text-xs text-emi-500">Ingreso</dt>
                <dd className="mt-0.5 text-emi-100">
                  {seleccion.horaIngreso ? formatearHora(seleccion.horaIngreso) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-emi-500">Salida prevista</dt>
                <dd className="mt-0.5 text-emi-100">
                  {seleccion.horaSalidaPrevista
                    ? formatearHora(seleccion.horaSalidaPrevista)
                    : "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-emi-300">
              {seleccion.estado === "libre"
                ? "Este espacio está disponible para asignar."
                : "Espacio sin vehículo registrado."}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function formatearHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

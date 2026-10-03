"use client";

import { useMemo, useState } from "react";
import type { Espacio, EstadoEspacio, Zona } from "@/lib/parking/types";
import { ETIQUETA_ESTADO } from "@/lib/parking/types";
import { formatearHora } from "@/lib/fechas";

/**
 * Mapa de espacios: grilla por filas dentro de la zona seleccionada, con
 * filtros de estado y detalle de la plaza elegida. El color de cada plaza
 * corresponde a public.estado_plaza.
 */

const COLORES: Record<
  EstadoEspacio,
  { caja: string; punto: string; texto: string }
> = {
  libre: {
    caja: "border-libre/60 bg-libre/10 hover:bg-libre/25",
    punto: "bg-libre",
    texto: "text-libre",
  },
  ocupado: {
    caja: "border-ocupado/60 bg-ocupado/10 hover:bg-ocupado/25",
    punto: "bg-ocupado",
    texto: "text-ocupado",
  },
  reservado: {
    caja: "border-reservado/70 bg-reservado/15 hover:bg-reservado/30",
    punto: "bg-reservado",
    texto: "text-reservado",
  },
  mantenimiento: {
    caja: "border-mantenimiento/60 bg-mantenimiento/10 hover:bg-mantenimiento/25",
    punto: "bg-mantenimiento",
    texto: "text-mantenimiento",
  },
  sin_datos: {
    caja: "border-sin-datos/50 bg-sin-datos/10 hover:bg-sin-datos/25",
    punto: "bg-sin-datos",
    texto: "text-slate",
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
    <div className="tarjeta">
      {/* Cabecera de zona */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <p className="font-heading text-[11px] font-bold text-gold-deep">
            {zona?.codigo}
          </p>
          <h2 className="mt-0.5 font-heading text-lg font-bold text-marine">
            {zona?.nombre ?? "Sin zona"}
          </h2>
          <p className="mt-1 max-w-xl text-[13px] text-ink/65">{zona?.descripcion}</p>
        </div>
        <div>
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
            className="border border-line bg-white px-3 py-2 font-heading text-sm text-marine outline-none transition-colors focus:border-gold"
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
      <div className="flex flex-wrap items-center gap-2 px-5 py-4">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => setFiltro(f.valor)}
            aria-pressed={filtro === f.valor}
            className={`px-3.5 py-1.5 font-heading text-xs font-semibold transition-colors ${
              filtro === f.valor
                ? "bg-marine text-white"
                : "border border-line bg-white text-marine hover:border-gold hover:text-gold-deep"
            }`}
          >
            {f.etiqueta}
          </button>
        ))}
        <span className="ml-auto self-center font-heading text-xs text-ink/55">
          {visibles.length} espacio{visibles.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 border-y border-line bg-cloud/60 px-5 py-3">
        {(Object.keys(COLORES) as EstadoEspacio[]).map((e) => (
          <span key={e} className="flex items-center gap-2 text-xs text-ink/75">
            <span className={`h-2.5 w-2.5 ${COLORES[e].punto}`} />
            {ETIQUETA_ESTADO[e]}
          </span>
        ))}
      </div>

      {/* Mapa */}
      <div className="space-y-3 px-5 py-5">
        {porFila.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink/55">
            No hay espacios con ese estado en esta zona.
          </p>
        ) : (
          porFila.map(([fila, lista]) => (
            <div key={fila} className="flex items-center gap-3">
              <span className="w-8 shrink-0 text-right font-mono text-xs text-ink/45">
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
                      className={`relative h-12 w-16 border font-mono text-[11px] font-semibold transition ${
                        COLORES[e.estado].caja
                      } ${
                        activo
                          ? "outline-2 outline-offset-2 outline-gold"
                          : ""
                      } ${
                        e.accesible
                          ? "after:absolute after:right-1 after:bottom-0.5 after:text-[9px] after:text-ink/60 after:content-['♿']"
                          : ""
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

      {/* Detalle de la plaza */}
      {seleccion ? (
        <div className="mx-5 mb-5 border-l-4 border-gold bg-cloud/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-bold text-marine-deep">
                Espacio {seleccion.codigo}
              </p>
              <p className="mt-1 text-sm text-ink/75">
                {ETIQUETA_ESTADO[seleccion.estado]}
                {seleccion.accesible ? " · Plaza accesible" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSeleccion(null)}
              className="border border-line px-3 py-1.5 font-heading text-xs font-semibold text-marine transition-colors hover:border-gold hover:text-gold-deep"
            >
              Cerrar
            </button>
          </div>

          {seleccion.placa ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-ink/55">Placa</dt>
                <dd className="mt-0.5 font-mono font-semibold text-marine">
                  {seleccion.placa}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink/55">Vehículo</dt>
                <dd className="mt-0.5 text-ink">{seleccion.modelo}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink/55">Ingreso</dt>
                <dd className="mt-0.5 text-ink">
                  {seleccion.horaIngreso ? formatearHora(seleccion.horaIngreso) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink/55">Salida prevista</dt>
                <dd className="mt-0.5 text-ink">
                  {seleccion.horaSalidaPrevista
                    ? formatearHora(seleccion.horaSalidaPrevista)
                    : "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-ink/70">
              {seleccion.estado === "libre"
                ? "Este espacio está disponible para asignar."
                : seleccion.estado === "sin_datos"
                  ? "Plaza registrada que el motor de visión aún no ha evaluado."
                  : "Espacio sin vehículo registrado."}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
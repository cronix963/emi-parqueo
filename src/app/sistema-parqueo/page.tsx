import type { Metadata } from "next";
import Link from "next/link";
import { Cabecera } from "@/components/emi/cabecera";
import { Pie } from "@/components/emi/pie";
import { Dato, Seccion, Tarjeta } from "@/components/emi/bloques";
import {
  ETIQUETA_ESTADO,
  MODULOS,
  OBJETIVOS,
  PRINCIPIOS,
} from "@/lib/emi/modulos";
import { cargarParqueo } from "@/lib/parking/queries";
import {
  IconoAlerta,
  IconoAuto,
  IconoBandeja,
  IconoCamara,
  IconoEscudo,
  IconoGrafico,
  IconoHistorial,
  IconoLlave,
  IconoMapa,
  IconoMovil,
  IconoReloj,
  IconoUsuario,
} from "@/components/emi/iconos";

export const metadata: Metadata = {
  title: "Sistema de Parqueo | Escuela Militar de Ingeniería",
  description:
    "Sistema de parqueo inteligente de la EMI: control de acceso vehicular, reconocimiento de placas, ocupación en tiempo real, alertas y trazabilidad.",
};

export const dynamic = "force-dynamic";

const ICONOS = {
  usuario: IconoUsuario,
  llave: IconoLlave,
  auto: IconoAuto,
  camara: IconoCamara,
  mapa: IconoMapa,
  alerta: IconoAlerta,
  grafico: IconoGrafico,
  historial: IconoHistorial,
  escudo: IconoEscudo,
  movil: IconoMovil,
} as const;

export default async function SistemaParqueoPage() {
  const { zonas, resumen, origen } = await cargarParqueo();

  return (
    <>
      <Cabecera />

      {/* Encabezado de sección */}
      <section className="seccion-azul">
        <div className="contenedor py-16 lg:py-20">
          <p className="antetitulo !text-gold-soft">SISTEMA DE PARQUEO</p>
          <h1 className="mt-4 text-3xl leading-[1.15] font-extrabold text-white sm:text-4xl lg:text-5xl">
            PARQUEO INTELIGENTE DE LA INSTITUCIÓN
          </h1>
          <p className="mt-5 max-w-3xl text-[16px] leading-relaxed text-white/80 lg:text-lg">
            Control de acceso vehicular con reconocimiento de placas, detección de
            ocupación plaza por plaza y trazabilidad completa de cada movimiento en
            las cuatro zonas de estacionamiento del campus.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn btn-hero">
              <IconoGrafico />
              ABRIR EL PANEL
            </Link>
            <Link
              href="/login"
              className="btn border border-white/40 text-white hover:bg-white hover:text-marine"
            >
              <IconoLlave />
              ACCEDER AL SISTEMA
            </Link>
          </div>

          {origen === "demo" ? (
            <p className="mt-6 inline-block border border-gold/60 bg-gold/10 px-4 py-2 font-heading text-[13px] text-gold-soft">
              Vista con datos de demostración. Conéctate a Supabase para ver
              información en vivo.
            </p>
          ) : null}
        </div>
      </section>

      {/* Estado actual en números */}
      <Seccion fondo="dorado">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Dato valor={resumen.total} etiqueta="Espacios registrados" />
          <Dato valor={resumen.libres} etiqueta="Espacios disponibles" />
          <Dato valor={resumen.ocupados} etiqueta="Espacios ocupados" />
          <Dato valor={`${resumen.ocupacionPct}%`} etiqueta="Ocupación actual" />
        </div>
      </Seccion>

      {/* Zonas del campus */}
      <Seccion
        titulo="ZONAS DE ESTACIONAMIENTO"
        antetitulo="DISTRIBUCIÓN DEL CAMPUS"
        fondo="blanco"
      >
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {zonas.map((zona) => {
            const propio = resumen.total
              ? Math.round((zona.capacidad_maxima / resumen.total) * 100)
              : 0;
            return (
              <article key={zona.id} className="tarjeta p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-heading text-xs font-bold text-gold-deep">
                    {zona.codigo}
                  </span>
                  <span className="font-heading text-xs font-semibold text-marine/60">
                    {propio}% del total
                  </span>
                </div>
                <h3 className="mt-2 font-heading text-lg leading-tight font-bold text-marine">
                  {zona.nombre}
                </h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink/70">
                  {zona.descripcion}
                </p>
                <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
                  <span>
                    <span className="block font-heading text-2xl leading-none font-extrabold text-marine">
                      {zona.capacidad_maxima}
                    </span>
                    <span className="mt-1 block text-[12px] text-ink/60">
                      plazas
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-heading text-sm font-bold text-marine-deep">
                      {zona.umbral_alerta_pct}%
                    </span>
                    <span className="mt-1 block text-[12px] text-ink/60">
                      umbral de alerta
                    </span>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </Seccion>

      {/* Los 13 módulos */}
      <Seccion
        titulo="MÓDULOS DEL SISTEMA"
        antetitulo="TRECE MÓDULOS"
        fondo="gris"
      >
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map((modulo) => {
            const Icono = ICONOS[modulo.icono as keyof typeof ICONOS] ?? IconoBandeja;
            const estado = ETIQUETA_ESTADO[modulo.estado];
            const contenido = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center bg-gold text-xl text-marine-deep">
                    <Icono />
                  </span>
                  <span
                    className={`px-2.5 py-1 font-heading text-[11px] font-semibold ${estado.clase}`}
                  >
                    {estado.texto}
                  </span>
                </div>

                <p className="mt-4 font-heading text-[11px] font-bold text-gold-deep">
                  MÓDULO {String(modulo.numero).padStart(2, "0")}
                </p>
                <h3 className="mt-1 font-heading text-base leading-tight font-bold text-marine">
                  {modulo.nombre}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink/75">
                  {modulo.resumen}
                </p>

                {modulo.tablas.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {modulo.tablas.map((tabla) => (
                      <li
                        key={tabla}
                        className="border border-line bg-white px-2 py-0.5 font-mono text-[10px] text-slate"
                      >
                        {tabla}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            );

            return modulo.ruta ? (
              <Link
                key={modulo.numero}
                href={modulo.ruta}
                className="tarjeta block p-6 transition-shadow hover:shadow-lg"
              >
                {contenido}
              </Link>
            ) : (
              <article key={modulo.numero} className="tarjeta p-6">
                {contenido}
              </article>
            );
          })}
        </div>
      </Seccion>

      {/* Objetivos métricos */}
      <Seccion
        fondo="azul"
        titulo="OBJETIVOS DEL PROYECTO"
        tituloClaro
        antetitulo="RESULTADOS ESPERADOS"
      >
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {OBJETIVOS.map((objetivo) => (
            <div key={objetivo.etiqueta}>
              <p className="font-heading text-5xl leading-none font-extrabold text-gold-copy">
                {objetivo.valor}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-white/85">
                {objetivo.etiqueta}
              </p>
              <p className="mt-3 font-mono text-[11px] text-white/45">
                {objetivo.fuente}
              </p>
            </div>
          ))}
        </div>
      </Seccion>

      {/* Seguridad por diseño */}
      <Seccion
        titulo="SEGURIDAD POR DISEÑO"
        antetitulo="LO QUE EL SISTEMA NO PERMITE"
        fondo="blanco"
      >
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {PRINCIPIOS.map((principio) => (
            <Tarjeta
              key={principio.titulo}
              titulo={principio.titulo}
              icono={<IconoEscudo />}
            >
              {principio.texto}
            </Tarjeta>
          ))}
        </div>
      </Seccion>

      {/* Call to action */}
      <Seccion fondo="dorado">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <h2 className="titulo-seccion !text-marine-deep">
              CONSULTE LA DISPONIBILIDAD AHORA
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] text-ink/75">
              El panel muestra las 116 plazas en tiempo real, con filtros por zona y
              estado, y el detalle de cada vehículo estacionado.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn btn-azul">
              <IconoGrafico />
              VER EL PANEL
            </Link>
            <Link href="/login" className="btn btn-linea">
              <IconoLlave />
              INGRESAR
            </Link>
          </div>
        </div>
      </Seccion>

      <Pie />
    </>
  );
}
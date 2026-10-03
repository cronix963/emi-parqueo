import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Bloques de página compartidos, derivados de los patrones de SPPageBuilder
 * que usa emi.edu.bo: título de sección a la izquierda, tarjetas overlay con
 * imagen y color sólido, y secciones con fondo blanco, dorado o azul.
 */

type Fondo = "blanco" | "dorado" | "azul" | "gris" | "mista";

export function Seccion({
  titulo,
  antetitulo,
  fondo = "blanco",
  children,
  className = "",
  tituloClaro = false,
}: {
  titulo?: string;
  antetitulo?: string;
  fondo?: Fondo;
  children: ReactNode;
  className?: string;
  tituloClaro?: boolean;
}) {
  const clases =
    fondo === "dorado"
      ? "seccion-dorada"
      : fondo === "azul"
        ? "seccion-azul seccion"
        : fondo === "gris"
          ? "seccion-gris seccion"
          : fondo === "mista"
            ? "seccion"
            : "seccion bg-white";

  return (
    <section className={`${clases} ${className}`}>
      <div className="contenedor">
        {antetitulo ? (
          <p
            className={`antetitulo mb-3 ${tituloClaro ? "text-gold-soft" : ""}`}
          >
            {antetitulo}
          </p>
        ) : null}

        {titulo ? (
          <h2
            className={`titulo-seccion ${tituloClaro ? "text-white" : ""} ${
              antetitulo ? "mt-0" : ""
            }`}
          >
            {titulo}
          </h2>
        ) : null}

        {children}
      </div>
    </section>
  );
}

export interface TarjetaOverlayProps {
  titulo: string;
  subtitulo: string;
  href: string;
  /** Color del overlay sólido (idéntico a .overlay-background-style). */
  overlay: string;
  overlayHover?: string;
  tituloClaro?: boolean;
  subtituloClaro?: boolean;
  /** Fondo detrás de la imagen; por defecto un degradado de la paleta. */
  fondo?: string;
  cta?: string;
}

/**
 * Tarjeta con imagen de fondo y overlay de color sólido. El hover atenúa el
 * overlay, como .overlay-background-style:hover del sitio.
 */
export function TarjetaOverlay({
  titulo,
  subtitulo,
  href,
  overlay,
  overlayHover,
  tituloClaro,
  subtituloClaro,
  fondo = "linear-gradient(135deg,#0d3669 0%,#164385 100%)",
  cta,
}: TarjetaOverlayProps) {
  return (
    <Link href={href} className="tarjeta-overlay group">
      <div className="absolute inset-0" style={{ background: fondo }} />
      <div
        className="overlay-capa group-hover:opacity-75"
        style={{ background: overlay, transition: "background-color .25s ease, opacity .25s ease" }}
      />
      <div
        className="overlay-capa opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: overlayHover ?? overlay }}
      />
      <div className="overlay-contenido">
        <h3
          className={`overlay-titulo ${tituloClaro ? "!text-white" : ""}`}
        >
          {titulo}
        </h3>
        <p
          className={`overlay-subtitulo ${
            subtituloClaro ? "!text-white/75" : "!text-marine"
          }`}
        >
          {subtitulo}
        </p>
        {cta ? (
          <span className="btn btn-dorado mt-4 self-start !py-2.5 !text-[13px] font-semibold">
            {cta}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

/** Tarjeta de contenido simple sobre fondo blanco, con borde y sombra. */
export function Tarjeta({
  icono,
  titulo,
  children,
  className = "",
}: {
  icono?: ReactNode;
  titulo: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <article className={`tarjeta p-6 ${className}`}>
      {icono ? (
        <span className="mb-4 grid h-11 w-11 place-items-center bg-gold text-xl text-marine-deep">
          {icono}
        </span>
      ) : null}
      <h3 className="font-heading text-lg leading-tight font-bold text-marine">
        {titulo}
      </h3>
      {children ? (
        <div className="mt-2.5 text-[14px] leading-relaxed text-ink/75">
          {children}
        </div>
      ) : null}
    </article>
  );
}

/** Dato numérico para los bloques de estadísticas. */
export function Dato({
  valor,
  etiqueta,
  claro = false,
}: {
  valor: string | number;
  etiqueta: string;
  claro?: boolean;
}) {
  return (
    <div>
      <p
        className={`font-heading text-4xl leading-none font-extrabold ${
          claro ? "text-gold-copy" : "text-marine"
        }`}
      >
        {valor}
      </p>
      <p
        className={`mt-2 font-heading text-[13px] leading-snug ${
          claro ? "text-white/75" : "text-ink/70"
        }`}
      >
        {etiqueta}
      </p>
    </div>
  );
}

/** Enlace con flecha, usado al pie de las secciones. */
export function EnlaceSeccion({
  href,
  children,
  claro = false,
}: {
  href: string;
  children: ReactNode;
  claro?: boolean;
}) {
  const esInterna = href.startsWith("/");
  return (
    <Link
      href={href}
      target={esInterna ? undefined : "_blank"}
      rel={esInterna ? undefined : "noopener noreferrer"}
      className={`inline-flex items-center gap-2 font-heading text-[15px] font-semibold transition-colors ${
        claro ? "text-gold-copy hover:text-white" : "text-marine hover:text-gold-deep"
      }`}
    >
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  );
}
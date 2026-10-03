import type { Metadata } from "next";
import { Cabecera } from "@/components/emi/cabecera";
import { Pie } from "@/components/emi/pie";
import { Portada } from "@/components/emi/portada";
import {
  Dato,
  EnlaceSeccion,
  Seccion,
  TarjetaOverlay,
} from "@/components/emi/bloques";

export const metadata: Metadata = {
  title: "Inicio | Escuela Militar de Ingeniería",
  description:
    "Universidad líder en la formación de profesionales caracterizados por su responsabilidad social, liderazgo y disciplina. Sistema de parqueo inteligente.",
};

const OFERTA = [
  {
    titulo: "SISTEMA DE PARQUEO",
    subtitulo: "Control de acceso vehicular y disponibilidad de espacios",
    href: "/sistema-parqueo",
    overlay: "#dfeaf8",
    overlayHover: "rgba(223,234,248,0.75)",
    fondo: "linear-gradient(135deg,#164385 0%,#0d3669 100%)",
    cta: "CONOCER EL SISTEMA",
  },
  {
    titulo: "ADMISIÓN",
    subtitulo: "Prepárate para iniciar tu vida universitaria",
    href: "https://www.emi.edu.bo/universidad/admision",
    overlay: "#fcd94e",
    overlayHover: "rgba(255,221,0,0.7)",
    fondo: "linear-gradient(135deg,#0d3669 0%,#113255 100%)",
  },
  {
    titulo: "LICENCIATURA",
    subtitulo: "Nuestras carreras de ingeniería",
    href: "https://www.emi.edu.bo/universidad/licenciatura",
    overlay: "#004f9f",
    overlayHover: "rgba(0,79,159,0.75)",
    tituloClaro: true,
    subtituloClaro: true,
    fondo: "linear-gradient(135deg,#003d7c 0%,#0d3669 100%)",
  },
  {
    titulo: "POSGRADO",
    subtitulo: "Conoce nuestros programas posgraduales",
    href: "https://www.emi.edu.bo/universidad/posgrado",
    overlay: "#003d7c",
    overlayHover: "rgba(0,61,124,0.75)",
    tituloClaro: true,
    subtituloClaro: true,
    fondo: "linear-gradient(135deg,#113255 0%,#164385 100%)",
  },
];

const NOTICIAS = [
  {
    fecha: "02 SEP 2026",
    titulo: "116 plazas Operativas en el sistema de parqueo",
    resumen:
      "Las cuatro zonas del campus quedan conectadas al panel de monitoreo con verificación de ocupación en tiempo real.",
  },
  {
    fecha: "28 AGO 2026",
    titulo: "Ingreso vehicular sin intervención humana",
    resumen:
      "La barrera de acceso norte reconoce la placa y registra el movimiento automáticamente.",
  },
  {
    fecha: "19 AGO 2026",
    titulo: "Bitácora de auditoría inmutable por diseño",
    resumen:
      "Cada acción sobre datos sensibles queda registrada y no puede modificarse ni eliminarse.",
  },
];

const UNIDADES = [
  { titulo: "LA PAZ", url: "https://emi.edu.bo/universidad/unidades-academicas/lapaz" },
  { titulo: "SANTA CRUZ", url: "https://emi.edu.bo/universidad/unidades-academicas/santacruz" },
  { titulo: "COCHABAMBA", url: "https://emi.edu.bo/universidad/unidades-academicas/cochabamba" },
  { titulo: "RIBERALTA", url: "https://emi.edu.bo/universidad/unidades-academicas/riberalta" },
  { titulo: "TRÓPICO", url: "https://emi.edu.bo/universidad/unidades-academicas/tropico" },
];

export default function Inicio() {
  return (
    <>
      <Cabecera />
      <Portada />

      {/* Oferta: la primera tarjeta es el Sistema de Parqueo */}
      <Seccion fondo="blanco">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {OFERTA.map((item) => (
            <TarjetaOverlay key={item.titulo} {...item} />
          ))}
        </div>
      </Seccion>

      {/* Noticias */}
      <Seccion titulo="NOTICIAS" fondo="gris">
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {NOTICIAS.map((noticia) => (
            <article key={noticia.titulo} className="tarjeta flex flex-col p-6">
              <p className="font-heading text-xs font-semibold text-gold-deep">
                {noticia.fecha}
              </p>
              <h3 className="mt-3 font-heading text-xl leading-tight font-bold text-marine-deep">
                {noticia.titulo}
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-graphite">
                {noticia.resumen}
              </p>
              <EnlaceSeccion href="/sistema-parqueo">VER MÁS</EnlaceSeccion>
            </article>
          ))}
        </div>
      </Seccion>

      {/* Unidades académicas, a sangre completa */}
      <section className="grid lg:grid-cols-2">
        <TarjetaUnidad titulo="LA PAZ" url={UNIDADES[0].url} gradiente="linear-gradient(135deg,#164385 0%,#0d3669 100%)" />
        <TarjetaUnidad titulo="SANTA CRUZ" url={UNIDADES[1].url} gradiente="linear-gradient(135deg,#0d3669 0%,#113255 100%)" />
      </section>
      <section className="grid lg:grid-cols-3">
        {UNIDADES.slice(2).map((unidad) => (
          <TarjetaUnidad
            key={unidad.titulo}
            titulo={unidad.titulo}
            url={unidad.url}
            gradiente="linear-gradient(135deg,#113255 0%,#164385 100%)"
            compacto
          />
        ))}
      </section>

      {/* Franja dorada de cifras */}
      <Seccion fondo="dorado">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Dato valor={116} etiqueta="Espacios de estacionamiento" />
          <Dato valor={4} etiqueta="Zonas Operativas" />
          <Dato valor={24} etiqueta="Tablas de Base de Datos" />
          <Dato valor={39} etiqueta="Políticas de Seguridad RLS" />
        </div>
      </Seccion>

      {/* Video institucional replaced por el acceso al sistema */}
      <Seccion titulo="SISTEMA DE PARQUEO INTELIGENTE" fondo="azul" tituloClaro>
        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[17px] leading-relaxed text-white/85">
              El sistema automatiza el control de ingreso, reconoce placas mediante
              cámaras ANPR y reporta la ocupación de cada plaza con visión artificial.
              Todo queda registrado en una base de datos con auditoría inmutable y
              acceso por roles.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/dashboard" className="btn btn-hero">
                ABRIR EL PANEL
              </a>
              <a
                href="/sistema-parqueo"
                className="btn border border-white/40 text-white hover:bg-white hover:text-marine"
              >
                VER MÓDULOS
              </a>
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              "Acceso vehicular con barrera",
              "Reconocimiento de placas ANPR",
              "Ocupación por plaza",
              "Alertas y notificaciones",
              "Historial y trazabilidad",
              "Reportes y estadísticas",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 border border-white/15 px-4 py-3 text-sm text-white/90"
              >
                <span className="h-1.5 w-1.5 shrink-0 bg-gold" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Seccion>

      <Pie />
    </>
  );
}

function TarjetaUnidad({
  titulo,
  url,
  gradiente,
  compacto = false,
}: {
  titulo: string;
  url: string;
  gradiente: string;
  compacto?: boolean;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-end overflow-hidden"
      style={{ minHeight: compacto ? "380px" : "420px" }}
    >
      <div
        className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
        style={{ background: gradiente }}
      />
      <div className="trama-diagonal absolute inset-0 opacity-50" />
      <div className="mask-autoridad absolute inset-0" />
      <span className="relative z-10 p-10 font-heading text-4xl leading-none font-extrabold text-white transition-colors group-hover:text-gold-copy lg:text-5xl">
        {titulo}
      </span>
    </a>
  );
}
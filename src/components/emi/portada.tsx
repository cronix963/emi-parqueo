"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { IconoAuto, IconoBandeja, IconoGrafico, IconoReloj } from "./iconos";

/**
 * Portada animada. Replica el slider de la home de emi.edu.bo: transición
 * fade, autoplay de 10 s, altura 840/600/450/470/385 px según breakpoint e
 * indicadores de línea (20 px inactivo → 60 px activo, dorado).
 *
 * El sitio original usa fotografías del campus; aquí se usan fondos de la
 * paleta institucional para no depender de recursos externos.
 */

interface Slide {
  antetitulo: string;
  titulo: string;
  texto: string;
  cta: { etiqueta: string; href: string };
  fondo: string;
}

const SLIDES: Slide[] = [
  {
    antetitulo: "SISTEMA DE PARQUEO",
    titulo: "CONSULTA TU ESPACIO EN TIEMPO REAL",
    texto:
      "116 plazas distribuidas en cuatro zonas del campus, con control de acceso vehicular y monitoreo permanente.",
    cta: { etiqueta: "VER DISPONIBILIDAD", href: "/dashboard" },
    fondo: "linear-gradient(135deg,#0d3669 0%,#164385 45%,#003d7c 100%)",
  },
  {
    antetitulo: "INGRESO AUTOMÁTICO",
    titulo: "EL CONTROL DE INGRESO MÁS RÁPIDO DE LA INSTITUCIÓN",
    texto:
      "La barrera se abre en segundos: el sistema reconoce la placa y registra el ingreso sin intervención humana.",
    cta: { etiqueta: "CONOCER EL SISTEMA", href: "/sistema-parqueo" },
    fondo: "linear-gradient(135deg,#113255 0%,#0d3669 50%,#164385 100%)",
  },
  {
    antetitulo: "VISIÓN ARTIFICIAL",
    titulo: "DETECCIÓN DE OCUPACIÓN PLAZA POR PLAZA",
    texto:
      "Cada plaza reporta su estado con nivel de confianza, condiciones climáticas y evidencia fotográfica referenciada.",
    cta: { etiqueta: "ABRIR EL PANEL", href: "/dashboard" },
    fondo: "linear-gradient(135deg,#003d7c 0%,#0d3669 55%,#113255 100%)",
  },
  {
    antetitulo: "ALERTAS Y AUDITORÍA",
    titulo: "TRAZABILIDAD COMPLETA DE CADA MOVIMIENTO",
    texto:
      "Bitácora inmutable, alertas con deduplicación y reportes para las decisiones de la institución.",
    cta: { etiqueta: "INGRESAR AL SISTEMA", href: "/login" },
    fondo: "linear-gradient(135deg,#164385 0%,#0d3669 60%,#003d7c 100%)",
  },
];

export function Portada() {
  const [indice, setIndice] = useState(0);

  const avanzar = useCallback(
    (paso: number) =>
      setIndice((actual) => (actual + paso + SLIDES.length) % SLIDES.length),
    [],
  );

  useEffect(() => {
    const temporizador = setInterval(() => avanzar(1), 10_000);
    return () => clearInterval(temporizador);
  }, [avanzar]);

  const slide = SLIDES[indice];

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Slide activo */}
      <div
        className="relative h-[385px] transition-[height] duration-300 sm:h-[470px] md:h-[450px] lg:h-[600px] xl:h-[840px]"
      >
        {SLIDES.map((item, i) => (
          <div
            key={item.titulo}
            aria-hidden={i !== indice}
            className="absolute inset-0 transition-opacity duration-700"
            style={{
              opacity: i === indice ? 1 : 0,
              background: item.fondo,
            }}
          />
        ))}

        {/* Trama diagonal sutil para dar profundidad al degradado */}
        <div className="trama-diagonal absolute inset-0 opacity-60" />

        <div className="mask-hero absolute inset-0" />

        {/* Contenido: ancho 90% con margen auto, como el slider original */}
        <div className="relative z-10 mx-auto h-full w-[90%] pt-16">
          <div key={indice} className="max-w-3xl">
            <p className="antetitulo anim-entrada !text-gold-soft">
              {slide.antetitulo}
            </p>
            <h1 className="anim-desvanecer mt-4 text-3xl leading-[1.15] font-extrabold text-white sm:text-4xl lg:text-[70px] lg:leading-[1.1]">
              {slide.titulo}
            </h1>
            <p className="anim-sube mt-5 max-w-2xl text-base leading-relaxed text-white/85 lg:text-[25px] lg:leading-[1.4]">
              {slide.texto}
            </p>
            <div className="anim-sube mt-8" style={{ animationDelay: "400ms" }}>
              <Link href={slide.cta.href} className="btn btn-hero">
                <IconoBandeja />
                {slide.cta.etiqueta}
              </Link>
            </div>
          </div>
        </div>

        {/* Flechas (visibles al pasar el mouse, como .sp-nav-control) */}
        <button
          type="button"
          onClick={() => avanzar(-1)}
          aria-label="Anterior"
          className="absolute top-1/2 left-4 hidden -translate-y-1/2 px-3 py-6 text-3xl text-white/20 transition-colors hover:bg-black/10 hover:text-white/75 lg:block"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => avanzar(1)}
          aria-label="Siguiente"
          className="absolute top-1/2 right-4 hidden -translate-y-1/2 px-3 py-6 text-3xl text-white/20 transition-colors hover:bg-black/10 hover:text-white/75 lg:block"
        >
          ›
        </button>

        {/* Indicadores de línea */}
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5 lg:bottom-[60px]">
          {SLIDES.map((item, i) => (
            <button
              key={item.titulo}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Ir a la diapositiva ${i + 1}`}
              aria-current={i === indice}
              className="indicador-linea"
              data-activo={i === indice}
            />
          ))}
        </div>
      </div>

      {/* Franja de accesos rápidos */}
      <div className="seccion-gris">
        <div className="contenedor py-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <AccesoRapido
              icono={<IconoAuto />}
              titulo="116 ESPACIOS"
              texto="Cuatro zonas con verificación en vivo"
            />
            <AccesoRapido
              icono={<IconoReloj />}
              titulo="INGRESO EN SEGUNDOS"
              texto="Lectura de placa y barrera automática"
            />
            <AccesoRapido
              icono={<IconoGrafico />}
              titulo="OCUPACIÓN REAL"
              texto="Reportada por visión artificial"
            />
            <AccesoRapido
              icono={<IconoBandeja />}
              titulo="ALERTAS INMEDIATAS"
              texto="Aviso al personal de seguridad"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function AccesoRapido({
  icono,
  titulo,
  texto,
}: {
  icono: React.ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center bg-gold text-xl text-marine-deep">
        {icono}
      </span>
      <span>
        <span className="block font-heading text-sm font-bold text-marine">
          {titulo}
        </span>
        <span className="mt-0.5 block text-[13px] leading-snug text-ink/70">
          {texto}
        </span>
      </span>
    </div>
  );
}
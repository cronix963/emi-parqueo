"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MENU, REDES } from "@/lib/emi/navegacion";
import {
  ICONOS_REDES,
  IconoCerrar,
  IconoFlechaAbajo,
  IconoFlechaArriba,
  IconoMenu,
} from "./iconos";
import { EmblemaEMI } from "../emblema-emi";

/**
 * Cabecera institucional: replica el header de emi.edu.bo — logo a la
 * izquierda, navegación con dropdown a la derecha, iconos de redes al extremo y
 * offcanvas lateral en móvil. La entrada SISTEMA DE PARQUEO encabeza el menú
 * como enlace interno con el botón dorado del sitio.
 */
export function Cabecera() {
  const [movil, setMovil] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  // Sombra al hacer scroll, como el header sticky de Helix.
  useEffect(() => {
    const alScroll = () => setSubiendo(window.scrollY > 8);
    alScroll();
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => window.removeEventListener("scroll", alScroll);
  }, []);

  // Bloquea el scroll del body con el offcanvas abierto.
  useEffect(() => {
    document.body.style.overflow = movil ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [movil]);

  const esInterna = (href: string) => href.startsWith("/");

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white transition-shadow ${
          subiendo ? "sombra-menu" : "border-b border-line"
        }`}
      >
        <div className="contenedor">
          <div className="flex items-center justify-between gap-4">
            {/* Hamburguesa (solo < lg) */}
            <button
              type="button"
              onClick={() => setMovil(true)}
              aria-label="Abrir menú"
              className="-ml-2 p-2 text-marine lg:hidden"
            >
              <IconoMenu className="text-2xl" />
            </button>

            {/* Logo: alto fluido, 36px fijos en ≤992px como el original */}
            <Link href="/" className="flex shrink-0 items-center gap-3 py-3">
              <EmblemaEMI className="h-9 w-9 lg:h-14 lg:w-14" />
              <span className="hidden lg:block">
                <span className="block font-heading text-[15px] leading-tight font-extrabold text-marine-deep">
                  Escuela Militar de Ingeniería
                </span>
                <span className="block font-heading text-[11px] leading-tight font-medium text-gold-deep">
                  Universidad Militar · La Paz, Bolivia
                </span>
              </span>
            </Link>

            {/* Navegación de escritorio */}
            <nav
              className="hidden items-center lg:flex"
              aria-label="Navegación principal"
            >
              <ul className="flex items-center">
                {MENU.map((entrada) => (
                  <li
                    key={entrada.titulo}
                    className="relative"
                    onMouseEnter={() => setAbierto(entrada.titulo)}
                    onMouseLeave={() => setAbierto(null)}
                  >
                    {entrada.destacado ? (
                      <Link
                        href={entrada.href}
                        className="btn btn-dorado my-2 !py-2.5 !text-[13px] font-semibold"
                      >
                        {entrada.titulo}
                      </Link>
                    ) : (
                      <Link
                        href={entrada.href}
                        target={esInterna(entrada.href) ? undefined : "_blank"}
                        rel={esInterna(entrada.href) ? undefined : "noopener noreferrer"}
                        className="nav-enlace px-3"
                        aria-expanded={abierto === entrada.titulo}
                      >
                        {entrada.titulo}
                        {entrada.hijos?.length ? (
                          <IconoFlechaAbajo className="text-[10px] opacity-70" />
                        ) : null}
                      </Link>
                    )}

                    {entrada.hijos?.length && abierto === entrada.titulo ? (
                      <div className="absolute top-full left-0 z-50 w-[300px] bg-white">
                        <div className="sombra-menu">
                          <ul>
                            {entrada.hijos.map((hijo) => (
                              <li key={hijo.titulo}>
                                <Link
                                  href={hijo.href}
                                  target={
                                    esInterna(hijo.href) ? undefined : "_blank"
                                  }
                                  rel={
                                    esInterna(hijo.href) ? undefined : "noopener noreferrer"
                                  }
                                  className="dropdown-item"
                                >
                                  {hijo.titulo}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Redes sociales */}
            <ul className="hidden items-center gap-3 text-marine lg:flex">
              {REDES.map((red) => {
                const Icono = ICONOS_REDES[red.icono];
                return (
                  <li key={red.nombre}>
                    <a
                      href={red.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={red.nombre}
                      title={red.nombre}
                      className="block text-[15px] transition-colors hover:text-gold-deep"
                    >
                      <Icono />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </header>

      {/* Offcanvas móvil */}
      {movil ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMovil(false)}
            className="absolute inset-0 bg-marine/60"
          />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-[340px] flex-col bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="flex items-center gap-2">
                <EmblemaEMI className="h-9 w-9" />
                <span className="font-heading text-sm font-extrabold text-marine">
                  EMI
                </span>
              </span>
              <button
                type="button"
                onClick={() => setMovil(false)}
                aria-label="Cerrar menú"
                className="p-1 text-marine"
              >
                <IconoCerrar className="text-xl" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-5 py-4">
              <ul>
                {MENU.map((entrada) => (
                  <li key={entrada.titulo} className="border-b border-line/70">
                    <div className="flex items-center justify-between">
                      <Link
                        href={entrada.href}
                        onClick={() => setMovil(false)}
                        className="flex-1 py-4 font-heading text-[17px] text-marine"
                      >
                        {entrada.titulo}
                      </Link>
                      {entrada.hijos?.length ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSub(sub === entrada.titulo ? null : entrada.titulo)
                          }
                          aria-label={`Ver ${entrada.titulo}`}
                          aria-expanded={sub === entrada.titulo}
                          className="p-3 text-marine"
                        >
                          <IconoFlechaAbajo
                            className={`text-sm transition-transform ${
                              sub === entrada.titulo ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      ) : null}
                    </div>

                    {entrada.hijos?.length && sub === entrada.titulo ? (
                      <ul className="pb-3">
                        {entrada.hijos.map((hijo) => (
                          <li key={hijo.titulo}>
                            <Link
                              href={hijo.href}
                              onClick={() => setMovil(false)}
                              className="block py-2.5 pl-4 text-[15px] text-ink/80"
                            >
                              {hijo.titulo}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </nav>

            <ul className="flex items-center justify-center gap-5 border-t border-line py-4 text-marine">
              {REDES.map((red) => {
                const Icono = ICONOS_REDES[red.icono];
                return (
                  <li key={red.nombre}>
                    <a
                      href={red.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={red.nombre}
                    >
                      <Icono className="text-lg" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      {/* Volver arriba, como el .sp-scroll-up del sitio */}
      <a
        href="#top"
        aria-label="Volver arriba"
        className="fixed right-5 bottom-5 z-40 grid h-11 w-11 place-items-center bg-marine text-white transition-colors hover:bg-gold hover:text-marine-deep"
      >
        <IconoFlechaArriba className="text-lg" />
      </a>
    </>
  );
}
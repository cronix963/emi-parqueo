import Link from "next/link";
import { CONTACTO, PAGINAS_RELACIONADAS, UNIDADES } from "@/lib/emi/navegacion";
import {
  ICONOS_REDES,
  IconoCorreo,
  IconoMovil,
  IconoTelefono,
} from "./iconos";
import { EmblemaEMI } from "../emblema-emi";

/**
 * Pie institucional. Replica la estructura de #sp-footer de emi.edu.bo: dos
 * columnas (links a la izquierda, contacto a la derecha) y el copyright en
 * dorado dentro de la primera columna, sin barra inferior separada.
 */
export function Pie() {
  return (
    <footer className="seccion-azul text-white">
      <div className="contenedor py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Columna 1: bloques de links + copyright */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <EmblemaEMI className="h-12 w-12" />
              <span>
                <span className="block font-heading text-lg leading-tight font-extrabold text-white">
                  Escuela Militar de Ingeniería
                </span>
                <span className="block font-heading text-xs text-gold-copy">
                  EMI Central · La Paz, Bolivia
                </span>
              </span>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <Bloque titulo="EMI Central">
                <li>
                  <a
                    href={CONTACTO.mapa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-enlace"
                  >
                    {CONTACTO.direccion}
                  </a>
                </li>
                <li>
                  <Link href="/sistema-parqueo" className="footer-enlace">
                    Sistema de Parqueo
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="footer-enlace">
                    Panel de monitoreo
                  </Link>
                </li>
                <li>
                  <a href="/login" className="footer-enlace">
                    Acceso al sistema
                  </a>
                </li>
              </Bloque>

              <Bloque titulo="Unidades Académicas">
                {UNIDADES.map((unidad) => (
                  <li key={unidad.nombre}>
                    <a
                      href={unidad.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-enlace"
                    >
                      {unidad.nombre}
                    </a>
                  </li>
                ))}
              </Bloque>
            </div>

            <Bloque titulo="Páginas relacionadas" className="mt-8">
              {PAGINAS_RELACIONADAS.map((pagina) => (
                <li key={pagina.nombre}>
                  <a
                    href={pagina.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-enlace"
                  >
                    {pagina.nombre}
                  </a>
                </li>
              ))}
            </Bloque>

            <p className="mt-10 text-sm leading-relaxed text-gold-copy">
              {new Date().getFullYear()} © Escuela Militar de Ingeniería
              <br />
              <span className="text-gold-copy/70">
                Sistema de Parqueo Inteligente · La Paz, Bolivia
              </span>
            </p>
          </div>

          {/* Columna 2: contacto */}
          <div>
            <h3 className="font-heading text-lg font-extrabold text-white">
              CONTACTO
            </h3>
            <ul className="mt-5 space-y-4 text-[15px]">
              <li className="flex items-start gap-3">
                <IconoTelefono className="mt-1 shrink-0 text-lg text-gold-copy" />
                <a
                  href={CONTACTO.telefonoEnlace}
                  className="transition-colors hover:text-gold-copy"
                >
                  {CONTACTO.telefono}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <IconoMovil className="mt-1 shrink-0 text-lg text-gold-copy" />
                <a
                  href={CONTACTO.movilEnlace}
                  className="transition-colors hover:text-gold-copy"
                >
                  {CONTACTO.movil}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <IconoCorreo className="mt-1 shrink-0 text-lg text-gold-copy" />
                <a
                  href={`mailto:${CONTACTO.correo}`}
                  className="transition-colors hover:text-gold-copy"
                >
                  {CONTACTO.correo}
                </a>
              </li>
            </ul>

            <h3 className="mt-10 font-heading text-lg font-extrabold text-white">
              REDES SOCIALES
            </h3>
            <ul className="mt-4 flex items-center gap-4">
              {[
                ["facebook", "https://www.facebook.com/EMIBoliviaPaginaOficial"],
                ["x", "https://x.com/EMI_Bolivia_"],
                ["youtube", "https://www.youtube.com/@EMI_Bolivia"],
                ["linkedin", "https://bo.linkedin.com/school/emi-bolivia/"],
                ["instagram", "https://www.instagram.com/emi.bolivia/"],
                ["tiktok", "https://www.tiktok.com/@emi_bolivia"],
              ].map(([clave, url]) => {
                const Icono = ICONOS_REDES[clave as keyof typeof ICONOS_REDES];
                return (
                  <li key={clave}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid h-9 w-9 place-items-center border border-white/25 text-white transition-colors hover:border-gold hover:bg-gold hover:text-marine-deep"
                    >
                      <Icono className="text-sm" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Bloque({
  titulo,
  children,
  className = "",
}: {
  titulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h4 className="font-heading text-base font-semibold text-white">
        {titulo}
      </h4>
      <ul className="mt-3 space-y-2 text-[15px]">{children}</ul>
    </div>
  );
}
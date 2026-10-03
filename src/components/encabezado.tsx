import Link from "next/link";
import { cookies } from "next/headers";
import { EmblemaEMI } from "@/components/emblema-emi";
import { IconoCerrar, IconoMenu } from "@/components/emi/iconos";
import { cerrarSesion } from "@/app/login/acciones";
import { COOKIE_DEMO } from "@/lib/auth-cookies";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

interface Props {
  origen: "supabase" | "demo";
  actualizado: string;
  libres: number;
}

/**
 * Barra superior del panel operativo: versión compacta de la cabecera
 * institucional, con el estado del sistema y la sesión del usuario.
 */
export async function Encabezado({ origen, actualizado, libres }: Props) {
  let nombre = "Usuario EMI";
  let correo = "";
  let foto: string | null = null;

  const almacen = await cookies();
  const esDemo = Boolean(almacen.get(COOKIE_DEMO)?.value) || !isSupabaseConfigured();

  if (!esDemo && isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      nombre =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email?.split("@")[0] ??
        "Usuario EMI";
      correo = user.email ?? "";
      foto = (user.user_metadata?.avatar_url as string | undefined) ?? null;
    }
  } else {
    nombre = "Cabo Demo";
    correo = "demo@emi.bo";
  }

  const iniciales = nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="contenedor">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <EmblemaEMI className="h-10 w-10 lg:h-12 lg:w-12" />
            <span className="hidden sm:block">
              <span className="block font-heading text-[13px] leading-tight font-extrabold text-marine-deep">
                Sistema de Parqueo
              </span>
              <span className="block font-heading text-[11px] leading-tight text-gold-deep">
                Escuela Militar de Ingeniería
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Plazas disponibles */}
            <span
              className={`hidden items-center gap-2 px-3 py-1.5 font-heading text-xs font-semibold sm:flex ${
                libres > 0 ? "bg-libre/15 text-libre" : "bg-ocupado/15 text-ocupado"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  libres > 0 ? "bg-libre" : "bg-ocupado"
                }`}
              />
              {libres} disponibles
            </span>

            {origen === "demo" ? (
              <span className="bg-gold/30 px-3 py-1.5 font-heading text-xs font-semibold text-gold-deep">
                Datos demo
              </span>
            ) : null}

            <span className="hidden text-[12px] text-ink/55 xl:block">
              Actualizado {actualizado}
            </span>

            {/* Navegación del panel */}
            <nav className="hidden items-center gap-1 border-l border-line pl-3 md:flex">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 font-heading text-[13px] font-semibold text-marine transition-colors hover:text-gold-deep"
              >
                Panel
              </Link>
              <Link
                href="/sistema-parqueo"
                className="px-3 py-1.5 font-heading text-[13px] font-semibold text-marine transition-colors hover:text-gold-deep"
              >
                Módulos
              </Link>
              <Link
                href="/"
                className="px-3 py-1.5 font-heading text-[13px] font-semibold text-marine transition-colors hover:text-gold-deep"
              >
                Inicio
              </Link>
            </nav>

            <div className="flex items-center gap-2 border-l border-line pl-3">
              {foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={foto}
                  alt=""
                  className="h-8 w-8 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="grid h-8 w-8 place-items-center bg-marine font-heading text-xs font-bold text-white">
                  {iniciales || "EM"}
                </span>
              )}
              <span className="hidden max-w-[160px] lg:block">
                <span className="block truncate font-heading text-xs font-semibold text-marine">
                  {nombre}
                </span>
                <span className="block truncate text-[11px] text-ink/55">{correo}</span>
              </span>
              <form action={cerrarSesion}>
                <button
                  type="submit"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                  className="p-1.5 text-marine transition-colors hover:text-ocupado"
                >
                  <IconoCerrar className="text-base" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/** Entrada al panel desde la página del sistema, para pantallas estrechas. */
export function EnlacePanelMovil() {
  return (
    <Link
      href="/dashboard"
      className="btn btn-dorado w-full justify-center md:hidden"
    >
      <IconoMenu />
      ABRIR EL PANEL
    </Link>
  );
}
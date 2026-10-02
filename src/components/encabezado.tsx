import Link from "next/link";
import { cookies } from "next/headers";
import { EmblemaEMI } from "@/components/emblema-emi";
import { cerrarSesion } from "@/app/login/acciones";
import { COOKIE_DEMO } from "@/lib/auth-cookies";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

interface Props {
  origen: "supabase" | "demo";
  actualizado: string;
  libres: number;
}

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
    <header className="sticky top-0 z-20 border-b border-emi-800/70 bg-emi-950/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <EmblemaEMI className="h-10 w-10 shrink-0" />
          <span className="hidden sm:block">
            <span className="block text-[10px] font-semibold tracking-[0.3em] text-emi-gold-400 uppercase">
              Escuela Militar de Ingeniería
            </span>
            <span className="block text-sm font-semibold text-white">
              Parqueo Automático
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <span
            className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:flex ${
              libres > 0
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/40 bg-red-500/10 text-red-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${libres > 0 ? "anim-pulse-ring bg-emerald-400" : "bg-red-400"}`}
            />
            {libres} disponibles
          </span>

          {origen === "demo" ? (
            <span className="rounded-full border border-emi-gold-500/50 bg-emi-gold-500/10 px-3 py-1.5 text-xs font-medium text-emi-gold-300">
              Datos demo
            </span>
          ) : null}

          <span className="hidden text-xs text-emi-500 md:block">
            Actualizado {actualizado}
          </span>

          <div className="flex items-center gap-2 border-l border-emi-800 pl-3">
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={foto}
                alt=""
                className="h-8 w-8 rounded-full border border-emi-600"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-emi-700 text-xs font-bold text-emi-gold-300">
                {iniciales || "EM"}
              </span>
            )}
            <span className="hidden max-w-[160px] sm:block">
              <span className="block truncate text-xs font-semibold text-white">
                {nombre}
              </span>
              <span className="block truncate text-[11px] text-emi-500">{correo}</span>
            </span>
            <form action={cerrarSesion}>
              <button
                type="submit"
                className="rounded-lg border border-emi-700 px-3 py-1.5 text-xs text-emi-300 transition hover:border-red-500/60 hover:text-red-300"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}

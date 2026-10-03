import Link from "next/link";
import { EmblemaEMI } from "@/components/emblema-emi";
import { LoginForm } from "@/components/login-form";
import { IconoAuto, IconoGrafico, IconoLlave } from "@/components/emi/iconos";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const MODO_DESARROLLO = !SITE_KEY || SITE_KEY.includes("TU_SITE_KEY");

export const metadata = {
  title: "Acceso al sistema",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; aviso?: string }>;
}) {
  const { error, aviso } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col bg-cloud/40 lg:flex-row">
      {/* Panel institucional */}
      <section className="seccion-azul relative flex flex-col justify-between overflow-hidden px-6 py-10 lg:w-[46%] lg:px-14 lg:py-14">
        <div className="trama-diagonal absolute inset-0 opacity-50" />

        <div className="relative flex items-center gap-4">
          <EmblemaEMI className="h-14 w-14 shrink-0" />
          <div>
            <p className="font-heading text-[11px] font-semibold text-gold-soft">
              ESCUELA MILITAR DE INGENIERÍA
            </p>
            <p className="mt-1 font-heading text-sm text-white/80">
              Sistema de Parqueo Inteligente
            </p>
          </div>
        </div>

        <div className="relative mt-12 max-w-lg lg:mt-0">
          <h1 className="text-3xl leading-[1.15] font-extrabold text-white lg:text-4xl">
            ACCESO INSTITUCIONAL
            <br />
            <span className="text-gold-copy">AL SISTEMA DE PARQUEO</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-white/80">
            Autenticación mediante Google Workspace y verificación anti‑robots con
            Cloudflare Turnstile. Cinco intentos fallidos bloquean la cuenta de forma
            temporal.
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-4">
            {[
              { k: "Zonas", v: "4", i: <IconoAuto /> },
              { k: "Espacios", v: "116", i: <IconoGrafico /> },
              { k: "Acceso", v: "24/7", i: <IconoLlave /> },
            ].map((s) => (
              <div key={s.k} className="border border-white/20 px-4 py-3">
                <dt className="flex items-center gap-2 font-heading text-[11px] text-white/60">
                  <span className="text-sm text-gold-copy">{s.i}</span>
                  {s.k}
                </dt>
                <dd className="mt-1 font-heading text-2xl font-extrabold text-white">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="relative mt-12 text-xs text-white/50 lg:mt-0">
          © {new Date().getFullYear()} Escuela Militar de Ingeniería · La Paz,
          Bolivia
        </p>
      </section>

      {/* Formulario */}
      <section className="flex flex-1 items-center justify-center px-6 py-12 lg:px-10">
        <div className="w-full max-w-md">
          <div className="tarjeta p-7">
            <div className="lg:hidden">
              <EmblemaEMI className="mx-auto h-16 w-16" />
            </div>

            <h2 className="mt-4 text-center font-heading text-2xl font-extrabold text-marine lg:mt-0">
              Iniciar sesión
            </h2>
            <p className="mt-2 text-center text-sm text-ink/60">
              Autenticación institucional mediante Google Workspace
            </p>

            {error ? (
              <p
                role="alert"
                className="mt-5 border-l-4 border-ocupado bg-ocupado/10 px-4 py-3 text-sm text-ocupado"
              >
                {error}
              </p>
            ) : null}
            {aviso ? (
              <p
                role="status"
                className="mt-5 border-l-4 border-gold bg-gold/15 px-4 py-3 text-sm text-gold-deep"
              >
                {aviso}
              </p>
            ) : null}

            <div className="mt-7">
              <LoginForm siteKey={SITE_KEY} modoDesarrollo={MODO_DESARROLLO} />
            </div>
          </div>

          <p className="mt-6 text-center text-[13px] text-ink/60">
            ¿Busca consultar sin iniciar sesión?{" "}
            <Link href="/" className="font-semibold text-marine hover:text-gold-deep">
              Volver al inicio
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
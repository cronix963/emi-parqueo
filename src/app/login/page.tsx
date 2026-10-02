import { EmblemaEMI } from "@/components/emblema-emi";
import { LoginForm } from "@/components/login-form";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const MODO_DESARROLLO = !SITE_KEY || SITE_KEY.includes("TU_SITE_KEY");

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; aviso?: string }>;
}) {
  const { error, aviso } = await searchParams;

  return (
    <main className="bg-emi-mesh flex min-h-dvh flex-col lg:flex-row">
      {/* Panel institucional */}
      <section className="relative flex flex-col justify-between overflow-hidden border-emi-800/60 px-6 py-10 lg:w-[46%] lg:border-r lg:px-14 lg:py-14">
        <div className="flex items-center gap-4">
          <EmblemaEMI className="h-14 w-14 shrink-0" />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.35em] text-emi-gold-400 uppercase">
              Escuela Militar de Ingeniería
            </p>
            <p className="mt-1 text-sm text-emi-300">Sistema de Parqueo Automático</p>
          </div>
        </div>

        <div className="mt-12 max-w-lg lg:mt-0">
          <h1 className="text-4xl leading-[1.1] font-bold text-white lg:text-5xl">
            Estacionamiento
            <br />
            <span className="text-gradient-gold">inteligente</span> y sin filas
          </h1>
          <p className="mt-5 text-emi-200/90">
            Consultá en tiempo real los espacios disponibles de cada zona del
            campus, registrá tu ingreso y localizá tu vehículo con un solo clic.
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-4">
            {[
              { k: "Zonas", v: "4" },
              { k: "Espacios", v: "92" },
              { k: "Acceso", v: "24/7" },
            ].map((s) => (
              <div
                key={s.k}
                className="rounded-xl border border-emi-700/70 bg-emi-900/60 px-4 py-3"
              >
                <dt className="text-[11px] tracking-widest text-emi-400 uppercase">
                  {s.k}
                </dt>
                <dd className="mt-1 text-2xl font-bold text-emi-gold-400">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="mt-12 text-xs text-emi-500 lg:mt-0">
          © {new Date().getFullYear()} Escuela Militar de Ingeniería · La Paz, Bolivia
        </p>
      </section>

      {/* Formulario */}
      <section className="flex flex-1 items-center justify-center px-6 py-12 lg:px-10">
        <div className="w-full max-w-md">
          <div className="panel-emi p-7">
            <div className="lg:hidden">
              <EmblemaEMI className="mx-auto h-16 w-16" />
            </div>

            <h2 className="mt-4 text-center text-2xl font-bold text-white lg:mt-0">
              Iniciar sesión
            </h2>
            <p className="mt-2 text-center text-sm text-emi-300">
              Autenticación institucional mediante Google Workspace
            </p>

            {error ? (
              <p
                role="alert"
                className="mt-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                {error}
              </p>
            ) : null}
            {aviso ? (
              <p
                role="status"
                className="mt-5 rounded-lg border border-emi-gold-500/40 bg-emi-gold-500/10 px-4 py-3 text-sm text-emi-gold-200"
              >
                {aviso}
              </p>
            ) : null}

            <div className="mt-7">
              <LoginForm siteKey={SITE_KEY} modoDesarrollo={MODO_DESARROLLO} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

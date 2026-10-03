"use client";

import { useState } from "react";
import { TurnstileWidget } from "@/components/turnstile";
import { iniciarSesion } from "@/app/login/acciones";

interface Props {
  siteKey: string;
  modoDesarrollo: boolean;
}

export function LoginForm({ siteKey, modoDesarrollo }: Props) {
  const [token, setToken] = useState<string | null>(null);

  const habilitado = Boolean(token);

  return (
    <div className="mt-7">
      <TurnstileWidget siteKey={siteKey} onToken={setToken} modoDesarrollo={modoDesarrollo} />

      <form action={iniciarSesion} className="mt-6 space-y-4">
        <input type="hidden" name="captcha" value={token ?? ""} />
        <button
          type="submit"
          disabled={!habilitado}
          className="btn btn-azul w-full justify-center !py-3.5 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <GoogleIcon />
          Continuar con Google
        </button>
      </form>

      <p className="mt-5 text-center text-xs leading-relaxed text-ink/55">
        Al continuar aceptas el tratamiento de datos personales de la institución.
        La verificación anti‑robots es obligatoria.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.93l-3.88-3.01c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.95H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.27a12 12 0 0 0 0 10.76l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.11C6.22 6.87 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

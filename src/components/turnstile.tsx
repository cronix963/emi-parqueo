"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          language?: string;
          appearance?: string;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface Props {
  siteKey: string;
  onToken: (token: string | null) => void;
  /** Cuando es true no hay sitekey: se muestra un sustituto de desarrollo. */
  modoDesarrollo?: boolean;
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<void> | null = null;

function cargarScript(): Promise<void> {
  if (typeof window !== "undefined" && window.turnstile) {
    return Promise.resolve();
  }
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const existente = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`,
      );
      if (existente) {
        existente.addEventListener("load", () => resolve());
        existente.addEventListener("error", () =>
          reject(new Error("No se pudo cargar Turnstile")),
        );
        return;
      }
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("No se pudo cargar Turnstile"));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export function TurnstileWidget({ siteKey, onToken, modoDesarrollo = false }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function montar() {
      if (modoDesarrollo || !siteKey) return;

      try {
        await cargarScript();
        if (cancelado || !contenedor.current || !window.turnstile) return;

        // React StrictMode monta dos veces en desarrollo.
        contenedor.current.innerHTML = "";

        widgetId.current = window.turnstile.render(contenedor.current, {
          sitekey: siteKey,
          theme: "dark",
          language: "es",
          appearance: "interaction-only",
          callback: (token: string) => {
            setError(null);
            onToken(token);
          },
          "expired-callback": () => onToken(null),
          "error-callback": () => {
            setError("No se pudo completar la verificación. Intentá de nuevo.");
            onToken(null);
          },
        });
      } catch {
        if (!cancelado) {
          setError("No se pudo cargar la verificación de seguridad. Revisá tu conexión.");
          onToken(null);
        }
      }
    }

    void montar();

    return () => {
      cancelado = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [siteKey, onToken, modoDesarrollo]);

  if (modoDesarrollo) {
    return (
      <div
        data-testid="turnstile-dev"
        className="flex items-center gap-3 rounded-xl border border-emi-gold-500/50 bg-emi-900/70 px-4 py-3"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emi-gold-400 font-bold text-emi-950">
          ✓
        </span>
        <div className="text-sm leading-tight">
          <p className="font-semibold text-emi-100">
            No soy un robot{" "}
            <span className="font-normal text-emi-300">(modo desarrollo)</span>
          </p>
          <p className="text-emi-400">
            Activado sin claves de Cloudflare Turnstile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div ref={contenedor} />
      <p className="text-xs text-emi-400">
        La verificación es obligatoria para iniciar sesión.
      </p>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

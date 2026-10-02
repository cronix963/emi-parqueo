const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface ResultadoVerificacion {
  ok: boolean;
  mensaje: string;
  token: string;
}

export function turnstileEnDesarrollo(): boolean {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  return !secret || secret.includes("TU_SECRET_KEY");
}

/**
 * Verifica el token de Cloudflare Turnstile contra su API.
 * Sin credenciales configuradas actúa en modo desarrollo: acepta cualquier
 * token no vacío para que el flujo sea probable sin cuenta de Cloudflare.
 */
export async function verificarTurnstile(
  token: string,
  remoteIp?: string,
): Promise<ResultadoVerificacion> {
  if (!token) {
    return {
      ok: false,
      mensaje: "Debés completar la verificación de que no sos un robot.",
      token: "",
    };
  }

  if (turnstileEnDesarrollo()) {
    return { ok: true, mensaje: "Verificación omitida (modo desarrollo).", token: "dev" };
  }

  try {
    const cuerpo = new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: token,
    });
    if (remoteIp) cuerpo.set("remoteip", remoteIp);

    const respuesta = await fetch(VERIFY_URL, {
      method: "POST",
      body: cuerpo,
      cache: "no-store",
    });

    const datos = (await respuesta.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (!datos.success) {
      return {
        ok: false,
        mensaje:
          datos["error-codes"]?.includes("invalid-input-response")
            ? "La verificación expiró. Marcá «No soy un robot» otra vez."
            : "No pudimos verificar que no sos un robot. Intentá de nuevo.",
        token: "",
      };
    }

    return { ok: true, mensaje: "Verificación correcta.", token: token };
  } catch {
    return {
      ok: false,
      mensaje: "Falló la verificación de seguridad. Intentá de nuevo en unos segundos.",
      token: "",
    };
  }
}

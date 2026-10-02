import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_CAPTCHA } from "@/lib/auth-cookies";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const codigo = searchParams.get("code");
  const hacia = searchParams.get("next") ?? "/dashboard";

  const almacen = await cookies();
  const captchaValido = Boolean(almacen.get(COOKIE_CAPTCHA)?.value);
  almacen.delete(COOKIE_CAPTCHA);

  if (!codigo) {
    return NextResponse.redirect(
      new URL(
        "/login?error=" +
          encodeURIComponent("Google no devolvió un código de autorización."),
        origin,
      ),
    );
  }

  // El token de Turnstile es de un solo uso: se validó antes de redirigir a
  // Google y su cookie se consume aquí. Sin esta marca no se acepta el ingreso.
  if (!captchaValido) {
    return NextResponse.redirect(
      new URL(
        "/login?error=" +
          encodeURIComponent(
            "No se validó la verificación «no soy robot». Volvé a intentarlo.",
          ),
        origin,
      ),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(codigo);

  if (error) {
    return NextResponse.redirect(
      new URL(
        "/login?error=" +
          encodeURIComponent("No pudimos completar el inicio de sesión con Google."),
        origin,
      ),
    );
  }

  const destino = hacia.startsWith("/") && !hacia.startsWith("//") ? hacia : "/dashboard";
  return NextResponse.redirect(new URL(destino, origin));
}

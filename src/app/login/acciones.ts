"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { verificarTurnstile } from "@/lib/turnstile";
import { COOKIE_CAPTCHA, COOKIE_DEMO, OPCIONES_COOKIE } from "@/lib/auth-cookies";

const OPCIONES = { ...OPCIONES_COOKIE, maxAge: 60 * 10 };

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export async function iniciarSesion(formData: FormData): Promise<void> {
  const tokenCaptcha = String(formData.get("captcha") ?? "");
  const cabeceras = await headers();
  const ip = cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim();

  const verificacion = await verificarTurnstile(tokenCaptcha, ip);

  const almacen = await cookies();

  if (!verificacion.ok) {
    redirect(`/login?error=${encodeURIComponent(verificacion.mensaje)}`);
  }

  almacen.set(COOKIE_CAPTCHA, verificacion.token, OPCIONES);

  if (!isSupabaseConfigured()) {
    almacen.set(COOKIE_DEMO, "1", { ...OPCIONES, maxAge: 60 * 60 * 8 });
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) {
    almacen.delete(COOKIE_CAPTCHA);
    redirect(
      `/login?error=${encodeURIComponent(
        error?.message ??
          "El proveedor Google no está habilitado en tu proyecto de Supabase.",
      )}`,
    );
  }

  redirect(data.url);
}

export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.delete(COOKIE_CAPTCHA);
  almacen.delete(COOKIE_DEMO);

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}

export const COOKIE_CAPTCHA = "emi_captcha_ok";
export const COOKIE_DEMO = "emi_demo_session";

export const OPCIONES_COOKIE = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

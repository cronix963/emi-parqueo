import type { SVGProps } from "react";

/**
 * Iconografía en SVG inline, equivalente a los glyphs de FontAwesome que usa
 * emi.edu.bo. Se mantiene inline para no depender de una fuente de iconos.
 */

type Props = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      width="1em"
      height="1em"
      {...props}
    >
      {children}
    </svg>
  );
}

/* --- Redes sociales (6 iconos del header de emi.edu.bo) ---------------- */

export function IconoFacebook(props: Props) {
  return (
    <Base {...props}>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </Base>
  );
}

export function IconoX(props: Props) {
  return (
    <Base {...props}>
      <path d="M18.24 2.25h3.31l-7.23 8.26L22.84 21.75h-6.66l-5.22-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23zm-1.16 17.52h1.83L7.01 4.13H5.04z" />
    </Base>
  );
}

export function IconoYoutube(props: Props) {
  return (
    <Base {...props}>
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12z" />
    </Base>
  );
}

export function IconoLinkedin(props: Props) {
  return (
    <Base {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13M7.12 20.45H3.55V9h3.57zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0" />
    </Base>
  );
}

export function IconoInstagram(props: Props) {
  return (
    <Base {...props}>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38C1.35 2.68.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13.67.66 1.34 1.08 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.13-1.38.66-.67 1.08-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.13C21.32 1.35 20.65.93 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0m0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8m7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0" />
    </Base>
  );
}

export function IconoTiktok(props: Props) {
  return (
    <Base {...props}>
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </Base>
  );
}

export const ICONOS_REDES = {
  facebook: IconoFacebook,
  x: IconoX,
  youtube: IconoYoutube,
  linkedin: IconoLinkedin,
  instagram: IconoInstagram,
  tiktok: IconoTiktok,
} as const;

/* --- Interfaz del sistema de parqueo ---------------------------------- */

export function IconoMenu(props: Props) {
  return (
    <Base {...props}>
      <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
    </Base>
  );
}

export function IconoCerrar(props: Props) {
  return (
    <Base {...props}>
      <path d="M18.3 5.71 12 12.01l-6.3-6.3-1.41 1.42 6.29 6.29-6.3 6.3 1.42 1.41 6.29-6.29 6.3 6.3 1.41-1.42-6.29-6.29 6.3-6.3z" />
    </Base>
  );
}

export function IconoFlechaAbajo(props: Props) {
  return (
    <Base {...props}>
      <path d="M12 15.5 5.5 9l1.4-1.4 5.1 5.1 5.1-5.1L18.5 9z" />
    </Base>
  );
}

export function IconoAuto(props: Props) {
  return (
    <Base {...props}>
      <path d="M18.92 6.01A1.49 1.49 0 0 0 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8zM6.5 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3M5 11l1.5-4.5h11L19 11z" />
    </Base>
  );
}

export function IconoCamara(props: Props) {
  return (
    <Base {...props}>
      <path d="M9 2 7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10m0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
    </Base>
  );
}

export function IconoEscudo(props: Props) {
  return (
    <Base {...props}>
      <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11z" />
    </Base>
  );
}

export function IconoAlerta(props: Props) {
  return (
    <Base {...props}>
      <path d="M12 2 1 21h22zm0 4 8.53 15H3.47zM11 10v5h2v-5zm0 7v2h2v-2z" />
    </Base>
  );
}

export function IconoGrafico(props: Props) {
  return (
    <Base {...props}>
      <path d="M3 3h2v18H3zm4 10h4v8H7zm6-6h4v14h-4zm6-6h4v20h-4z" />
    </Base>
  );
}

export function IconoHistorial(props: Props) {
  return (
    <Base {...props}>
      <path d="M13 3a9 9 0 0 0-9 9H1l4 4 4-4H6a7 7 0 1 1 7 7c-1.93 0-3.68-.79-4.95-2.05l-1.42 1.42A8.98 8.98 0 1 0 13 3m-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8z" />
    </Base>
  );
}

export function IconoUsuario(props: Props) {
  return (
    <Base {...props}>
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10m0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5" />
    </Base>
  );
}

export function IconoLlave(props: Props) {
  return (
    <Base {...props}>
      <path d="M12.65 10A6 6 0 0 0 1 12a6 6 0 0 0 11.65 2H17v4h4v-4h2v-4zM7 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6" />
    </Base>
  );
}

export function IconoBandeja(props: Props) {
  return (
    <Base {...props}>
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m0 4h-4V5H9v2H5V5H4v10h5v-2h6v2h5z" />
    </Base>
  );
}

export function IconoNube(props: Props) {
  return (
    <Base {...props}>
      <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14a6 6 0 0 0 6 6h13a5 5 0 0 0 .35-9.96M13 12v4h-2v-4H8l4-4 4 4z" />
    </Base>
  );
}

export function IconoMapa(props: Props) {
  return (
    <Base {...props}>
      <path d="M20.5 3 15 5.1 9 3 3.5 4.9A1 1 0 0 0 3 5.8V21l6-2.1 6 2.1 5.5-1.9a1 1 0 0 0 .5-.9V4a1 1 0 0 0-.5-1M10 5.5l4 1.4v11.6l-4-1.4zm-5 .9 3-.8v11.6l-3 1zm14 9.9-3 .8V5.5l3-1z" />
    </Base>
  );
}

export function IconoTelefono(props: Props) {
  return (
    <Base {...props}>
      <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.03-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.57 1 1 0 0 1-.25 1.03z" />
    </Base>
  );
}

export function IconoMovil(props: Props) {
  return (
    <Base {...props}>
      <path d="M17 1H7a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2m0 18H7V5h10z" />
    </Base>
  );
}

export function IconoCorreo(props: Props) {
  return (
    <Base {...props}>
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 4-8 5-8-5V6l8 5 8-5z" />
    </Base>
  );
}

export function IconoReloj(props: Props) {
  return (
    <Base {...props}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16m.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
    </Base>
  );
}

export function IconoFlechaArriba(props: Props) {
  return (
    <Base {...props}>
      <path d="m4 12 1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8z" />
    </Base>
  );
}
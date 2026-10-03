/**
 * Estructura de navegación de la EMI.
 *
 * Replica el menú de emi.edu.bo (5 entradas de primer nivel con dropdown) y
 * antepone SISTEMA DE PARQUEO, que enlaza al sistema de parqueo inteligente.
 */

export interface EntradaMenu {
  titulo: string;
  href: string;
  /** Entrada destacada: se renderiza con el botón dorado del sitio. */
  destacado?: boolean;
  hijos?: { titulo: string; href: string }[];
}

export const MENU: EntradaMenu[] = [
  {
    titulo: "SISTEMA DE PARQUEO",
    href: "/sistema-parqueo",
    destacado: true,
    hijos: [
      { titulo: "Panel de monitoreo", href: "/dashboard" },
      { titulo: "Mapa de espacios", href: "/dashboard" },
      { titulo: "Acceso vehicular", href: "/sistema-parqueo#acceso" },
      { titulo: "Reconocimiento de placas", href: "/sistema-parqueo#placas" },
      { titulo: "Alertas y notificaciones", href: "/sistema-parqueo#alertas" },
      { titulo: "Reportes y estadísticas", href: "/sistema-parqueo#reportes" },
    ],
  },
  {
    titulo: "ACADÉMICA",
    href: "https://www.emi.edu.bo/universidad",
    hijos: [
      { titulo: "Unidades Académicas", href: "https://www.emi.edu.bo/universidad/unidades-academicas" },
      { titulo: "Admisión", href: "https://www.emi.edu.bo/universidad/admision" },
      { titulo: "Técnico Superior", href: "https://www.emi.edu.bo/universidad/tecnicosuperior" },
      { titulo: "Licenciatura", href: "https://www.emi.edu.bo/universidad/licenciatura" },
      { titulo: "Posgrado", href: "https://www.emi.edu.bo/universidad/posgrado" },
      { titulo: "Becas y Descuentos", href: "https://www.emi.edu.bo/universidad/becas" },
    ],
  },
  {
    titulo: "INVESTIGACIÓN",
    href: "https://www.emi.edu.bo/investigacion",
    hijos: [
      { titulo: "Revistas Científicas", href: "https://eminente.emi.edu.bo/" },
      { titulo: "Revista Fractal", href: "https://fractal.emi.edu.bo/" },
      { titulo: "Centros de Investigación", href: "https://www.emi.edu.bo/investigacion/centros-de-investigacion" },
      { titulo: "Laboratorios", href: "https://www.emi.edu.bo/investigacion/laboratorios" },
      { titulo: "Publicaciones", href: "https://www.emi.edu.bo/investigacion/publicaciones" },
      { titulo: "Proyectos de Investigación", href: "https://www.emi.edu.bo/investigacion/proyectos-de-investigacion" },
    ],
  },
  {
    titulo: "INTERACCIÓN SOCIAL",
    href: "https://www.emi.edu.bo/interaccion",
    hijos: [
      { titulo: "Noticias EMI", href: "https://www.emi.edu.bo/interaccion/noticias-emi" },
      { titulo: "Convenios", href: "https://www.emi.edu.bo/interaccion/convenios" },
      { titulo: "Bienestar Estudiantil", href: "https://www.emi.edu.bo/interaccion/bienestar-estudiantil-y-extension-universitaria" },
      { titulo: "Responsabilidad Social", href: "https://www.emi.edu.bo/interaccion/responsabilidad-social-universitaria" },
      { titulo: "EMI Internacional", href: "https://www.emi.edu.bo/interaccion/emi-internacional" },
      { titulo: "Convocatorias", href: "https://www.emi.edu.bo/interaccion/convocatorias" },
      { titulo: "Galería Multimedia", href: "https://www.emi.edu.bo/interaccion/galeria-multimedia" },
    ],
  },
  {
    titulo: "SERVICIOS",
    href: "https://www.emi.edu.bo/servicios",
    hijos: [
      { titulo: "Estudiantes Nuevos", href: "https://www.emi.edu.bo/servicios/estudiantes-nuevos" },
      { titulo: "Estudiantes Regulares", href: "https://www.emi.edu.bo/servicios/estudiantes" },
      { titulo: "Posgraduantes", href: "https://www.emi.edu.bo/servicios/posgraduantes" },
      { titulo: "Docentes", href: "https://www.emi.edu.bo/servicios/docentes" },
      { titulo: "Personal Administrativo", href: "https://www.emi.edu.bo/servicios/personal-administrativo" },
      { titulo: "Buzón de Sugerencias", href: "https://www.emi.edu.bo/servicios/buzon-de-sugerencias" },
      { titulo: "Preguntas Frecuentes", href: "https://www.emi.edu.bo/servicios/preguntas-frecuentes" },
      { titulo: "Residencia Universitaria", href: "https://www.emi.edu.bo/servicios/residencia-universitaria" },
    ],
  },
  {
    titulo: "NOSOTROS",
    href: "https://www.emi.edu.bo/nosotros",
    hijos: [
      { titulo: "¿Quiénes somos?", href: "https://www.emi.edu.bo/nosotros/quienes-somos" },
      { titulo: "Autoridades y Personal", href: "https://www.emi.edu.bo/nosotros/autoridades-y-personal" },
      { titulo: "Estructura Organizacional", href: "https://www.emi.edu.bo/nosotros/estructura-organizacional" },
      { titulo: "Normativa Interna", href: "https://www.emi.edu.bo/nosotros/normativa-interna" },
      { titulo: "Transparencia", href: "https://www.emi.edu.bo/nosotros/transparencia" },
      { titulo: "Plan Estratégico y POA", href: "https://www.emi.edu.bo/nosotros/pei-poa" },
      { titulo: "Contacto", href: "https://www.emi.edu.bo/nosotros/contacto" },
    ],
  },
];

export const REDES = [
  { nombre: "Facebook", url: "https://www.facebook.com/EMIBoliviaPaginaOficial", icono: "facebook" },
  { nombre: "X", url: "https://x.com/EMI_Bolivia_", icono: "x" },
  { nombre: "YouTube", url: "https://www.youtube.com/@EMI_Bolivia", icono: "youtube" },
  { nombre: "LinkedIn", url: "https://bo.linkedin.com/school/emi-bolivia/", icono: "linkedin" },
  { nombre: "Instagram", url: "https://www.instagram.com/emi.bolivia/", icono: "instagram" },
  { nombre: "TikTok", url: "https://www.tiktok.com/@emi_bolivia", icono: "tiktok" },
] as const;

export const UNIDADES = [
  { nombre: "La Paz", url: "https://emi.edu.bo/universidad/unidades-academicas/lapaz" },
  { nombre: "Santa Cruz", url: "https://emi.edu.bo/universidad/unidades-academicas/santacruz" },
  { nombre: "Cochabamba", url: "https://emi.edu.bo/universidad/unidades-academicas/cochabamba" },
  { nombre: "Riberalta", url: "https://emi.edu.bo/universidad/unidades-academicas/riberalta" },
  { nombre: "Trópico", url: "https://emi.edu.bo/universidad/unidades-academicas/tropico" },
];

export const PAGINAS_RELACIONADAS = [
  { nombre: "Ministerio de Defensa del Estado Plurinacional", url: "https://www.mindef.gob.bo/" },
  { nombre: "Ejército de Bolivia", url: "https://ejercito.mil.bo/" },
  { nombre: "Comité Ejecutivo de la Universidad Boliviana", url: "https://ceub.edu.bo/" },
];

export const CONTACTO = {
  direccion: "Av. Arce No. 2642, Zona San Jorge, La Paz, Bolivia",
  mapa: "https://maps.app.goo.gl/2SJ5wcvbMSdkxfne6",
  telefono: "+591 2432266",
  telefonoEnlace: "tel:+5912432266",
  movil: "+591 71535093",
  movilEnlace: "tel:+59171535093",
  correo: "informacion@emi.edu.bo",
};
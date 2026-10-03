/**
 * Los 13 módulos del sistema de parqueo inteligente, con el estado real de
 * implementación tomado de docs/CHECKLIST.md.
 *
 * `estado`:
 *   - "listo"      verificado automáticamente por scripts/validar-bd.mjs
 *   - "parcial"    la base de datos existe; falta exponerlo en la interfaz
 *   - "pendiente"  todavía no implementado
 */

export interface Modulo {
  numero: number;
  nombre: string;
  resumen: string;
  icono: string;
  estado: "listo" | "parcial" | "pendiente";
  tablas: string[];
  ruta?: string;
}

export const MODULOS: Modulo[] = [
  {
    numero: 1,
    nombre: "Autenticación y usuarios",
    resumen:
      "Google Workspace, verificación anti‑robots y bloqueo tras cinco intentos fallidos.",
    icono: "usuario",
    estado: "parcial",
    tablas: ["usuarios", "sesiones", "intentos_autenticacion"],
  },
  {
    numero: 2,
    nombre: "Roles y permisos",
    resumen:
      "Cinco roles, 31 permisos y trazabilidad de cada cambio de rol asignado.",
    icono: "llave",
    estado: "parcial",
    tablas: ["roles", "permisos", "roles_permisos", "usuarios_roles_historico"],
  },
  {
    numero: 3,
    nombre: "Padrón vehicular y autorizaciones",
    resumen:
      "Una placa activa por vehículo y autorizaciones permanentes, temporales o de visita.",
    icono: "auto",
    estado: "parcial",
    tablas: ["vehiculos", "autorizaciones"],
  },
  {
    numero: 4,
    nombre: "Control de acceso vehicular",
    resumen:
      "Ingesta desde sensores IoT, barrera con fail‑safe y antirrebote de lecturas.",
    icono: "barrera",
    estado: "listo",
    tablas: ["eventos_acceso"],
    ruta: "/dashboard",
  },
  {
    numero: 5,
    nombre: "Reconocimiento de placas",
    resumen:
      "Cámaras ANPR con score de confianza obligatorio y cola de validación manual.",
    icono: "camara",
    estado: "listo",
    tablas: ["reconocimientos_placa"],
  },
  {
    numero: 6,
    nombre: "Zonas, plazas y dispositivos",
    resumen:
      "Cuatro zonas, 116 plazas, ocho dispositivos y una cámara principal por plaza.",
    icono: "mapa",
    estado: "listo",
    tablas: ["zonas", "plazas", "dispositivos", "plazas_camaras"],
    ruta: "/dashboard",
  },
  {
    numero: 7,
    nombre: "Ocupación por visión artificial",
    resumen:
      "Estado plaza por plaza con confianza, clima y evidencia fotográfica referenciada.",
    icono: "gaf",
    estado: "listo",
    tablas: ["estados_ocupacion_historial"],
    ruta: "/dashboard",
  },
  {
    numero: 8,
    nombre: "Panel de monitoreo",
    resumen:
      "Mapa de espacios, KPIs de ocupación y tabla de ingresos del vehículo.",
    icono: "grafico",
    estado: "parcial",
    tablas: [],
    ruta: "/dashboard",
  },
  {
    numero: 9,
    nombre: "Alertas y notificaciones",
    resumen:
      "Alertas deduplicadas por huella, con flujo de atención y responsable asignado.",
    icono: "alerta",
    estado: "parcial",
    tablas: ["alertas", "alertas_acciones"],
  },
  {
    numero: 10,
    nombre: "Historial y trazabilidad",
    resumen:
      "Tiempo de permanencia, flujo por hora e indicadores de precisión y trazabilidad.",
    icono: "historial",
    estado: "parcial",
    tablas: ["eventos_acceso", "estados_ocupacion_historial"],
  },
  {
    numero: 11,
    nombre: "Reportes y estadísticas",
    resumen:
      "Indicadores de gestión y reportes con filtros, estado y archivo generado.",
    icono: "documento",
    estado: "parcial",
    tablas: ["reportes"],
  },
  {
    numero: 12,
    nombre: "Auditoría y respaldo",
    resumen:
      "Bitácora inmutable con IP y agente, más registro de respaldos y restauraciones.",
    icono: "escudo",
    estado: "listo",
    tablas: ["bitacora_auditoria", "backups", "restauraciones", "dispositivos_fallas"],
  },
  {
    numero: 13,
    nombre: "PWA y operación en campo",
    resumen:
      "Tokens de push por usuario para avisos en el teléfono del personal de turno.",
    icono: "movil",
    estado: "pendiente",
    tablas: ["dispositivos_usuario"],
  },
];

export const ETIQUETA_ESTADO = {
  listo: { texto: "Operativo", clase: "bg-libre/15 text-libre" },
  parcial: { texto: "En desarrollo", clase: "bg-gold/25 text-gold-deep" },
  pendiente: { texto: "Planificado", clase: "bg-cloud text-slate" },
} as const;

/** Objetivos métricos del proyecto, con su fuente en la base de datos. */
export const OBJETIVOS = [
  {
    valor: "30%",
    etiqueta: "Reducción del tiempo de control de ingreso",
    fuente: "vw_flujo_por_hora",
  },
  {
    valor: "90%",
    etiqueta: "Precisión en la detección de ocupación",
    fuente: "vw_indicador_precision_placa",
  },
  {
    valor: "95%",
    etiqueta: "Trazabilidad de eventos vehiculares",
    fuente: "vw_indicador_trazabilidad",
  },
];

/** Principios de seguridad que el sistema respeta por diseño. */
export const PRINCIPIOS = [
  {
    titulo: "Sin reconocimiento facial",
    texto:
      "El sistema no realiza biometría ni reconocimiento de rostros. La evidencia vehicular se referencia por ruta, nunca se almacena como imagen binaria.",
  },
  {
    titulo: "Fail‑safe por defecto",
    texto:
      "Ante una placa ilegible, un score bajo o un dispositivo caído, la barrera permanece cerrada. La apertura solo ocurre con vehículo autorizado y legible.",
  },
  {
    titulo: "Auditoría inmutable",
    texto:
      "La bitácora de auditoría no admite UPDATE ni DELETE: un trigger de base de datos lo impide y sólo la Administración y Soporte pueden leerla.",
  },
  {
    titulo: "Acceso mínimo",
    texto:
      "Las 24 tablas tienen Row Level Security activa con 39 políticas, de modo que cada persona solo ve lo que su rol le permite.",
  },
];
/**
 * `sin_datos` existe en el esquema real (public.estado_plaza = 'SIN_DATOS'):
 * plaza registrada pero que el motor de visión aún no ha evaluado.
 */
export type EstadoEspacio =
  | "libre"
  | "ocupado"
  | "reservado"
  | "mantenimiento"
  | "sin_datos";

export type TipoVehiculo =
  | "automovil"
  | "camioneta"
  | "motocicleta"
  | "camion"
  | "bus"
  | "ciclo";

/**
 * Refleja la tabla public.zonas del modelo físico (supabase/02_schema.sql).
 * `id` y `zonaId` viajan como texto porque el frontend consume la vista
 * public.espacios, que castea los uuid.
 */
export interface Zona {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  plano_layout: string | null;
  capacidad_maxima: number;
  umbral_alerta_pct: number;
  activa: boolean;
}

export interface Espacio {
  id: string;
  codigo: string;
  fila: number;
  columna: number;
  estado: EstadoEspacio;
  tipoPermitido: TipoVehiculo | "cualquiera";
  zonaId: string;
  placa: string | null;
  modelo: string | null;
  horaIngreso: string | null;
  horaSalidaPrevista: string | null;
  accesible: boolean;
}

export interface ResumenParqueo {
  total: number;
  libres: number;
  ocupados: number;
  reservados: number;
  mantenimiento: number;
  ocupacionPct: number;
}

export interface RegistroIngreso {
  id: string;
  espacioCodigo: string;
  zonaId: string;
  placa: string;
  modelo: string;
  tipo: TipoVehiculo;
  horaIngreso: string;
  horaSalidaPrevista: string | null;
  estado: EstadoEspacio;
}

export const ETIQUETA_ESTADO: Record<EstadoEspacio, string> = {
  libre: "Disponible",
  ocupado: "Ocupado",
  reservado: "Reservado",
  mantenimiento: "Mantenimiento",
  sin_datos: "Sin datos",
};

export const ETIQUETA_TIPO: Record<TipoVehiculo, string> = {
  automovil: "Automóvil",
  camioneta: "Camioneta",
  motocicleta: "Motocicleta",
  camion: "Camión",
  bus: "Bus",
  ciclo: "Ciclo",
};

/** Estados que el esquema no contempla (p. ej. reservada por mantenimiento). */
export const ESTADOS_RELEVANTES = [
  "libre",
  "ocupado",
  "reservado",
  "mantenimiento",
  "sin_datos",
] as const satisfies readonly EstadoEspacio[];

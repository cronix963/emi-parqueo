export type EstadoEspacio = "libre" | "ocupado" | "reservado" | "mantenimiento";

export type TipoVehiculo = "automovil" | "camioneta" | "motocicleta" | "camion";

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

export interface Zona {
  id: string;
  nombre: string;
  descripcion: string;
  filas: number;
  columnas: number;
  capacidades: Partial<Record<TipoVehiculo, number>>;
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
};

export const ETIQUETA_TIPO: Record<TipoVehiculo, string> = {
  automovil: "Automóvil",
  camioneta: "Camioneta",
  motocicleta: "Motocicleta",
  camion: "Camión",
};

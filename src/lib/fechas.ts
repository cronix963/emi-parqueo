export function formatearHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatearFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-BO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function antiguedad(iso: string, ahora: number = Date.now()): string {
  const minutos = Math.floor((ahora - new Date(iso).getTime()) / 60_000);
  if (minutos < 1) return "recién ingressado";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return `hace ${Math.floor(horas / 24)} d`;
}

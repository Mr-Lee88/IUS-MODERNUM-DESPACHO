/**
 * Utilidades de fechas para la agenda.
 *
 * Sin librerías: el CLAUDE.md pide no meter dependencias que no hagan falta hoy.
 * Todo se maneja como `AAAA-MM-DD` en hora local de Campeche, que no cambia con
 * el horario de verano.
 */
export const ZONA = "America/Merida";

export const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const DIAS_LARGOS = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];
export const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Hoy en Campeche, como AAAA-MM-DD. */
export function hoyIso(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: ZONA }).format(new Date());
}

/** Convierte AAAA-MM-DD en una fecha de mediodía UTC: así ningún huso la mueve de día. */
export function aFecha(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d, 12));
}

export function aIso(f: Date): string {
  return f.toISOString().slice(0, 10);
}

export function sumarDias(iso: string, dias: number): string {
  const f = aFecha(iso);
  f.setUTCDate(f.getUTCDate() + dias);
  return aIso(f);
}

export function sumarMeses(iso: string, meses: number): string {
  const f = aFecha(iso);
  const diaOriginal = f.getUTCDate();
  f.setUTCDate(1);
  f.setUTCMonth(f.getUTCMonth() + meses);
  // Si el mes destino es más corto (31 de enero + 1 mes), se queda en el último día.
  const ultimo = new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth() + 1, 0)).getUTCDate();
  f.setUTCDate(Math.min(diaOriginal, ultimo));
  return aIso(f);
}

/** Lunes de la semana a la que pertenece la fecha. */
export function lunesDe(iso: string): string {
  const f = aFecha(iso);
  const dia = f.getUTCDay();             // 0 domingo … 6 sábado
  const retroceso = dia === 0 ? 6 : dia - 1;
  return sumarDias(iso, -retroceso);
}

export function primerDiaDelMes(iso: string): string {
  return iso.slice(0, 8) + "01";
}

export function diasDelMes(iso: string): number {
  const f = aFecha(iso);
  return new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth() + 1, 0)).getUTCDate();
}

export function fechaLarga(iso: string | null | undefined): string {
  if (!iso) return "—";
  const f = aFecha(iso);
  return `${DIAS_LARGOS[f.getUTCDay()]} ${f.getUTCDate()} de ${MESES[f.getUTCMonth()]} de ${f.getUTCFullYear()}`;
}

export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  const f = aFecha(iso);
  return `${f.getUTCDate()} ${MESES[f.getUTCMonth()].slice(0, 3)} ${f.getUTCFullYear()}`;
}

export function mesYAnio(iso: string): string {
  const f = aFecha(iso);
  return `${MESES[f.getUTCMonth()]} de ${f.getUTCFullYear()}`;
}

/** La hora de un timestamptz, en hora de Campeche. */
export function horaDe(ts: string | null): string | null {
  if (!ts) return null;
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(ts));
}

/** El día (AAAA-MM-DD) de un timestamptz, en hora de Campeche. */
export function diaDe(ts: string | null): string | null {
  if (!ts) return null;
  return new Intl.DateTimeFormat("sv-SE", { timeZone: ZONA }).format(new Date(ts));
}

/** Cuántos días faltan. Negativo si ya pasó. */
export function diasHasta(iso: string, desde = hoyIso()): number {
  return Math.round((aFecha(iso).getTime() - aFecha(desde).getTime()) / 86400000);
}

export function comoFalta(dias: number): string {
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  if (dias === -1) return "Ayer";
  if (dias > 1) return `En ${dias} días`;
  return `Hace ${Math.abs(dias)} días`;
}

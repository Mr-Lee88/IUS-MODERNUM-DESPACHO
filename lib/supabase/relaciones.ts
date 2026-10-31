/**
 * supabase-js, sin los tipos generados del esquema, infiere toda relación
 * embebida como arreglo, aunque sea a uno. `uno()` la normaliza.
 *
 * Pendiente: generar `Database` desde la base y tipar los clientes; entonces
 * esto deja de hacer falta para las relaciones a uno.
 */
export function uno<T>(valor: T | T[] | null | undefined): T | null {
  if (valor == null) return null;
  return Array.isArray(valor) ? (valor[0] ?? null) : valor;
}

/**
 * Tipo del perfil y utilidades que usan tanto el servidor como el navegador.
 *
 * Vive aparte de `lib/sesion.ts` a propósito: ese archivo lee cookies con
 * `next/headers` y no puede entrar a un componente de cliente. La barra lateral
 * sí necesita el tipo, así que el tipo vive aquí.
 */
export type Rol = "socio" | "abogado" | "pasante" | "cliente";

export interface Perfil {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  iniciales: string | null;
  activo: boolean;
}

/** Socio, abogado o pasante. El rol `cliente` solo entra al portal. */
export function esDelEquipo(perfil: Perfil): boolean {
  return perfil.rol === "socio" || perfil.rol === "abogado" || perfil.rol === "pasante";
}

export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

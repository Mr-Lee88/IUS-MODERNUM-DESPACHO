import "server-only";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { sujetoVigente, tokenDeSesion } from "@/lib/token-sesion";
import type { Perfil } from "@/lib/perfil";

export type { Perfil, Rol } from "@/lib/perfil";
export { esDelEquipo, iniciales } from "@/lib/perfil";

/**
 * Quién es el usuario de esta petición.
 *
 * NO se usa `auth.getUser()`, y la razón es un fallo que costó encontrar: esa
 * llamada va por red a Supabase en CADA página, y si esa petición falla por lo
 * que sea —latencia, un corte, un límite— la librería da la sesión por
 * inválida y BORRA la cookie. El usuario queda fuera sin haber hecho nada, y
 * en producción pasaba a la segunda navegación.
 *
 * En su lugar se lee el `sub` del propio token, sin verificar su firma, y con
 * él se consulta el perfil. Eso no debilita nada: la consulta viaja a Supabase
 * con ese mismo token y es Supabase quien verifica la firma antes de devolver
 * una sola fila. Un token inventado no pasaría la RLS. Lo que se decide aquí
 * es a quién se le pinta la interfaz; quién puede ver qué datos lo decide
 * siempre la base.
 *
 * Leer la cookie y juzgar el token es trabajo de `lib/token-sesion.ts`, que es
 * también lo que usa el guardia de rutas. Tienen que coincidir: cuando no
 * coincidían, un token vencido hacía rebotar al navegador entre `/` e
 * `/ingresar` hasta ERR_TOO_MANY_REDIRECTS.
 */

/** El token de acceso que viene en la cookie de sesión, sin tocar la cookie. */
async function tokenDeLaCookie(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const almacen = await cookies();
  return tokenDeSesion(almacen.getAll());
}

/** Devuelve el perfil del usuario autenticado o manda a iniciar sesión. */
export async function requerirSesion(): Promise<Perfil> {
  const token = await tokenDeLaCookie();
  const sub = token ? sujetoVigente(token) : null;
  if (!sub) redirect("/ingresar");

  const supabase = await crearClienteServidor();
  const { data: perfil } = await supabase
    .from("perfil")
    .select("id, nombre, correo, rol, iniciales, activo")
    .eq("id", sub)
    .single();

  if (!perfil || !perfil.activo) redirect("/ingresar?error=inactivo");
  return perfil as Perfil;
}

/** Para las pantallas que solo ve el socio: honorarios, usuarios, catálogos. */
export async function requerirSocio(): Promise<Perfil> {
  const perfil = await requerirSesion();
  if (perfil.rol !== "socio") redirect("/");
  return perfil;
}

/** Igual que `requerirSesion`, pero sin redirigir: para las rutas que sirven archivos. */
export async function perfilDeLaPeticion(): Promise<Perfil | null> {
  const token = await tokenDeLaCookie();
  const sub = token ? sujetoVigente(token) : null;
  if (!sub) return null;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("perfil")
    .select("id, nombre, correo, rol, iniciales, activo")
    .eq("id", sub)
    .single();

  return data?.activo ? (data as Perfil) : null;
}

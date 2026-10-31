import "server-only";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
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
 */

/** Lee la carga del JWT sin verificar la firma: de ahí sale el identificador. */
function sujetoDelToken(token: string): string | null {
  try {
    const carga = token.split(".")[1];
    if (!carga) return null;
    const json = Buffer.from(carga.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
    const { sub, exp } = JSON.parse(json) as { sub?: string; exp?: number };
    // Un token vencido no sirve ni para preguntar.
    if (!sub || (exp && exp * 1000 < Date.now())) return null;
    return sub;
  } catch {
    return null;
  }
}

/** El token de acceso que viene en la cookie de sesión, sin tocar la cookie. */
async function tokenDeLaCookie(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const almacen = await cookies();

  // @supabase/ssr guarda la sesión en `sb-<ref>-auth-token`, partida en
  // `.0`, `.1`… cuando no cabe en una sola cookie.
  const trozos = almacen
    .getAll()
    .filter((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (trozos.length === 0) return null;

  let crudo = trozos.map((c) => c.value).join("");
  if (crudo.startsWith("base64-")) {
    try {
      crudo = Buffer.from(crudo.slice("base64-".length), "base64").toString();
    } catch {
      return null;
    }
  }
  try {
    return (JSON.parse(crudo) as { access_token?: string }).access_token ?? null;
  } catch {
    return null;
  }
}

/** Devuelve el perfil del usuario autenticado o manda a iniciar sesión. */
export async function requerirSesion(): Promise<Perfil> {
  const token = await tokenDeLaCookie();
  const sub = token ? sujetoDelToken(token) : null;
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
  const sub = token ? sujetoDelToken(token) : null;
  if (!sub) return null;

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("perfil")
    .select("id, nombre, correo, rol, iniciales, activo")
    .eq("id", sub)
    .single();

  return data?.activo ? (data as Perfil) : null;
}

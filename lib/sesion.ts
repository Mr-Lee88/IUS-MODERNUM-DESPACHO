import "server-only";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/perfil";

export type { Perfil, Rol } from "@/lib/perfil";
export { esDelEquipo, iniciales } from "@/lib/perfil";

/** Devuelve el perfil del usuario autenticado o manda a iniciar sesión. */
export async function requerirSesion(): Promise<Perfil> {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/ingresar");

  const { data: perfil } = await supabase
    .from("perfil")
    .select("id, nombre, correo, rol, iniciales, activo")
    .eq("id", user.id)
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

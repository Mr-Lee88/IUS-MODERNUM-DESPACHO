"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearClienteDeAcceso } from "@/lib/supabase/server";

/**
 * Cerrar sesión. Es una ACCIÓN, no un enlace, y en eso está todo.
 *
 * Esto era `GET /auth/cerrar`, con un `<Link>` en el menú lateral. En
 * producción Next precarga los enlaces que están a la vista, y el menú está
 * siempre a la vista: el navegador pedía esa ruta él solo, el servidor
 * ejecutaba `signOut()` sin que nadie hubiera hecho clic, y el usuario salía
 * expulsado a la segunda pantalla. En desarrollo Next no precarga nada, así
 * que en la máquina de uno todo funcionaba. De ahí que costara tanto verlo.
 *
 * La regla que esto fija: **una petición GET no cambia el estado del
 * servidor.** Cerrar sesión se pide con POST, y un POST nadie lo precarga.
 */
export async function cerrarSesion() {
  const supabase = await crearClienteDeAcceso();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/ingresar");
}

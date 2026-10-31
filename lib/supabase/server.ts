import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Clientes de Supabase para el servidor. Hay DOS a propósito.
 *
 * El problema que esto resuelve: el cliente de @supabase/ssr, cuando algo no
 * le cuadra con la sesión guardada, la limpia escribiendo cookies vacías. Si
 * una página cualquiera puede hacer eso, cualquier tropiezo —una respuesta
 * lenta, una validación que falla— deja al usuario fuera. Era justo lo que
 * pasaba: se entraba y a la segunda pantalla había que volver a iniciar
 * sesión.
 *
 * La regla es sencilla: **leer la sesión nunca puede destruirla.** Solo el
 * inicio y el cierre de sesión escriben la cookie, porque es su trabajo.
 */

/**
 * Para páginas, rutas y consultas: LEE la cookie y nunca la escribe.
 *
 * `setAll` vacío no es un descuido. Es la garantía de que ninguna pantalla
 * puede cerrar la sesión de nadie.
 */
export async function crearClienteServidor() {
  const almacen = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { autoRefreshToken: false, detectSessionInUrl: false },
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: () => {
          // Deliberadamente vacío: aquí solo se lee.
        },
      },
    },
  );
}

/**
 * Solo para iniciar y cerrar sesión, desde una Server Action o un Route
 * Handler, que son los únicos sitios donde Next permite escribir cookies.
 */
export async function crearClienteDeAcceso() {
  const almacen = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { autoRefreshToken: false, detectSessionInUrl: false },
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: (lista) => {
          for (const { name, value, options } of lista) almacen.set(name, value, options);
        },
      },
    },
  );
}

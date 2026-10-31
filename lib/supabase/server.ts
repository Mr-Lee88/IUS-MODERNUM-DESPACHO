import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Components, Server Actions y Route Handlers.
 *
 * `autoRefreshToken: false` NO es un detalle: es lo que evita que la sesión se
 * caiga sola. Un Server Component no puede escribir cookies —`cookies().set()`
 * lanza, y aquí se ignora— así que si el cliente renovara el token desde una
 * página, Supabase rotaría el token de refresco, el nuevo se perdería al no
 * poder guardarse, y el viejo quedaría invalidado: la siguiente navegación
 * echaría al usuario. Pasaba exactamente eso, y en producción se notaba a la
 * primera o segunda página.
 *
 * El único que renueva es el proxy, que sí puede escribir la cookie de vuelta.
 * El inicio de sesión funciona igual: ocurre en una Server Action, donde
 * escribir cookies sí está permitido.
 */
export async function crearClienteServidor() {
  const almacen = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: (lista) => {
          try {
            for (const { name, value, options } of lista) almacen.set(name, value, options);
          } catch {
            // Server Component: no puede escribir cookies. Con el refresco
            // automático apagado, aquí ya no se pierde ningún token.
          }
        },
      },
    },
  );
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión de Supabase y cierra las rutas de la aplicación.
 *
 * Dos cuidados que cuestan la sesión entera si se olvidan:
 *
 * 1. Cuando este proxy refresca el token, Supabase devuelve cookies nuevas. Si
 *    la respuesta que sale es un `redirect` creado desde cero, esas cookies se
 *    quedan en el camino: el navegador conserva las viejas, que ya no sirven, y
 *    el usuario queda fuera. Por eso cada redirección copia las cookies.
 *
 * 2. Next precarga los enlaces al pasar el ratón por encima. Esas peticiones
 *    también pasan por aquí, así que varias pueden intentar refrescar el MISMO
 *    token a la vez; Supabase invalida un token de refresco reutilizado y la
 *    sesión muere sin que nadie haya hecho nada raro. Una precarga no necesita
 *    comprobar nada: se deja pasar.
 */
export async function proxy(request: NextRequest) {
  const ruta = request.nextUrl.pathname;

  // El manual se lee antes de iniciar sesión: es la puerta de entrada.
  const esPublica = ruta.startsWith("/ingresar") || ruta.startsWith("/auth")
    || ruta.startsWith("/manual");

  // Precarga de Next: no toca la sesión.
  if (request.headers.get("next-router-prefetch") === "1") {
    return NextResponse.next({ request });
  }

  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          for (const { name, value } of lista) request.cookies.set(name, value);
          respuesta = NextResponse.next({ request });
          for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  /** Redirige SIN perder las cookies que el refresco acaba de escribir. */
  function redirigirA(destino: string) {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    url.search = "";
    const salida = NextResponse.redirect(url);
    for (const cookie of respuesta.cookies.getAll()) salida.cookies.set(cookie);
    return salida;
  }

  if (!user && !esPublica) return redirigirA("/ingresar");
  if (user && ruta.startsWith("/ingresar")) return redirigirA("/");

  return respuesta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

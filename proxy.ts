import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión de Supabase y manda a iniciar sesión cuando no la hay.
 *
 * SOLO ACTÚA EN LA NAVEGACIÓN DE VERDAD, y esa precisión cuesta la sesión
 * entera si se pierde. En producción Next precarga los enlaces: al abrir una
 * página salen seis o siete peticiones a la vez hacia las rutas del menú. Si
 * todas pasan por aquí, todas intentan refrescar EL MISMO token, y Supabase
 * invalida un token de refresco reutilizado: el usuario queda fuera sin haber
 * hecho nada. En desarrollo no se ve, porque ahí Next no precarga.
 *
 * Dejar pasar esas peticiones no abre ningún hueco: cada página llama a
 * `requerirSesion()` y cada consulta pasa por la RLS de la base. Este proxy es
 * la comodidad de que la redirección ocurra antes de pintar nada, no el
 * candado.
 *
 * Y cuando redirige, copia las cookies: si el refresco escribió unas nuevas y
 * la redirección se crea desde cero, se quedan en el camino y la sesión muere
 * igual.
 */
export async function proxy(request: NextRequest) {
  // Navegación real del navegador. Una precarga o una petición de datos de
  // React traen otro valor (`empty`), y esas no tocan la sesión.
  const esNavegacion = request.headers.get("sec-fetch-dest") === "document";
  if (!esNavegacion) return NextResponse.next({ request });

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
  const ruta = request.nextUrl.pathname;

  // El manual se lee antes de iniciar sesión: es la puerta de entrada.
  const esPublica = ruta.startsWith("/ingresar") || ruta.startsWith("/auth")
    || ruta.startsWith("/manual");

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

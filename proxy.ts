import { NextResponse, type NextRequest } from "next/server";

/**
 * Manda a iniciar sesión a quien no la tiene.
 *
 * NO HABLA CON SUPABASE, y esa es la razón de ser de este archivo tal como
 * está. Antes creaba un cliente y llamaba a `getUser()` en cada petición. Eso
 * renueva el token cuando hace falta, y al renovarlo Supabase ROTA el token de
 * refresco: el anterior queda invalidado. Si esa cookie nueva no llega entera
 * al navegador —y entre redirecciones, precargas y peticiones paralelas no
 * siempre llega— el servidor contesta con una cookie vacía, el navegador
 * obedece y el usuario se queda fuera. Pasaba a la segunda navegación.
 *
 * Aquí solo se mira SI HAY cookie de sesión. Es una comprobación barata, no
 * toca el token y no puede invalidarlo. Quien de verdad comprueba la sesión es
 * `requerirSesion()` en cada página, y quien de verdad decide qué datos salen
 * es la RLS de la base. El proxy es la comodidad de redirigir antes de pintar
 * nada; nunca fue el candado.
 *
 * Efecto secundario conocido: nadie renueva el token por el camino, así que la
 * sesión dura lo que dura el token de acceso —una hora— y después hay que
 * volver a entrar. Es un trato razonable: una hora de trabajo seguido a cambio
 * de que la sesión no se caiga sola. Cuando haga falta más, el sitio correcto
 * para renovar es un punto único del lado del cliente, no en cada petición.
 */
export function proxy(request: NextRequest) {
  const ruta = request.nextUrl.pathname;

  // El manual se lee antes de iniciar sesión: es la puerta de entrada.
  const esPublica = ruta.startsWith("/ingresar") || ruta.startsWith("/manual");

  // @supabase/ssr guarda la sesión en `sb-<ref>-auth-token`, partida en
  // `.0`, `.1`… cuando no cabe en una cookie.
  const hayCookieDeSesion = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token") && c.value);

  if (!hayCookieDeSesion && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/ingresar";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (hayCookieDeSesion && ruta.startsWith("/ingresar")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

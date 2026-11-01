import { NextResponse, type NextRequest } from "next/server";
import { haySesionUtil } from "@/lib/token-sesion";

/**
 * Manda a iniciar sesión a quien no la tiene.
 *
 * NO HABLA CON SUPABASE, y esa es la razón de ser de este archivo tal como
 * está. Antes creaba un cliente y llamaba a `getUser()` en cada petición. Eso
 * renueva el token cuando hace falta, y al renovarlo Supabase ROTA el token de
 * refresco: el anterior queda invalidado. Si esa cookie nueva no llega entera
 * al navegador —y entre redirecciones, precargas y peticiones paralelas no
 * siempre llega— el servidor contesta con una cookie vacía, el navegador
 * obedece y el usuario se queda fuera.
 *
 * Aquí la sesión se comprueba sin salir del servidor: se lee el token de la
 * cookie y se mira si sigue vigente. Es barato, no toca el token y no puede
 * invalidarlo. Quien de verdad decide qué datos salen es la RLS de la base; el
 * guardia es la comodidad de redirigir antes de pintar nada.
 *
 * Y lo hace con `haySesionUtil`, la MISMA función que usa `requerirSesion()`
 * en cada página. Eso no es un detalle: antes el guardia miraba solo si había
 * cookie y la página miraba si el token servía, y con un token vencido se
 * contradecían. El guardia mandaba al tablero porque había cookie, el tablero
 * mandaba a iniciar sesión porque el token ya no valía, y el navegador rebotaba
 * entre los dos hasta morir con ERR_TOO_MANY_REDIRECTS. No se podía ni llegar
 * al formulario, y pasaba en todos los aparatos a la vez, porque en todos
 * estaba la cookie vieja.
 *
 * La cookie muerta no se borra aquí a propósito. Borrar cookies desde el
 * servidor es justo lo que causó el fallo anterior, y no hace falta: una
 * cookie que no sirve ya cuenta como no tener sesión, y al entrar de nuevo se
 * sobreescribe sola.
 *
 * Efecto secundario conocido y todavía sin resolver: nadie renueva el token
 * por el camino, así que la sesión dura lo que dura el token de acceso —una
 * hora— y después hay que volver a entrar. Ahora al menos se puede: antes de
 * esto, la hora se cumplía y el sitio quedaba inaccesible.
 */
export function proxy(request: NextRequest) {
  const ruta = request.nextUrl.pathname;

  // El manual se lee antes de iniciar sesión: es la puerta de entrada.
  const esPublica = ruta.startsWith("/ingresar") || ruta.startsWith("/manual");

  const conSesion = haySesionUtil(request.cookies.getAll());

  if (!conSesion && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/ingresar";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Quien ya entró no tiene nada que hacer en el formulario... salvo cuando
  // viene con un aviso. `requerirSesion()` manda a `/ingresar?error=inactivo`
  // cuando el token es válido pero el perfil está desactivado o no existe. Sin
  // esta excepción sería el mismo rebote de antes con otro disfraz: la página
  // manda al formulario, el guardia lo devuelve al tablero, y vuelta a empezar.
  if (conSesion && ruta.startsWith("/ingresar") && !request.nextUrl.searchParams.has("error")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

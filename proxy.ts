import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refresca la sesión de Supabase en cada petición y cierra las rutas de la app. */
export async function proxy(request: NextRequest) {
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

  if (!user && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/ingresar";
    return NextResponse.redirect(url);
  }
  if (user && ruta.startsWith("/ingresar")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return respuesta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

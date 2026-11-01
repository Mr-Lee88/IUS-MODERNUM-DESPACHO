/**
 * Qué cuenta como sesión. Una sola definición, para el guardia de rutas y para
 * las páginas.
 *
 * Esto existe por un fallo concreto: el guardia miraba solo SI HABÍA cookie y
 * las páginas miraban si el token SERVÍA. Con un token vencido los dos tenían
 * razón y se contradecían: el guardia mandaba al tablero porque había cookie,
 * el tablero mandaba a iniciar sesión porque el token ya no valía, y el
 * navegador rebotaba entre los dos hasta rendirse. El usuario no llegaba nunca
 * al formulario, y le pasaba en todos sus aparatos, porque en todos tenía la
 * cookie vieja.
 *
 * La regla que esto fija: **una cookie que no sirve es lo mismo que no tener
 * cookie.** Quien decide eso es este archivo, y nadie más.
 *
 * Son funciones puras, sin `next/headers` y sin `server-only`, porque el
 * guardia de rutas corre en el borde y no puede importar ninguna de las dos.
 */

export type Galleta = { name: string; value: string };

/** Descodifica base64 a texto. Sirve igual en el borde y en Node. */
function deBase64(s: string): string {
  return atob(s);
}

/**
 * Junta la cookie de sesión de @supabase/ssr y saca el token de acceso.
 *
 * La sesión se guarda en `sb-<ref>-auth-token`, partida en `.0`, `.1`… cuando
 * no cabe en una sola cookie. Se excluye `-code-verifier`, que lleva el mismo
 * prefijo pero no es la sesión: pegarla dentro rompería el JSON.
 */
export function tokenDeSesion(galletas: Galleta[]): string | null {
  const trozos = galletas
    .filter(
      (c) =>
        c.name.startsWith("sb-") &&
        c.name.includes("auth-token") &&
        !c.name.includes("code-verifier") &&
        c.value,
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  if (trozos.length === 0) return null;

  let crudo = trozos.map((c) => c.value).join("");
  if (crudo.startsWith("base64-")) {
    try {
      crudo = deBase64(crudo.slice("base64-".length));
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

/**
 * De un token de acceso, el identificador del usuario, o `null` si no sirve.
 *
 * Se lee la carga del JWT sin verificar la firma, y a propósito: verificarla
 * exigiría ir por red a Supabase en cada petición, que es justo lo que antes
 * tiraba la sesión. No debilita nada, porque con ese identificador solo se
 * decide a quién se le pinta la interfaz; quién puede ver qué datos lo decide
 * siempre la RLS de la base, que sí verifica la firma.
 */
export function sujetoVigente(token: string | null): string | null {
  if (!token) return null;
  try {
    const carga = token.split(".")[1];
    if (!carga) return null;
    const normal = carga.replace(/-/g, "+").replace(/_/g, "/");
    const json = deBase64(normal + "=".repeat((4 - (normal.length % 4)) % 4));
    const { sub, exp } = JSON.parse(json) as { sub?: string; exp?: number };
    // Un token vencido no sirve ni para preguntar.
    if (!sub || (exp && exp * 1000 < Date.now())) return null;
    return sub;
  } catch {
    return null;
  }
}

/** Atajo: ¿esta petición trae una sesión que sirva? */
export function haySesionUtil(galletas: Galleta[]): boolean {
  return sujetoVigente(tokenDeSesion(galletas)) !== null;
}

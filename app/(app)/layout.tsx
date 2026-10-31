import { BarraLateral, NavegacionMovil } from "@/components/app/barra-lateral";
import { BarraSuperior } from "@/components/app/barra-superior";

/**
 * Armazón de la aplicación.
 *
 * Paso 1 de la fase 1: todavía no hay sesión ni base de datos, así que el rol está
 * fijo en "socio" para poder ver todas las pantallas. En el paso 4 esto se sustituye
 * por `requerirSesion()` y el rol sale del perfil de Supabase.
 */
export default function LayoutApp({ children }: { children: React.ReactNode }) {
  const rol = "socio";

  return (
    <div className="flex min-h-screen">
      <BarraLateral rol={rol} />
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperior />
        <main className="flex-1 px-4 pb-24 pt-5 md:px-6 md:pb-8">{children}</main>
      </div>
      <NavegacionMovil />
    </div>
  );
}

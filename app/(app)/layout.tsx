import { BarraLateral, NavegacionMovil } from "@/components/app/barra-lateral";
import { BarraSuperior } from "@/components/app/barra-superior";
import { requerirSesion } from "@/lib/sesion";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const perfil = await requerirSesion();
  // La ilustración de la barra es opcional. Es una bandera, no una consulta al
  // disco: mirar el sistema de archivos en tiempo de ejecución obliga a Next a
  // empaquetar todo el proyecto dentro de la función, y en Vercel la carpeta
  // public ni siquiera existe ahí. Al añadir public/ilustracion.webp, se pone
  // en true.
  const hayIlustracion = false;

  return (
    <div className="flex min-h-screen">
      <BarraLateral perfil={perfil} hayIlustracion={hayIlustracion} />
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperior />
        <main className="flex-1 px-4 pb-24 pt-5 md:px-6 md:pb-8">{children}</main>
      </div>
      <NavegacionMovil />
    </div>
  );
}

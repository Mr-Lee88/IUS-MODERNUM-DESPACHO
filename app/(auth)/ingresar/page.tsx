import Image from "next/image";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioIngreso } from "./formulario";

export const metadata = { title: "Entrar" };

export default async function PaginaIngresar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const supabase = await crearClienteServidor();
  const { data: hayUsuarios } = await supabase.rpc("hay_usuarios");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--marfil)] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex w-full justify-center rounded-sm bg-[var(--verde)] px-6 py-5">
            <Image
              src="/logo.png"
              alt="IUS MODERNUM Abogados"
              width={800}
              height={166}
              priority
              className="h-auto w-[82%]"
            />
          </span>
          <h1 className="sr-only">IUS MODERNUM</h1>
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            Toda la información de un asunto, en segundos.
          </p>
        </div>

        <div className="filete-dorado border border-[var(--border)] bg-white p-6">
          {p.error === "inactivo" && (
            <p role="alert" className="mb-4 border border-[var(--vence-hoy)]/40 px-3 py-2 text-sm text-[var(--vence-hoy)]">
              Su cuenta está desactivada. Hable con el socio.
            </p>
          )}
          <FormularioIngreso primerUso={!hayUsuarios} />
        </div>

        <p className="mt-4 text-center text-[11px] text-[var(--muted-foreground)]">
          Información sujeta a secreto profesional.
        </p>
      </div>
    </div>
  );
}

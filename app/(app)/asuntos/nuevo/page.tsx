import Link from "next/link";
import { leerCatalogos } from "@/lib/catalogos-servidor";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FormularioAsunto } from "./formulario";

export const metadata = { title: "Nuevo asunto" };

export default async function PaginaNuevoAsunto({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const preseleccionado = typeof p.cliente === "string" ? p.cliente : undefined;

  const supabase = await crearClienteServidor();
  const [catalogos, { data: clientes }] = await Promise.all([
    leerCatalogos(),
    supabase
      .from("cliente")
      .select("id, nombre_o_razon_social")
      .is("archivado_en", null)
      .order("nombre_o_razon_social"),
  ]);

  const opcionesCliente = (clientes ?? []).map((c) => ({
    clave: c.id,
    nombre: c.nombre_o_razon_social,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <nav className="text-xs text-[var(--muted-foreground)]">
        <Link href="/asuntos" className="underline-offset-2 hover:underline">Asuntos</Link>
        <span aria-hidden> › </span>
        <span>Nuevo</span>
      </nav>

      <div>
        <h1 className="text-xl text-[var(--verde)]">Nuevo asunto</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          El cliente y la contraparte quedan como partes del asunto, cada una con su
          carácter procesal.
        </p>
      </div>

      {opcionesCliente.length === 0 && (
        <p className="border border-[var(--dorado)] bg-white px-4 py-3 text-sm">
          Todavía no hay clientes.{" "}
          <Link href="/clientes/nuevo" className="font-medium text-[var(--dorado-tinta)] underline-offset-4 hover:underline">
            Dé de alta uno primero
          </Link>
          : un asunto siempre es de alguien.
        </p>
      )}

      <FormularioAsunto
        catalogos={catalogos}
        clientes={opcionesCliente}
        clientePreseleccionado={preseleccionado}
        hoy={new Date().toISOString().slice(0, 10)}
      />
    </div>
  );
}

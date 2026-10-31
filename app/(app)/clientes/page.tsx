import Link from "next/link";
import { Plus, UserRound } from "lucide-react";
import { Seccion } from "@/components/app/piezas";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Clientes" };

const ESTADOS: Record<string, string> = {
  activo: "Activo",
  prospecto: "Prospecto",
  inactivo: "Inactivo",
};

export default async function PaginaClientes() {
  const supabase = await crearClienteServidor();
  const { data: clientes } = await supabase
    .from("cliente")
    .select("id, nombre_o_razon_social, tipo_persona, rfc, telefono, correo, ciudad, estado_cliente")
    .is("archivado_en", null)
    .order("nombre_o_razon_social");

  const lista = clientes ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-xl text-[var(--verde)]">Clientes</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {lista.length} {lista.length === 1 ? "cliente" : "clientes"}
        </p>
        <Link
          href="/clientes/nuevo"
          data-toque
          className="ml-auto flex h-11 items-center gap-2 rounded-sm bg-[var(--verde)] px-3 text-sm font-medium text-white hover:bg-[var(--verde-claro)] md:h-9"
        >
          <Plus className="size-4" aria-hidden />
          Nuevo cliente
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="filete-dorado border border-[var(--border)] bg-white p-8 text-center">
          <UserRound className="mx-auto size-8 text-[var(--dorado-tinta)]" aria-hidden />
          <p className="mt-3 text-sm">Todavía no hay clientes.</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Puede darlos de alta uno por uno, o cargar varios de golpe con la plantilla
            de Excel.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/clientes/nuevo" className="h-11 rounded-sm bg-[var(--verde)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--verde-claro)]">
              Capturar a mano
            </Link>
            <Link href="/importar" className="h-11 rounded-sm border border-[var(--border)] px-4 py-3 text-sm hover:border-[var(--verde-claro)]">
              Cargar con plantilla
            </Link>
          </div>
        </div>
      ) : (
        <Seccion titulo="Lista de clientes">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                  <th scope="col" className="px-4 py-2 font-medium">Nombre o razón social</th>
                  <th scope="col" className="px-4 py-2 font-medium">Tipo</th>
                  <th scope="col" className="px-4 py-2 font-medium">RFC</th>
                  <th scope="col" className="px-4 py-2 font-medium">Contacto</th>
                  <th scope="col" className="px-4 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/60">
                    <td className="px-4 py-3">
                      <Link href={`/clientes/${c.id}`} className="font-medium text-[var(--verde)] underline-offset-2 hover:underline">
                        {c.nombre_o_razon_social}
                      </Link>
                      {c.ciudad && (
                        <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">{c.ciudad}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{c.tipo_persona === "fisica" ? "Física" : "Moral"}</td>
                    <td className="px-4 py-3">{c.rfc ?? "—"}</td>
                    <td className="px-4 py-3">
                      {c.telefono ?? "—"}
                      {c.correo && (
                        <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">{c.correo}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{ESTADOS[c.estado_cliente] ?? c.estado_cliente}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-[var(--border)] md:hidden">
            {lista.map((c) => (
              <li key={c.id}>
                <Link href={`/clientes/${c.id}`} className="block px-4 py-3">
                  <p className="font-medium text-[var(--verde)]">{c.nombre_o_razon_social}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {c.tipo_persona === "fisica" ? "Física" : "Moral"}
                    {c.rfc && ` · ${c.rfc}`}
                    {` · ${ESTADOS[c.estado_cliente] ?? c.estado_cliente}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Seccion>
      )}
    </div>
  );
}

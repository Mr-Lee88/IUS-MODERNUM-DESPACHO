import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { Seccion } from "@/components/app/piezas";
import { uno } from "@/lib/supabase/relaciones";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("cliente").select("nombre_o_razon_social").eq("id", id).single();
  return { title: data?.nombre_o_razon_social ?? "Cliente" };
}

const ESTADOS: Record<string, string> = {
  activo: "Activo", prospecto: "Prospecto", inactivo: "Inactivo",
};

export default async function PaginaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const { data: cliente } = await supabase
    .from("cliente")
    .select("*")
    .eq("id", id)
    .single();

  if (!cliente) notFound();

  // Los asuntos del cliente: los que lo tienen como parte.
  const { data: partes } = await supabase
    .from("parte")
    .select("caracter, asunto:asunto_id (id, nombre, materia_clave, numero_expediente, anio, etapa, estado_asunto)")
    .eq("cliente_id", id);

  const asuntos = (partes ?? []).flatMap((p) => {
    const a = uno(p.asunto);
    return a ? [{ ...a, caracter: p.caracter }] : [];
  });

  const domicilio = [cliente.calle_y_numero, cliente.colonia, cliente.ciudad, cliente.estado, cliente.cp]
    .filter(Boolean).join(", ");

  return (
    <div className="space-y-5">
      <nav className="text-xs text-[var(--muted-foreground)]">
        <Link href="/clientes" className="underline-offset-2 hover:underline">Clientes</Link>
        <span aria-hidden> › </span>
        <span>{cliente.nombre_o_razon_social}</span>
      </nav>

      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl text-[var(--verde)]">{cliente.nombre_o_razon_social}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Persona {cliente.tipo_persona === "fisica" ? "física" : "moral"}
            {cliente.rfc && ` · ${cliente.rfc}`}
            {` · ${ESTADOS[cliente.estado_cliente] ?? cliente.estado_cliente}`}
          </p>
        </div>
        <Link
          href={`/asuntos/nuevo?cliente=${cliente.id}`}
          data-toque
          className="flex h-11 items-center gap-2 rounded-sm bg-[var(--verde)] px-3 text-sm font-medium text-white hover:bg-[var(--verde-claro)] md:h-9"
        >
          <Plus className="size-4" aria-hidden />
          Abrir asunto
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Seccion titulo="Asuntos del cliente" nota={`${asuntos.length}`}>
          {asuntos.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              Este cliente todavía no tiene asuntos.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {asuntos.map((a) => (
                <li key={a.id}>
                  <Link href={`/asuntos/${a.id}`} className="block px-4 py-3">
                    <p className="font-medium text-[var(--verde)]">{a.nombre}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      {a.materia_clave}
                      {a.numero_expediente && ` · ${a.numero_expediente}/${a.anio ?? ""}`}
                      {` · ${a.etapa}`} · como {a.caracter}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <aside className="space-y-5">
          <Seccion titulo="Datos de contacto">
            <dl className="divide-y divide-[var(--border)] text-sm">
              {[
                ["Representante", cliente.representante],
                ["Teléfono", cliente.telefono],
                ["Correo", cliente.correo],
                ["Domicilio", domicilio || null],
                ["Cliente desde", cliente.cliente_desde],
              ].map(([k, v]) => (
                <div key={k as string} className="flex gap-3 px-4 py-2.5">
                  <dt className="w-28 shrink-0 text-xs uppercase tracking-wider text-[var(--muted-foreground)]">{k}</dt>
                  <dd className="min-w-0 flex-1">{v || "—"}</dd>
                </div>
              ))}
            </dl>
          </Seccion>

          {cliente.observaciones_internas && (
            <Seccion titulo="Observaciones internas" nota="No las ve el cliente">
              <p className="px-4 py-3 text-sm">{cliente.observaciones_internas}</p>
            </Seccion>
          )}
        </aside>
      </div>
    </div>
  );
}

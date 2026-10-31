import Link from "next/link";
import { FileText, Lock } from "lucide-react";
import { Seccion } from "@/components/app/piezas";
import { uno } from "@/lib/supabase/relaciones";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Documentos" };

const ACCESO: Record<string, string> = {
  socio: "Solo el socio",
  equipo: "El despacho",
  cliente: "También el cliente",
};

export default async function PaginaDocumentos() {
  const supabase = await crearClienteServidor();

  const [{ data: documentos }, { data: tipos }] = await Promise.all([
    supabase
      .from("documento")
      .select(`
        id, nombre_original, tipo_documental, fecha_documento, tamano,
        nivel_acceso, estado_revision, origen, descripcion, creado_en,
        asunto:asunto_id (id, nombre),
        subio:subido_por (nombre)
      `)
      .is("archivado_en", null)
      .order("creado_en", { ascending: false }),
    supabase.from("tipo_documento").select("clave, nombre").order("orden"),
  ]);

  const nombreTipo = new Map((tipos ?? []).map((t) => [t.clave, t.nombre]));
  const lista = documentos ?? [];
  // Lo que subió un cliente entra pendiente de revisión: va primero (§6).
  const pendientes = lista.filter((d) => d.estado_revision === "pendiente");
  const resto = lista.filter((d) => d.estado_revision !== "pendiente");

  function Fila({ d }: { d: (typeof lista)[number] }) {
    const asunto = uno(d.asunto);
    return (
      <li className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
        <FileText className="size-4 shrink-0 text-[var(--dorado-tinta)]" aria-hidden />
        <span className="min-w-0 flex-1">
          <a href={`/documento/${d.id}`} className="font-medium text-[var(--verde)] underline-offset-2 hover:underline">
            {d.nombre_original}
          </a>
          <span className="block text-xs text-[var(--muted-foreground)]">
            {nombreTipo.get(d.tipo_documental) ?? d.tipo_documental}
            {d.fecha_documento && ` · ${d.fecha_documento}`}
            {d.tamano != null && ` · ${Math.max(1, Math.round(d.tamano / 1024))} KB`}
            {uno(d.subio)?.nombre && ` · subió ${uno(d.subio)?.nombre}`}
          </span>
          {asunto && (
            <Link href={`/asuntos/${asunto.id}?t=documentos`} className="block text-xs text-[var(--dorado-tinta)] underline-offset-2 hover:underline">
              {asunto.nombre}
            </Link>
          )}
        </span>
        <span className="inline-flex items-center gap-1 border border-[var(--border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
          {d.nivel_acceso === "socio" && <Lock className="size-3" aria-hidden />}
          {ACCESO[d.nivel_acceso] ?? d.nivel_acceso}
        </span>
      </li>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-xl text-[var(--verde)]">Documentos</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {lista.length} {lista.length === 1 ? "documento" : "documentos"}
        </p>
      </div>

      {pendientes.length > 0 && (
        <Seccion titulo="Pendientes de revisión" nota="Los subió un cliente; no entran al expediente hasta aprobarlos">
          <ul className="divide-y divide-[var(--border)]">
            {pendientes.map((d) => <Fila key={d.id} d={d} />)}
          </ul>
        </Seccion>
      )}

      {lista.length === 0 ? (
        <div className="filete-dorado border border-[var(--border)] bg-white p-8 text-center">
          <FileText className="mx-auto size-8 text-[var(--dorado-tinta)]" aria-hidden />
          <p className="mt-3 text-sm">Todavía no hay documentos.</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Se suben desde cada asunto, en su pestaña Documentos.
          </p>
        </div>
      ) : (
        <Seccion titulo="Todos los documentos">
          <ul className="divide-y divide-[var(--border)]">
            {resto.map((d) => <Fila key={d.id} d={d} />)}
          </ul>
        </Seccion>
      )}

      <p className="text-xs text-[var(--muted-foreground)]">
        El almacenamiento es privado: no hay dirección permanente de ningún archivo.
        Cada descarga pasa por el servidor, que comprueba quién pregunta y firma un
        enlace que caduca a los dos minutos.
      </p>
    </div>
  );
}

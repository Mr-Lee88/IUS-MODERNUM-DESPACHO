import Link from "next/link";
import { FileText, FolderOpen, MessageSquare, UserRound } from "lucide-react";
import { Seccion } from "@/components/app/piezas";
import { ASUNTOS, DOCUMENTOS, GESTIONES } from "@/lib/maqueta";

export const metadata = { title: "Buscar" };

/**
 * Resultados del buscador universal (§2.A).
 *
 * Paso 1: busca sobre la maqueta en memoria, solo para probar la pantalla. En el
 * paso 9 esto llama a la función `buscar_todo` de Postgres, con `tsvector`, índice
 * GIN y la RLS del usuario que pregunta. Nada se filtra en el navegador.
 */
export default async function PaginaBuscar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const q = (typeof p.q === "string" ? p.q : "").trim();
  const aguja = q.toLowerCase();

  const asuntos = q
    ? ASUNTOS.filter((a) =>
        [a.nombre, a.cliente, a.expediente ?? "", a.organo, a.procedimiento, a.materia]
          .join(" ").toLowerCase().includes(aguja))
    : [];
  const clientes = q
    ? [...new Set(ASUNTOS.map((a) => a.cliente))].filter((c) => c.toLowerCase().includes(aguja))
    : [];
  const gestiones = q
    ? GESTIONES.filter((g) => [g.titulo, g.descripcion, g.tipo].join(" ").toLowerCase().includes(aguja))
    : [];
  const documentos = q ? DOCUMENTOS.filter((d) => d.nombre.toLowerCase().includes(aguja)) : [];

  const total = asuntos.length + clientes.length + gestiones.length + documentos.length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl text-[var(--verde)]">Buscar</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {q
            ? `${total} ${total === 1 ? "resultado" : "resultados"} para «${q}»`
            : "Escriba algo en el buscador: Ctrl + K desde cualquier pantalla."}
        </p>
      </div>

      {clientes.length > 0 && (
        <Seccion titulo="Clientes" nota={`${clientes.length}`}>
          <ul className="divide-y divide-[var(--border)]">
            {clientes.map((c) => (
              <li key={c} className="flex items-center gap-3 px-4 py-3 text-sm">
                <UserRound className="size-4 shrink-0 text-[var(--dorado-tinta)]" aria-hidden />
                <Link href="/clientes" className="underline-offset-2 hover:underline">{c}</Link>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {asuntos.length > 0 && (
        <Seccion titulo="Asuntos" nota={`${asuntos.length}`}>
          <ul className="divide-y divide-[var(--border)]">
            {asuntos.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                <FolderOpen className="mt-0.5 size-4 shrink-0 text-[var(--dorado-tinta)]" aria-hidden />
                <span className="min-w-0">
                  <Link href={`/asuntos/${a.id}`} className="font-medium text-[var(--verde)] underline-offset-2 hover:underline">
                    {a.nombre}
                  </Link>
                  <span className="block text-xs text-[var(--muted-foreground)]">
                    {a.cliente} · {a.procedimiento}
                    {a.expediente && ` · ${a.expediente}`} · {a.organo}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {gestiones.length > 0 && (
        <Seccion titulo="Gestiones" nota={`${gestiones.length}`}>
          <ul className="divide-y divide-[var(--border)]">
            {gestiones.map((g) => (
              <li key={g.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                <MessageSquare className="mt-0.5 size-4 shrink-0 text-[var(--dorado-tinta)]" aria-hidden />
                <span className="min-w-0">
                  <Link href={`/asuntos/${g.asuntoId}?t=bitacora`} className="font-medium text-[var(--verde)] underline-offset-2 hover:underline">
                    {g.titulo}
                  </Link>
                  <span className="block text-xs text-[var(--muted-foreground)]">
                    {g.ocurrioEn} · {g.tipo} · {g.descripcion}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {documentos.length > 0 && (
        <Seccion titulo="Documentos" nota={`${documentos.length}`}>
          <ul className="divide-y divide-[var(--border)]">
            {documentos.map((d) => (
              <li key={d.nombre} className="flex items-center gap-3 px-4 py-3 text-sm">
                <FileText className="size-4 shrink-0 text-[var(--dorado-tinta)]" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{d.nombre}</span>
                <span className="text-xs text-[var(--muted-foreground)]">{d.fecha}</span>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {q && total === 0 && (
        <p className="border border-[var(--border)] bg-white px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
          Nada coincide con «{q}» en la maqueta.
        </p>
      )}
    </div>
  );
}

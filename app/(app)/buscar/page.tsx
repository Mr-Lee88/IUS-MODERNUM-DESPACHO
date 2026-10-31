import Link from "next/link";
import { FileText, FolderOpen, MessageSquare, Users, UserRound } from "lucide-react";
import { Seccion } from "@/components/app/piezas";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Buscar" };

interface Resultado {
  tipo: "cliente" | "asunto" | "gestion" | "parte" | "documento";
  id: string;
  titulo: string;
  detalle: string | null;
  asunto_id: string | null;
  relevancia: number;
}

const GRUPOS = [
  { tipo: "cliente", etiqueta: "Clientes", icono: UserRound },
  { tipo: "asunto", etiqueta: "Asuntos", icono: FolderOpen },
  { tipo: "gestion", etiqueta: "Gestiones", icono: MessageSquare },
  { tipo: "parte", etiqueta: "Partes", icono: Users },
  { tipo: "documento", etiqueta: "Documentos", icono: FileText },
] as const;

function destino(r: Resultado) {
  if (r.tipo === "cliente") return `/clientes/${r.id}`;
  if (r.tipo === "asunto") return `/asuntos/${r.id}`;
  if (r.tipo === "gestion") return `/asuntos/${r.asunto_id}?t=bitacora`;
  if (r.tipo === "parte") return `/asuntos/${r.asunto_id}?t=partes`;
  return `/asuntos/${r.asunto_id}?t=documentos`;
}

export default async function PaginaBuscar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const q = (typeof p.q === "string" ? p.q : "").trim();

  let resultados: Resultado[] = [];
  let fallo: string | null = null;

  if (q) {
    // La búsqueda ocurre en Postgres con tsvector e índice GIN, y la RLS filtra
    // lo que cada quien puede ver. Nada se descarga al navegador para filtrarlo.
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.rpc("buscar_todo", { consulta: q });
    if (error) fallo = error.message;
    else resultados = (data ?? []) as Resultado[];
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl text-[var(--verde)]">Buscar</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {q
            ? `${resultados.length} ${resultados.length === 1 ? "resultado" : "resultados"} para «${q}»`
            : "Abra el buscador con Ctrl + K desde cualquier pantalla."}
        </p>
      </div>

      {fallo && (
        <p role="alert" className="border border-[var(--vence-hoy)]/40 px-4 py-3 text-sm text-[var(--vence-hoy)]">
          No se pudo buscar: {fallo}
        </p>
      )}

      {GRUPOS.map(({ tipo, etiqueta, icono: Icono }) => {
        const grupo = resultados.filter((r) => r.tipo === tipo);
        if (!grupo.length) return null;
        return (
          <Seccion key={tipo} titulo={etiqueta} nota={`${grupo.length}`}>
            <ul className="divide-y divide-[var(--border)]">
              {grupo.map((r) => (
                <li key={`${r.tipo}-${r.id}`} className="flex items-start gap-3 px-4 py-3 text-sm">
                  <Icono className="mt-0.5 size-4 shrink-0 text-[var(--dorado-tinta)]" aria-hidden />
                  <span className="min-w-0">
                    <Link href={destino(r)} className="font-medium text-[var(--verde)] underline-offset-2 hover:underline">
                      {r.titulo}
                    </Link>
                    {r.detalle && (
                      <span className="block text-xs text-[var(--muted-foreground)]">{r.detalle}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Seccion>
        );
      })}

      {q && !fallo && resultados.length === 0 && (
        <p className="border border-[var(--border)] bg-white px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
          Nada coincide con «{q}».
        </p>
      )}
    </div>
  );
}

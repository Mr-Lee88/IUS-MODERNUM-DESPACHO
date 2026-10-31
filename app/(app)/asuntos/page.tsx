import Link from "next/link";
import { FolderOpen, Plus } from "lucide-react";
import { Seccion } from "@/components/app/piezas";
import { leerCatalogos } from "@/lib/catalogos-servidor";
import { uno } from "@/lib/supabase/relaciones";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Asuntos" };

type Filtros = { materia?: string; etapa?: string; responsable?: string };

/** §3: los filtros viajan en la dirección del navegador; copiar la liga reproduce la vista. */
function liga(filtros: Filtros, cambio: Filtros) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...filtros, ...cambio })) {
    if (v) p.set(k, v);
  }
  const q = p.toString();
  return q ? `/asuntos?${q}` : "/asuntos";
}

function GrupoFiltro({
  titulo, campo, opciones, todas, filtros,
}: {
  titulo: string;
  campo: keyof Filtros;
  opciones: { clave: string; nombre: string }[];
  todas: string;
  filtros: Filtros;
}) {
  const actual = filtros[campo];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-24 shrink-0 text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
        {titulo}
      </span>
      {[{ clave: "", nombre: todas }, ...opciones].map((o) => {
        const activo = (actual ?? "") === o.clave;
        return (
          <Link
            key={o.clave || "todas"}
            href={liga(filtros, { [campo]: o.clave || undefined })}
            aria-current={activo ? "true" : undefined}
            className={
              activo
                ? "rounded-sm bg-[var(--verde)] px-2.5 py-1 text-xs font-medium text-white"
                : "rounded-sm border border-[var(--border)] bg-white px-2.5 py-1 text-xs hover:border-[var(--verde-claro)]"
            }
          >
            {o.nombre}
          </Link>
        );
      })}
    </div>
  );
}

export default async function PaginaAsuntos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const filtros: Filtros = {
    materia: typeof p.materia === "string" ? p.materia : undefined,
    etapa: typeof p.etapa === "string" ? p.etapa : undefined,
    responsable: typeof p.responsable === "string" ? p.responsable : undefined,
  };

  const supabase = await crearClienteServidor();
  const catalogos = await leerCatalogos();

  // El filtrado ocurre en Postgres, no en el navegador (§10).
  let consulta = supabase
    .from("asunto")
    .select(`
      id, nombre, numero_expediente, anio, ambito, etapa, estado_asunto, actualizado_en,
      materia:materia_clave (nombre),
      procedimiento:procedimiento_clave (nombre),
      organo:organo_id (nombre),
      responsable:responsable_id (nombre),
      partes:parte (nombre, es_nuestro_cliente)
    `)
    .is("archivado_en", null);

  if (filtros.materia) consulta = consulta.eq("materia_clave", filtros.materia);
  if (filtros.etapa) consulta = consulta.eq("etapa", filtros.etapa);
  if (filtros.responsable) consulta = consulta.eq("responsable_id", filtros.responsable);

  const { data: asuntos } = await consulta.order("actualizado_en", { ascending: false });
  const lista = asuntos ?? [];
  const hayFiltros = Boolean(filtros.materia || filtros.etapa || filtros.responsable);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-xl text-[var(--verde)]">Asuntos</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {lista.length} {lista.length === 1 ? "asunto" : "asuntos"}
          {hayFiltros && " con estos filtros"}
        </p>
        <Link
          href="/asuntos/nuevo"
          data-toque
          className="ml-auto flex h-11 items-center gap-2 rounded-sm bg-[var(--verde)] px-3 text-sm font-medium text-white hover:bg-[var(--verde-claro)] md:h-9"
        >
          <Plus className="size-4" aria-hidden />
          Nuevo asunto
        </Link>
      </div>

      <div className="space-y-3 border border-[var(--border)] bg-white p-4">
        <GrupoFiltro titulo="Materia" campo="materia" opciones={catalogos.materias} todas="Todas" filtros={filtros} />
        <GrupoFiltro titulo="Etapa" campo="etapa" opciones={catalogos.etapas.slice(0, 6)} todas="Todas" filtros={filtros} />
        <GrupoFiltro titulo="Responsable" campo="responsable" opciones={catalogos.responsables} todas="Todos" filtros={filtros} />
        {hayFiltros && (
          <Link href="/asuntos" className="inline-block text-xs font-medium text-[var(--dorado-tinta)] underline-offset-4 hover:underline">
            Limpiar filtros
          </Link>
        )}
      </div>

      {lista.length === 0 ? (
        <div className="filete-dorado border border-[var(--border)] bg-white p-8 text-center">
          <FolderOpen className="mx-auto size-8 text-[var(--dorado-tinta)]" aria-hidden />
          <p className="mt-3 text-sm">
            {hayFiltros ? "Ningún asunto cumple estos filtros." : "Todavía no hay asuntos."}
          </p>
          {!hayFiltros && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href="/asuntos/nuevo" className="h-11 rounded-sm bg-[var(--verde)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--verde-claro)]">
                Abrir un asunto
              </Link>
              <Link href="/importar" className="h-11 rounded-sm border border-[var(--border)] px-4 py-3 text-sm hover:border-[var(--verde-claro)]">
                Cargar con plantilla
              </Link>
            </div>
          )}
        </div>
      ) : (
        <Seccion titulo="Lista de asuntos">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                  <th scope="col" className="px-4 py-2 font-medium">Asunto</th>
                  <th scope="col" className="px-4 py-2 font-medium">Cliente</th>
                  <th scope="col" className="px-4 py-2 font-medium">Materia</th>
                  <th scope="col" className="px-4 py-2 font-medium">Órgano y expediente</th>
                  <th scope="col" className="px-4 py-2 font-medium">Etapa</th>
                  <th scope="col" className="px-4 py-2 font-medium">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((a) => {
                  const cliente = a.partes?.find((pa) => pa.es_nuestro_cliente)?.nombre ?? "—";
                  const procedimiento = uno(a.procedimiento);
                  const organo = uno(a.organo);
                  return (
                    <tr key={a.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/60">
                      <td className="px-4 py-3">
                        <Link href={`/asuntos/${a.id}`} className="font-medium text-[var(--verde)] underline-offset-2 hover:underline">
                          {a.nombre}
                        </Link>
                        {procedimiento?.nombre && (
                          <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                            {procedimiento.nombre}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{cliente}</td>
                      <td className="px-4 py-3">{uno(a.materia)?.nombre}</td>
                      <td className="px-4 py-3">
                        {organo?.nombre ?? "Sin órgano"}
                        <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                          {a.numero_expediente ? `${a.numero_expediente}/${a.anio ?? ""}` : "Sin expediente"}
                          {` · ${a.ambito === "federal" ? "Federal" : "Local Campeche"}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">{a.etapa}</td>
                      <td className="px-4 py-3">{uno(a.responsable)?.nombre ?? "Sin asignar"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-[var(--border)] md:hidden">
            {lista.map((a) => (
              <li key={a.id}>
                <Link href={`/asuntos/${a.id}`} className="block px-4 py-3">
                  <p className="font-medium text-[var(--verde)]">{a.nombre}</p>
                  <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                    {uno(a.procedimiento)?.nombre ?? uno(a.materia)?.nombre}
                    {a.numero_expediente && ` · ${a.numero_expediente}/${a.anio ?? ""}`}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {a.etapa} · {uno(a.responsable)?.nombre ?? "Sin asignar"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      <p className="text-xs text-[var(--muted-foreground)]">
        Los filtros viajan en la dirección del navegador: copiar la liga reproduce esta
        misma vista.
      </p>
    </div>
  );
}

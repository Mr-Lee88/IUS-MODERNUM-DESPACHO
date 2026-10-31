import Link from "next/link";
import { Seccion } from "@/components/app/piezas";
import { ASUNTOS, ETAPAS, MATERIAS, RESPONSABLES } from "@/lib/maqueta";

export const metadata = { title: "Asuntos" };

type Filtros = { materia?: string; etapa?: string; responsable?: string };

/** §3: los filtros viajan en la dirección del navegador; copiar la liga reproduce la vista. */
function liga(filtros: Filtros, cambio: Filtros) {
  const p = new URLSearchParams();
  const final = { ...filtros, ...cambio };
  for (const [k, v] of Object.entries(final)) {
    if (v && v !== "Todas" && v !== "Todos") p.set(k, v);
  }
  const q = p.toString();
  return q ? `/asuntos?${q}` : "/asuntos";
}

function GrupoFiltro({
  titulo,
  campo,
  opciones,
  todas,
  filtros,
}: {
  titulo: string;
  campo: keyof Filtros;
  opciones: string[];
  todas: string;
  filtros: Filtros;
}) {
  const actual = filtros[campo] ?? todas;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-24 shrink-0 text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
        {titulo}
      </span>
      {[todas, ...opciones].map((o) => {
        const activo = actual === o;
        return (
          <Link
            key={o}
            href={liga(filtros, { [campo]: o === todas ? undefined : o })}
            aria-current={activo ? "true" : undefined}
            className={
              activo
                ? "rounded-sm bg-[var(--verde)] px-2.5 py-1 text-xs font-medium text-white"
                : "rounded-sm border border-[var(--border)] bg-white px-2.5 py-1 text-xs hover:border-[var(--verde-claro)]"
            }
          >
            {o}
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

  const lista = ASUNTOS.filter(
    (a) =>
      (!filtros.materia || a.materia === filtros.materia) &&
      (!filtros.etapa || a.etapa === filtros.etapa) &&
      (!filtros.responsable || a.responsable === filtros.responsable),
  );

  const hayFiltros = Boolean(filtros.materia || filtros.etapa || filtros.responsable);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-xl text-[var(--verde)]">Asuntos</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {lista.length} {lista.length === 1 ? "asunto" : "asuntos"}
          {hayFiltros ? " con estos filtros" : " en la maqueta"}
        </p>
      </div>

      <div className="space-y-3 border border-[var(--border)] bg-white p-4">
        <GrupoFiltro titulo="Materia" campo="materia" opciones={MATERIAS} todas="Todas" filtros={filtros} />
        <GrupoFiltro titulo="Etapa" campo="etapa" opciones={ETAPAS.slice(0, 6)} todas="Todas" filtros={filtros} />
        <GrupoFiltro titulo="Responsable" campo="responsable" opciones={RESPONSABLES} todas="Todos" filtros={filtros} />
        {hayFiltros && (
          <Link href="/asuntos" className="inline-block text-xs font-medium text-[var(--dorado-tinta)] underline-offset-4 hover:underline">
            Limpiar filtros
          </Link>
        )}
      </div>

      <Seccion titulo="Lista de asuntos">
        {/* Escritorio */}
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
              {lista.map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/60">
                  <td className="px-4 py-3">
                    <Link href={`/asuntos/${a.id}`} className="font-medium text-[var(--verde)] underline-offset-2 hover:underline">
                      {a.nombre}
                    </Link>
                    <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                      {a.procedimiento}
                      {a.expediente && ` · ${a.expediente}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">{a.cliente}</td>
                  <td className="px-4 py-3">{a.materia}</td>
                  <td className="px-4 py-3">
                    {a.organo}
                    <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                      {a.expediente ?? "Sin expediente"} · {a.ambito}
                    </span>
                  </td>
                  <td className="px-4 py-3">{a.etapa}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-[var(--muted)] text-[10px] font-medium text-[var(--verde)]">
                        {a.iniciales}
                      </span>
                      {a.responsable}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Teléfono: tarjetas */}
        <ul className="divide-y divide-[var(--border)] md:hidden">
          {lista.map((a) => (
            <li key={a.id}>
              <Link href={`/asuntos/${a.id}`} className="block px-4 py-3">
                <p className="font-medium text-[var(--verde)]">{a.nombre}</p>
                <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                  {a.procedimiento}
                  {a.expediente && ` · ${a.expediente}`}
                </p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {a.materia} · {a.etapa} · {a.responsable}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        {lista.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
            Ningún asunto cumple estos filtros.
          </p>
        )}
      </Seccion>

      <p className="text-xs text-[var(--muted-foreground)]">
        Los filtros y el orden viajan en la dirección del navegador: copiar la liga
        reproduce esta misma vista.
      </p>
    </div>
  );
}

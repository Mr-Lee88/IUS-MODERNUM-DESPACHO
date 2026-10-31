import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Users } from "lucide-react";
import { Seccion } from "@/components/app/piezas";
import { requerirSesion } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { uno } from "@/lib/supabase/relaciones";
import { Anotar } from "./anotar";

/**
 * Detalle del asunto. Cinco pestañas, en el orden del §4:
 * BITÁCORA · DOCUMENTOS · AUDIENCIAS Y TÉRMINOS · PARTES · HONORARIOS.
 * La pestaña EXPEDIENTE del boceto se quitó por decisión de Irving (2026-10-31):
 * esos datos están en la ficha de la derecha, visibles sin dar un clic.
 */
const PESTANAS: { clave: string; etiqueta: string; soloSocio?: boolean }[] = [
  { clave: "bitacora", etiqueta: "Bitácora" },
  { clave: "documentos", etiqueta: "Documentos" },
  { clave: "terminos", etiqueta: "Audiencias y términos" },
  { clave: "partes", etiqueta: "Partes" },
  { clave: "honorarios", etiqueta: "Honorarios", soloSocio: true },
];

const CLASES: Record<string, string> = {
  hecho_procesal: "Hecho procesal",
  nota_interna: "Nota interna",
  administrativa: "Administrativa",
};

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
  "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function fechaLarga(iso: string | null) {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

/** El título de la pestaña del navegador lleva el nombre del asunto. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("asunto").select("nombre").eq("id", id).single();
  return { title: data?.nombre ?? "Asunto" };
}

export default async function PaginaAsunto({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const p = await searchParams;
  const perfil = await requerirSesion();
  const activa = typeof p.t === "string" ? p.t : "bitacora";

  const supabase = await crearClienteServidor();

  const { data: asunto } = await supabase
    .from("asunto")
    .select(`
      *,
      materia:materia_clave (nombre),
      procedimiento:procedimiento_clave (nombre),
      etapa_ref:etapa (nombre),
      organo:organo_id (nombre),
      responsable:responsable_id (nombre)
    `)
    .eq("id", id)
    .single();

  if (!asunto) notFound();

  const [{ data: gestiones }, { data: partes }, { data: documentos }, { data: eventos }, { data: tipos }] =
    await Promise.all([
      supabase.from("gestion")
        .select("*, autor:autor_id (nombre)")
        .eq("asunto_id", id).is("archivado_en", null)
        .order("ocurrio_en", { ascending: false }).order("creado_en", { ascending: false }),
      supabase.from("parte").select("*").eq("asunto_id", id).is("archivado_en", null),
      supabase.from("documento").select("*").eq("asunto_id", id).is("archivado_en", null)
        .order("creado_en", { ascending: false }),
      supabase.from("evento").select("*").eq("asunto_id", id).is("archivado_en", null)
        .order("fecha_limite", { nullsFirst: false }),
      supabase.from("tipo_gestion").select("clave, nombre, clase").order("orden"),
    ]);

  const cliente = (partes ?? []).find((pa) => pa.es_nuestro_cliente);
  const materia = uno(asunto.materia);
  const procedimiento = uno(asunto.procedimiento);
  const etapaRef = uno(asunto.etapa_ref);
  const organo = uno(asunto.organo);
  const responsable = uno(asunto.responsable);
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <nav className="text-xs text-[var(--muted-foreground)]">
        <Link href="/asuntos" className="underline-offset-2 hover:underline">Asuntos</Link>
        <span aria-hidden> › </span>
        <span>{asunto.nombre}</span>
      </nav>

      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl text-[var(--verde)]">{asunto.nombre}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {procedimiento?.nombre ?? materia?.nombre}
            {organo?.nombre && ` · ${organo.nombre}`}
            {asunto.numero_expediente && ` · ${asunto.numero_expediente}/${asunto.anio ?? ""}`}
            {` · ${asunto.ambito === "federal" ? "Federal" : "Local Campeche"}`}
          </p>
          <p className="mt-2 text-xs">
            <span className="border border-[var(--border)] px-2 py-0.5 uppercase tracking-wider">
              Etapa: {etapaRef?.nombre ?? asunto.etapa}
            </span>
          </p>
        </div>
        <Anotar asuntoId={asunto.id} tipos={tipos ?? []} hoy={hoy} />
      </div>

      <div role="tablist" aria-label="Secciones del asunto" className="flex flex-wrap gap-1 border-b border-[var(--border)]">
        {PESTANAS.filter((t) => !t.soloSocio || perfil.rol === "socio").map((t) => {
          const esActiva = activa === t.clave;
          return (
            <Link
              key={t.clave}
              href={`/asuntos/${asunto.id}?t=${t.clave}`}
              role="tab"
              aria-selected={esActiva}
              className={
                esActiva
                  ? "-mb-px border-b-2 border-[var(--verde)] px-3 py-2.5 text-sm font-medium text-[var(--verde)]"
                  : "-mb-px border-b-2 border-transparent px-3 py-2.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--verde)]"
              }
            >
              {t.etiqueta}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div>
          {activa === "bitacora" && (
            <Seccion titulo="Bitácora del asunto" nota={`${gestiones?.length ?? 0} registros`}>
              {!gestiones?.length ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                  Todavía no hay nada anotado. Use «Registrar gestión».
                </p>
              ) : (
                <ol className="divide-y divide-[var(--border)]">
                  {gestiones.map((g) => (
                    <li key={g.id} className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                        <time dateTime={g.ocurrio_en}>
                          {fechaLarga(g.ocurrio_en)}
                          {g.hora && ` · ${g.hora.slice(0, 5)}`}
                        </time>
                        <span className="border border-[var(--border)] px-1.5 py-0.5 uppercase tracking-wider">
                          {g.tipo}
                        </span>
                        <span className={g.clase === "nota_interna" ? "text-[var(--dorado-tinta)]" : undefined}>
                          {CLASES[g.clase]}
                        </span>
                        {!g.publicada_al_cliente && (
                          <span className="inline-flex items-center gap-1">
                            <Lock className="size-3" aria-hidden />
                            No visible al cliente
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 font-medium">{g.titulo}</p>
                      {g.descripcion && (
                        <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{g.descripcion}</p>
                      )}
                      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                        Capturó: {uno(g.autor)?.nombre ?? "—"} · el {fechaLarga(g.creado_en?.slice(0, 10))}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </Seccion>
          )}

          {activa === "documentos" && (
            <Seccion titulo="Documentos del asunto" nota={`${documentos?.length ?? 0}`}>
              <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                {documentos?.length
                  ? `${documentos.length} documentos.`
                  : "Todavía no hay documentos. La subida al almacenamiento privado llega en el paso 8."}
              </p>
            </Seccion>
          )}

          {activa === "terminos" && (
            <Seccion titulo="Audiencias y términos" nota={`${eventos?.length ?? 0}`}>
              <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                {eventos?.length
                  ? `${eventos.length} eventos.`
                  : "Sin audiencias ni términos capturados."}
              </p>
              <p className="border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted-foreground)]">
                El cómputo de plazos llega en la fase 2. Mientras tanto los términos se
                capturan a mano y nacen sin verificar: el sistema no calcula vencimientos
                a partir de suposiciones.
              </p>
            </Seccion>
          )}

          {activa === "partes" && (
            <Seccion titulo="Partes del asunto" nota="Cada persona con su carácter procesal">
              <ul className="divide-y divide-[var(--border)]">
                {(partes ?? []).map((pa) => (
                  <li key={pa.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <Users className="size-4 shrink-0 text-[var(--dorado-tinta)]" aria-hidden />
                    <span className="min-w-0 flex-1">{pa.nombre}</span>
                    <span className="border border-[var(--border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                      {pa.caracter}
                    </span>
                    {pa.es_nuestro_cliente && (
                      <span className="text-[10px] uppercase tracking-wider text-[var(--cumplido)]">
                        Nuestro cliente
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Seccion>
          )}

          {activa === "honorarios" && perfil.rol === "socio" && (
            <Seccion titulo="Honorarios" nota="Solo el socio ve esta pestaña">
              <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                Los honorarios llegan en la fase 3. En la base esta información también
                quedará cerrada: un abogado que consulte la API directamente no obtiene
                ninguna fila.
              </p>
            </Seccion>
          )}
        </div>

        <aside className="space-y-5">
          <Seccion titulo="Información general">
            <dl className="divide-y divide-[var(--border)] text-sm">
              {[
                ["Cliente", cliente?.nombre ?? "—"],
                ["Materia", materia?.nombre ?? asunto.materia_clave],
                ["Procedimiento", procedimiento?.nombre ?? "Sin definir"],
                ["Órgano", organo?.nombre ?? "Sin órgano"],
                ["Expediente", asunto.numero_expediente ? `${asunto.numero_expediente}/${asunto.anio ?? ""}` : "Sin expediente"],
                ["Fuero", asunto.ambito === "federal" ? "Federal" : "Local Campeche"],
                ["Etapa actual", etapaRef?.nombre ?? asunto.etapa],
                ["Responsable", responsable?.nombre ?? "Sin asignar"],
                ["Apertura", fechaLarga(asunto.fecha_apertura)],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 px-4 py-2.5">
                  <dt className="w-28 shrink-0 text-xs uppercase tracking-wider text-[var(--muted-foreground)]">{k}</dt>
                  <dd className="min-w-0 flex-1">{v}</dd>
                </div>
              ))}
            </dl>
          </Seccion>

          {asunto.observaciones && (
            <Seccion titulo="Observaciones">
              <p className="px-4 py-3 text-sm">{asunto.observaciones}</p>
            </Seccion>
          )}
        </aside>
      </div>
    </div>
  );
}

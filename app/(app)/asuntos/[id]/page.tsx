import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Lock, Plus, Users } from "lucide-react";
import { AvisoPorVerificar, ChipEstado, Seccion } from "@/components/app/piezas";
import {
  ASUNTOS, AUDIENCIAS, DOCUMENTOS, GESTIONES, HONORARIOS, PARTES, TERMINOS,
} from "@/lib/maqueta";

/**
 * Detalle del asunto. Cinco pestañas, en el orden del §4:
 * BITÁCORA · DOCUMENTOS · AUDIENCIAS Y TÉRMINOS · PARTES · HONORARIOS.
 * La pestaña EXPEDIENTE del boceto se quitó por decisión de Irving (2026-10-31):
 * esos datos están en la ficha de la derecha, visibles sin dar un clic.
 */
const PESTANAS = [
  { clave: "bitacora", etiqueta: "Bitácora" },
  { clave: "documentos", etiqueta: "Documentos" },
  { clave: "terminos", etiqueta: "Audiencias y términos" },
  { clave: "partes", etiqueta: "Partes" },
  { clave: "honorarios", etiqueta: "Honorarios", soloSocio: true },
] as const;

const PESOS = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

const CLASES: Record<string, string> = {
  hecho_procesal: "Hecho procesal",
  nota_interna: "Nota interna",
  administrativa: "Administrativa",
};

export default async function PaginaAsunto({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const p = await searchParams;
  const asunto = ASUNTOS.find((a) => a.id === id);
  if (!asunto) notFound();

  const rol = "socio"; // Paso 4: saldrá del perfil de la sesión
  const activa = typeof p.t === "string" ? p.t : "bitacora";
  const gestiones = GESTIONES.filter((g) => g.asuntoId === asunto.id);
  const terminos = TERMINOS.filter((t) => t.asuntoId === asunto.id);

  return (
    <div className="space-y-5">
      <nav className="text-xs text-[var(--muted-foreground)]">
        <Link href="/asuntos" className="underline-offset-2 hover:underline">Asuntos</Link>
        <span aria-hidden> › </span>
        <span>{asunto.nombre}</span>
      </nav>

      {/* Ficha: lo que el §4 pide ver sin dar un clic */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl text-[var(--verde)]">{asunto.nombre}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {asunto.procedimiento} · {asunto.organo}
            {asunto.expediente && ` · ${asunto.expediente}`} · {asunto.ambito}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="border border-[var(--border)] px-2 py-0.5 uppercase tracking-wider">
              Etapa: {asunto.etapa}
            </span>
            {terminos[0] && <ChipEstado estado={terminos[0].estado} />}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/asuntos/${asunto.id}?t=bitacora`}
            data-toque
            className="flex h-11 items-center gap-2 rounded-sm bg-[var(--verde)] px-3 text-sm font-medium text-white hover:bg-[var(--verde-claro)] md:h-9"
          >
            <Plus className="size-4" aria-hidden />
            Registrar gestión
          </Link>
        </div>
      </div>

      {/* Pestañas: el estado viaja en la URL */}
      <div role="tablist" aria-label="Secciones del asunto" className="flex flex-wrap gap-1 border-b border-[var(--border)]">
        {PESTANAS.filter((t) => !t.soloSocio || rol === "socio").map((t) => {
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
            <Seccion titulo="Bitácora del asunto" nota={`${gestiones.length} registros`}>
              <ol className="divide-y divide-[var(--border)]">
                {gestiones.map((g) => (
                  <li key={g.id} className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                      <time>{g.ocurrioEn} · {g.hora}</time>
                      <span className="border border-[var(--border)] px-1.5 py-0.5 uppercase tracking-wider">
                        {g.tipo}
                      </span>
                      <span className={g.clase === "nota_interna" ? "text-[var(--dorado-tinta)]" : undefined}>
                        {CLASES[g.clase]}
                      </span>
                      {!g.publicada && (
                        <span className="inline-flex items-center gap-1">
                          <Lock className="size-3" aria-hidden />
                          No visible al cliente
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 font-medium">{g.titulo}</p>
                    <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">{g.descripcion}</p>
                    {g.documento && (
                      <p className="mt-2 inline-flex items-center gap-2 border border-[var(--border)] px-2 py-1 text-xs">
                        <FileText className="size-3.5 shrink-0 text-[var(--dorado-tinta)]" aria-hidden />
                        {g.documento.nombre}
                        <span className="text-[var(--muted-foreground)]">({g.documento.peso})</span>
                      </p>
                    )}
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                      Capturó: {g.autor}
                    </p>
                  </li>
                ))}
              </ol>
            </Seccion>
          )}

          {activa === "documentos" && (
            <Seccion titulo="Documentos del asunto" nota={`${DOCUMENTOS.length} archivos`}>
              <ul className="divide-y divide-[var(--border)]">
                {DOCUMENTOS.filter((d) => rol === "socio" || d.nivelAcceso !== "socio").map((d) => (
                  <li key={d.nombre} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <FileText className="size-4 shrink-0 text-[var(--dorado-tinta)]" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{d.nombre}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{d.fecha} · {d.peso}</span>
                    <span className="inline-flex items-center gap-1 border border-[var(--border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                      {d.nivelAcceso === "socio" && <Lock className="size-3" aria-hidden />}
                      {d.nivelAcceso}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted-foreground)]">
                Cada documento guarda su nivel de acceso: socio, equipo o cliente. El
                almacenamiento es privado y cada descarga usa un enlace temporal.
              </p>
            </Seccion>
          )}

          {activa === "terminos" && (
            <Seccion titulo="Audiencias y términos">
              <ul className="divide-y divide-[var(--border)]">
                {terminos.map((t) => (
                  <li key={t.queVence} className="px-4 py-3">
                    <p className="font-medium">{t.queVence}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <ChipEstado estado={t.estado} />
                      <span>Vence: {t.fecha}</span>
                      {!t.verificado && <AvisoPorVerificar />}
                    </p>
                  </li>
                ))}
                {AUDIENCIAS.filter((a) => a.asunto.includes("Rosado Pech")).map((a) => (
                  <li key={a.dia} className="px-4 py-3">
                    <p className="font-medium">{a.tipo}</p>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {a.dia} {a.fecha} nov · {a.hora} · {a.organo}
                    </p>
                  </li>
                ))}
              </ul>
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
                {PARTES.map((pa) => (
                  <li key={pa.nombre} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <Users className="size-4 shrink-0 text-[var(--dorado-tinta)]" aria-hidden />
                    <span className="min-w-0 flex-1">
                      {pa.nombre}
                      {pa.representante && (
                        <span className="block text-xs text-[var(--muted-foreground)]">
                          Representante: {pa.representante}
                        </span>
                      )}
                    </span>
                    <span className="border border-[var(--border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                      {pa.caracter}
                    </span>
                    {pa.esCliente && (
                      <span className="text-[10px] uppercase tracking-wider text-[var(--cumplido)]">
                        Nuestro cliente
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted-foreground)]">
                Un asunto admite tantas partes como haga falta: litisconsorcio, varios
                herederos, terceros interesados.
              </p>
            </Seccion>
          )}

          {activa === "honorarios" && rol === "socio" && (
            <Seccion titulo="Honorarios" nota="Solo el socio ve esta pestaña">
              <dl className="divide-y divide-[var(--border)]">
                <div className="flex justify-between px-4 py-3 text-sm">
                  <dt>Presupuesto</dt>
                  <dd className="font-medium">{PESOS.format(HONORARIOS.presupuesto)}</dd>
                </div>
                <div className="flex justify-between px-4 py-3 text-sm">
                  <dt>Anticipo recibido</dt>
                  <dd className="font-medium">{PESOS.format(HONORARIOS.anticipo)}</dd>
                </div>
                <div className="flex justify-between px-4 py-3 text-sm">
                  <dt>Saldo</dt>
                  <dd className="font-medium text-[var(--dorado-tinta)]">{PESOS.format(HONORARIOS.saldo)}</dd>
                </div>
              </dl>
              <p className="border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--muted-foreground)]">
                En la base de datos esta información también queda cerrada: un abogado
                que consulte la API directamente no obtiene ninguna fila.
              </p>
            </Seccion>
          )}
        </div>

        {/* Columna de la derecha: información general */}
        <aside className="space-y-5">
          <Seccion titulo="Información general">
            <dl className="divide-y divide-[var(--border)] text-sm">
              {[
                ["Cliente", asunto.cliente],
                ["Materia", asunto.materia],
                ["Procedimiento", asunto.procedimiento],
                ["Órgano", asunto.organo],
                ["Expediente", asunto.expediente ?? "Sin expediente"],
                ["Fuero", asunto.ambito],
                ["Etapa actual", asunto.etapa],
                ["Responsable", asunto.responsable],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 px-4 py-2.5">
                  <dt className="w-28 shrink-0 text-xs uppercase tracking-wider text-[var(--muted-foreground)]">{k}</dt>
                  <dd className="min-w-0 flex-1">{v}</dd>
                </div>
              ))}
            </dl>
          </Seccion>

          <Seccion titulo="Documentos recientes" accion={{ href: `/asuntos/${asunto.id}?t=documentos`, texto: "Ver todos" }}>
            <ul className="divide-y divide-[var(--border)]">
              {DOCUMENTOS.slice(0, 3).map((d) => (
                <li key={d.nombre} className="flex items-center gap-2 px-4 py-2.5 text-xs">
                  <FileText className="size-3.5 shrink-0 text-[var(--dorado-tinta)]" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{d.nombre}</span>
                  <span className="text-[var(--muted-foreground)]">{d.fecha}</span>
                </li>
              ))}
            </ul>
          </Seccion>
        </aside>
      </div>
    </div>
  );
}

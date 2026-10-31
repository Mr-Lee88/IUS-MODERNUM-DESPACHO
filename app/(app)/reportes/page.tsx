import Link from "next/link";
import { AlertTriangle, CheckCircle2, Download, FileText } from "lucide-react";
import { Indicador, Seccion } from "@/components/app/piezas";
import { comoFalta, fechaCorta } from "@/lib/agenda";
import { reunirReporte } from "@/lib/reportes";
import { requerirSesion } from "@/lib/sesion";

export const metadata = { title: "Reportes y control" };

const PESOS = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

function Barras({ titulo, filas, total }: { titulo: string; filas: { etiqueta: string; valor: number }[]; total: number }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">{titulo}</p>
      {filas.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Sin datos.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {filas.map((f) => (
            <li key={f.etiqueta} className="flex items-center gap-3 text-sm">
              <span className="w-36 shrink-0 truncate">{f.etiqueta}</span>
              <span className="h-2 flex-1 bg-[var(--muted)]">
                <span
                  className="block h-2 bg-[var(--verde-claro)]"
                  style={{ width: `${total > 0 ? Math.max(3, (f.valor / total) * 100) : 3}%` }}
                />
              </span>
              <span className="w-6 shrink-0 text-right font-medium">{f.valor}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function PaginaReportes() {
  const perfil = await requerirSesion();
  const r = await reunirReporte(perfil.nombre, perfil.rol === "socio");
  const total = r.porMateria.reduce((t, f) => t + f.valor, 0);

  const avisos = [
    { etiqueta: "Términos sin verificar", valor: r.terminosSinVerificar,
      nota: "Nadie los ha confirmado: el sistema no los da por buenos." },
    { etiqueta: "Términos bloqueados por falta de datos", valor: r.terminosBloqueados,
      nota: "Falta la fecha de notificación o la de efectos; sin eso no se computa." },
    { etiqueta: "Documentos pendientes de revisión", valor: r.documentosPendientes,
      nota: "Los subió un cliente y no han entrado al expediente." },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-xl text-[var(--verde)]">Reportes y control</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Corte al {fechaCorta(r.corteAl)}
        </p>
        <a
          href="/reporte"
          className="ml-auto flex h-11 items-center gap-2 rounded-sm bg-[var(--verde)] px-3 text-sm font-medium text-white hover:bg-[var(--verde-claro)] md:h-9"
        >
          <Download className="size-4" aria-hidden />
          Descargar en PDF
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Indicador etiqueta="Asuntos activos" valor={String(r.asuntosActivos)} pie={`${r.asuntosArchivados} archivados`} />
        <Indicador etiqueta="Clientes" valor={String(r.clientes)} pie="Dados de alta" />
        <Indicador etiqueta="Vencen en 30 días" valor={String(r.vencimientos.length)} pie="Términos" />
        <Indicador etiqueta="Audiencias" valor={String(r.audiencias.length)} pie="Programadas" />
      </div>

      <Seccion titulo="Cómo se reparten los asuntos">
        <div className="divide-y divide-[var(--border)]">
          <Barras titulo="Por materia" filas={r.porMateria} total={total} />
          <Barras titulo="Por abogado responsable" filas={r.porResponsable} total={total} />
          <Barras titulo="Por etapa procesal" filas={r.porEtapa} total={total} />
        </div>
      </Seccion>

      <div className="grid gap-5 xl:grid-cols-2">
        <Seccion titulo="Próximos vencimientos" nota="Treinta días" accion={{ href: "/agenda?vista=lista", texto: "Ver la agenda" }}>
          {r.vencimientos.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              No hay términos con vencimiento próximo.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {r.vencimientos.map((v) => (
                <li key={v.titulo + v.fecha} className="px-4 py-3">
                  <p className="text-sm font-medium">{v.titulo}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{v.asunto}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className={v.faltan !== null && v.faltan <= 0 ? "font-medium text-[var(--vence-hoy)]" : "text-[var(--muted-foreground)]"}>
                      {fechaCorta(v.fecha)} · {v.faltan !== null ? comoFalta(v.faltan) : "—"}
                    </span>
                    {!v.verificado && (
                      <span className="border border-[var(--por-verificar)]/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--por-verificar)]">
                        Sin verificar
                      </span>
                    )}
                    {v.bloqueado && (
                      <span className="inline-flex items-center gap-1 border border-[var(--vence-hoy)]/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--vence-hoy)]">
                        <AlertTriangle className="size-3" aria-hidden />
                        Falta un dato
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <Seccion titulo="Audiencias programadas" accion={{ href: "/agenda?vista=mes", texto: "Ver el mes" }}>
          {r.audiencias.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              No hay audiencias programadas.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {r.audiencias.map((a) => (
                <li key={a.titulo + a.fecha} className="px-4 py-3">
                  <p className="text-sm font-medium">{a.titulo}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{a.asunto}</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {fechaCorta(a.fecha)}{a.hora && `, ${a.hora} h`}
                    {a.organo && ` · ${a.organo}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Seccion>
      </div>

      <Seccion titulo="Lo que pide atención">
        <ul className="divide-y divide-[var(--border)]">
          {avisos.map((a) => (
            <li key={a.etiqueta} className="flex flex-wrap items-center gap-3 px-4 py-3">
              {a.valor > 0
                ? <AlertTriangle className="size-4 shrink-0 text-[var(--vence-hoy)]" aria-hidden />
                : <CheckCircle2 className="size-4 shrink-0 text-[var(--cumplido)]" aria-hidden />}
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{a.etiqueta}</span>
                <span className="block text-xs text-[var(--muted-foreground)]">{a.nota}</span>
              </span>
              <span className="text-lg font-medium" style={{ color: a.valor > 0 ? "var(--vence-hoy)" : "var(--cumplido)" }}>
                {a.valor}
              </span>
            </li>
          ))}
        </ul>
      </Seccion>

      {r.finanzas && (
        <Seccion titulo="Honorarios" nota="Solo usted ve esta sección" accion={{ href: "/honorarios", texto: "Ver el detalle" }}>
          <dl className="grid grid-cols-2 divide-x divide-y divide-[var(--border)] sm:grid-cols-4 sm:divide-y-0">
            {[
              ["Devengado", r.finanzas.devengado],
              ["Cobrado", r.finanzas.cobrado],
              ["Por cobrar", r.finanzas.saldo],
              ["Gastos", r.finanzas.gastos],
            ].map(([k, v]) => (
              <div key={k as string} className="px-4 py-3">
                <dt className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">{k}</dt>
                <dd className="mt-1 font-[family-name:var(--font-serif)] text-lg text-[var(--verde)]">
                  {PESOS.format(v as number)}
                </dd>
              </div>
            ))}
          </dl>
        </Seccion>
      )}

      <div className="filete-dorado border border-[var(--border)] bg-white p-4">
        <p className="flex items-start gap-2 text-sm">
          <FileText className="mt-0.5 size-4 shrink-0 text-[var(--dorado-tinta)]" aria-hidden />
          <span>
            El PDF lleva estas mismas cifras, con el membrete del despacho. Las dos
            pantallas y el documento leen de la misma fuente: si leyeran por separado,
            tarde o temprano dirían cosas distintas.
            {perfil.rol !== "socio" && " El reporte que usted descarga no incluye honorarios."}
          </span>
        </p>
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          Pendientes del módulo 7, para cuando se construyan: estado de poderes y
          personalidad, y revisión de conflictos de intereses. Hacen falta las tablas
          de poderes, que llegan con la fase 3.
        </p>
      </div>
    </div>
  );
}

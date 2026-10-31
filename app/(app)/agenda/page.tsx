import Link from "next/link";
import {
  AlertTriangle, CalendarClock, ChevronLeft, ChevronRight,
  CheckCircle2, Gavel, HelpCircle, MapPin, Users,
} from "lucide-react";
import { Seccion } from "@/components/app/piezas";
import {
  DIAS_CORTOS, comoFalta, diaDe, diasDelMes, diasHasta, fechaCorta, fechaLarga,
  hoyIso, horaDe, lunesDe, mesYAnio, primerDiaDelMes, sumarDias, sumarMeses, aFecha,
} from "@/lib/agenda";
import { uno } from "@/lib/supabase/relaciones";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Agenda y términos" };

type Vista = "dia" | "semana" | "mes" | "lista";
const VISTAS: { clave: Vista; etiqueta: string }[] = [
  { clave: "dia", etiqueta: "Día" },
  { clave: "semana", etiqueta: "Semana" },
  { clave: "mes", etiqueta: "Mes" },
  { clave: "lista", etiqueta: "Lista" },
];

/** §4: los eventos se clasifican, y cada clase se reconoce por texto e icono. */
const CLASES: Record<string, { nombre: string; icono: typeof Gavel; color: string }> = {
  audiencia:    { nombre: "Audiencia",    icono: Gavel,         color: "var(--verde)" },
  termino:      { nombre: "Término",      icono: CalendarClock, color: "var(--proximo)" },
  diligencia:   { nombre: "Diligencia",   icono: MapPin,        color: "var(--verde-claro)" },
  reunion:      { nombre: "Reunión",      icono: Users,         color: "var(--grafito)" },
  interna:      { nombre: "Interna",      icono: Users,         color: "var(--grafito)" },
  recordatorio: { nombre: "Recordatorio", icono: HelpCircle,    color: "var(--por-verificar)" },
};

interface Evento {
  id: string;
  clase: string;
  titulo: string;
  fecha_hora: string | null;
  fecha_limite: string | null;
  estado: string;
  estado_verificacion: string;
  bloqueado_por_falta_de_datos: boolean;
  fundamento_texto: string | null;
  observaciones: string | null;
  ubicacion: string | null;
  dias: number | null;
  unidad: string | null;
  fecha_notificacion: string | null;
  surte_efectos_en: string | null;
  asunto: { id: string; nombre: string; materia_clave: string } | null;
  organo: { nombre: string } | null;
}

/** La fecha que manda: para un término, su vencimiento; para lo demás, la cita. */
function diaDelEvento(e: Evento): string | null {
  return e.clase === "termino" ? e.fecha_limite : diaDe(e.fecha_hora);
}

function liga(vista: Vista, f: string) {
  return `/agenda?vista=${vista}&f=${f}`;
}

function Ficha({ e, compacto = false }: { e: Evento; compacto?: boolean }) {
  const meta = CLASES[e.clase] ?? CLASES.recordatorio;
  const Icono = meta.icono;
  const dia = diaDelEvento(e);
  const hora = horaDe(e.fecha_hora);
  const faltan = dia ? diasHasta(dia) : null;
  const vencido = e.clase === "termino" && faltan !== null && faltan < 0 && e.estado !== "cumplido";

  return (
    <article className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: meta.color }}>
          <Icono className="size-3.5 shrink-0" aria-hidden />
          {meta.nombre}
        </span>
        {hora && <span className="text-[var(--muted-foreground)]">{hora} h</span>}
        {faltan !== null && (
          <span className={vencido ? "font-medium text-[var(--vence-hoy)]" : "text-[var(--muted-foreground)]"}>
            {vencido ? "Venció" : comoFalta(faltan)}
          </span>
        )}
        {/* §4: ningún término se da por bueno sin que lo verifique el abogado. */}
        {e.clase === "termino" && e.estado_verificacion === "pendiente_verificar" && (
          <span className="inline-flex items-center gap-1 border border-[var(--por-verificar)]/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--por-verificar)]">
            <HelpCircle className="size-3" aria-hidden />
            Sin verificar
          </span>
        )}
        {e.bloqueado_por_falta_de_datos && (
          <span className="inline-flex items-center gap-1 border border-[var(--vence-hoy)]/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--vence-hoy)]">
            <AlertTriangle className="size-3" aria-hidden />
            Falta un dato para computar
          </span>
        )}
        {e.estado === "cumplido" && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--cumplido)]">
            <CheckCircle2 className="size-3" aria-hidden />
            Cumplido
          </span>
        )}
      </div>

      <p className="mt-1.5 font-medium">{e.titulo}</p>

      {e.asunto && (
        <Link
          href={`/asuntos/${e.asunto.id}?t=terminos`}
          className="mt-0.5 block text-xs text-[var(--dorado-tinta)] underline-offset-2 hover:underline"
        >
          {e.asunto.nombre}
        </Link>
      )}

      {!compacto && (
        <>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {e.organo?.nombre}
            {e.ubicacion && ` · ${e.ubicacion}`}
          </p>
          {e.clase === "termino" && (e.fecha_notificacion || e.dias) && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {e.fecha_notificacion && `Notificado el ${fechaCorta(e.fecha_notificacion)}`}
              {e.surte_efectos_en && ` · surtió efectos el ${fechaCorta(e.surte_efectos_en)}`}
              {e.dias && ` · ${e.dias} días ${e.unidad === "habiles" ? "hábiles" : "naturales"}`}
            </p>
          )}
          {e.fundamento_texto && (
            <p className="mt-1 border-l-2 border-[var(--dorado)] pl-2 text-xs text-[var(--muted-foreground)]">
              {e.fundamento_texto}
            </p>
          )}
          {e.observaciones && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{e.observaciones}</p>
          )}
        </>
      )}
    </article>
  );
}

export default async function PaginaAgenda({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const vista = (typeof p.vista === "string" && ["dia", "semana", "mes", "lista"].includes(p.vista)
    ? p.vista : "semana") as Vista;
  const hoy = hoyIso();
  const foco = typeof p.f === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.f) ? p.f : hoy;

  // Rango que se consulta, según la vista.
  let desde = foco, hasta = foco;
  if (vista === "semana") { desde = lunesDe(foco); hasta = sumarDias(desde, 6); }
  if (vista === "mes") { desde = primerDiaDelMes(foco); hasta = sumarDias(desde, diasDelMes(foco) - 1); }
  if (vista === "lista") { desde = sumarDias(hoy, -30); hasta = sumarDias(hoy, 120); }

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("evento")
    .select(`
      id, clase, titulo, fecha_hora, fecha_limite, estado, estado_verificacion,
      bloqueado_por_falta_de_datos, fundamento_texto, observaciones, ubicacion,
      dias, unidad, fecha_notificacion, surte_efectos_en,
      asunto:asunto_id (id, nombre, materia_clave),
      organo:organo_id (nombre)
    `)
    .is("archivado_en", null)
    .or(`and(fecha_limite.gte.${desde},fecha_limite.lte.${hasta}),and(fecha_hora.gte.${desde}T00:00:00,fecha_hora.lte.${hasta}T23:59:59)`);

  const eventos: Evento[] = (data ?? []).map((e) => ({
    ...e,
    asunto: uno(e.asunto),
    organo: uno(e.organo),
  })) as Evento[];

  // Agrupados por día, para las vistas de día, semana y mes.
  const porDia = new Map<string, Evento[]>();
  for (const e of eventos) {
    const d = diaDelEvento(e);
    if (!d) continue;
    if (!porDia.has(d)) porDia.set(d, []);
    porDia.get(d)!.push(e);
  }
  for (const lista of porDia.values()) {
    lista.sort((a, b) => (horaDe(a.fecha_hora) ?? "99").localeCompare(horaDe(b.fecha_hora) ?? "99"));
  }

  const ordenados = [...eventos].sort((a, b) =>
    (diaDelEvento(a) ?? "9999").localeCompare(diaDelEvento(b) ?? "9999"));

  // Navegación: un paso atrás y uno adelante, según la vista.
  const paso = vista === "mes" ? 0 : vista === "semana" ? 7 : 1;
  const anterior = vista === "mes" ? sumarMeses(foco, -1) : sumarDias(foco, -paso);
  const siguiente = vista === "mes" ? sumarMeses(foco, 1) : sumarDias(foco, paso);

  const titulo =
    vista === "dia" ? fechaLarga(foco)
    : vista === "semana" ? `Semana del ${fechaCorta(desde)} al ${fechaCorta(hasta)}`
    : vista === "mes" ? mesYAnio(foco)
    : "Del mes pasado a los próximos cuatro meses";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-xl text-[var(--verde)]">Agenda y términos</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {eventos.length} {eventos.length === 1 ? "evento" : "eventos"}
        </p>
      </div>

      {/* Selector de vista y navegación. Todo viaja en la URL. */}
      <div className="flex flex-wrap items-center gap-3 border border-[var(--border)] bg-white p-3">
        <div className="flex gap-1" role="tablist" aria-label="Vista de la agenda">
          {VISTAS.map((v) => (
            <Link
              key={v.clave}
              href={liga(v.clave, foco)}
              role="tab"
              aria-selected={vista === v.clave}
              className={
                vista === v.clave
                  ? "rounded-sm bg-[var(--verde)] px-3 py-1.5 text-xs font-medium text-white"
                  : "rounded-sm border border-[var(--border)] px-3 py-1.5 text-xs hover:border-[var(--verde-claro)]"
              }
            >
              {v.etiqueta}
            </Link>
          ))}
        </div>

        {vista !== "lista" && (
          <div className="flex items-center gap-1">
            <Link href={liga(vista, anterior)} aria-label="Periodo anterior"
              className="flex size-9 items-center justify-center rounded-sm border border-[var(--border)] hover:border-[var(--verde-claro)]">
              <ChevronLeft className="size-4" aria-hidden />
            </Link>
            <Link href={liga(vista, hoy)}
              className="rounded-sm border border-[var(--border)] px-3 py-2 text-xs hover:border-[var(--verde-claro)]">
              Hoy
            </Link>
            <Link href={liga(vista, siguiente)} aria-label="Periodo siguiente"
              className="flex size-9 items-center justify-center rounded-sm border border-[var(--border)] hover:border-[var(--verde-claro)]">
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        )}

        <p className="text-sm text-[var(--muted-foreground)] first-letter:uppercase">{titulo}</p>
      </div>

      {/* ---------- DÍA ---------- */}
      {vista === "dia" && (
        <Seccion titulo="Lo de este día">
          {!porDia.get(foco)?.length ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              Nada agendado para este día.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {porDia.get(foco)!.map((e) => <Ficha key={e.id} e={e} />)}
            </div>
          )}
        </Seccion>
      )}

      {/* ---------- SEMANA ---------- */}
      {vista === "semana" && (
        <div className="grid gap-3 lg:grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => sumarDias(desde, i)).map((d) => {
            const delDia = porDia.get(d) ?? [];
            const esHoy = d === hoy;
            const f = aFecha(d);
            return (
              <section
                key={d}
                className={`border bg-white ${esHoy ? "border-[var(--verde)]" : "border-[var(--border)]"}`}
              >
                <h2 className={`border-b px-3 py-2 text-[11px] ${esHoy ? "border-[var(--verde)] bg-[var(--verde)] text-white" : "border-[var(--border)] text-[var(--muted-foreground)]"}`}>
                  {DIAS_CORTOS[f.getUTCDay()]} {f.getUTCDate()}
                  {esHoy && " · hoy"}
                </h2>
                {delDia.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-[var(--muted-foreground)]">—</p>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {delDia.map((e) => <Ficha key={e.id} e={e} compacto />)}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* ---------- MES ---------- */}
      {vista === "mes" && (
        <div className="border border-[var(--border)] bg-white">
          <div className="grid grid-cols-7 border-b border-[var(--border)]">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <div key={d} className="px-2 py-2 text-center text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {/* Huecos antes del día 1, para que caiga en su columna. */}
            {Array.from({ length: (aFecha(desde).getUTCDay() + 6) % 7 }, (_, i) => (
              <div key={`hueco-${i}`} className="min-h-24 border-b border-r border-[var(--border)] bg-[var(--muted)]/30" />
            ))}
            {Array.from({ length: diasDelMes(foco) }, (_, i) => sumarDias(desde, i)).map((d) => {
              const delDia = porDia.get(d) ?? [];
              const esHoy = d === hoy;
              return (
                <div key={d} className={`min-h-24 border-b border-r border-[var(--border)] p-1.5 ${esHoy ? "bg-[var(--verde)]/5" : ""}`}>
                  <Link href={liga("dia", d)} className="block text-xs font-medium underline-offset-2 hover:underline">
                    <span className={esHoy ? "inline-flex size-5 items-center justify-center rounded-full bg-[var(--verde)] text-white" : undefined}>
                      {aFecha(d).getUTCDate()}
                    </span>
                  </Link>
                  <ul className="mt-1 space-y-0.5">
                    {delDia.slice(0, 3).map((e) => {
                      const meta = CLASES[e.clase] ?? CLASES.recordatorio;
                      return (
                        <li key={e.id}>
                          <Link
                            href={e.asunto ? `/asuntos/${e.asunto.id}?t=terminos` : liga("dia", d)}
                            className="block truncate border-l-2 pl-1 text-[10px] leading-tight hover:underline"
                            style={{ borderColor: meta.color }}
                            title={e.titulo}
                          >
                            {horaDe(e.fecha_hora) && <span className="font-medium">{horaDe(e.fecha_hora)} </span>}
                            {e.titulo}
                          </Link>
                        </li>
                      );
                    })}
                    {delDia.length > 3 && (
                      <li className="text-[10px] text-[var(--muted-foreground)]">
                        y {delDia.length - 3} más
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------- LISTA ---------- */}
      {vista === "lista" && (
        <Seccion titulo="Todo, en orden" nota={`${ordenados.length} eventos`}>
          {ordenados.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              No hay nada agendado en este periodo.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {ordenados.map((e) => {
                const d = diaDelEvento(e);
                return (
                  <div key={e.id}>
                    <p className="bg-[var(--muted)]/50 px-4 py-1 text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                      {fechaLarga(d)}
                    </p>
                    <Ficha e={e} />
                  </div>
                );
              })}
            </div>
          )}
        </Seccion>
      )}

      <p className="text-xs text-[var(--muted-foreground)]">
        El sistema todavía <strong>no computa plazos</strong>. Las fechas límite que
        aparecen son las que capturó una persona, y por eso salen marcadas como «sin
        verificar». El cómputo automático llega con los catálogos normativos y los
        calendarios de días inhábiles de cada fuero; hasta entonces, la verificación
        es del abogado responsable.
      </p>
    </div>
  );
}

import Link from "next/link";
import { ChipEstado, Indicador, Seccion } from "@/components/app/piezas";
import { ASUNTOS, AUDIENCIAS, INDICADORES, MOVIMIENTOS, TERMINOS } from "@/lib/maqueta";

export const metadata = { title: "Asuntos del día" };

const PESOS = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

function hoyLargo() {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date("2026-10-31T12:00:00"));
}

export default function PaginaPanel() {
  const recientes = [...ASUNTOS].slice(0, 5);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl text-[var(--verde)]">Asuntos del día</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)] first-letter:uppercase">{hoyLargo()}</p>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Indicador
          etiqueta="Vencen esta semana"
          valor={String(INDICADORES.terminosSemana)}
          pie="Términos"
        />
        <Indicador
          etiqueta="Audiencias"
          valor={String(INDICADORES.audienciasSemana)}
          pie="Próximos 7 días"
        />
        <Indicador
          etiqueta="Asuntos activos"
          valor={String(INDICADORES.asuntosActivos)}
          pie={`De ${INDICADORES.asuntosTotales} en total`}
        />
        {/* §4: el dinero solo lo ve el socio. En el paso 4 esto se condiciona al rol. */}
        <Indicador
          etiqueta="Por cobrar"
          valor={PESOS.format(INDICADORES.porCobrar)}
          pie={`En ${INDICADORES.clientesPorCobrar} clientes`}
        />
      </div>

      {/* Lo que vence primero */}
      <Seccion
        titulo="Lo que vence primero"
        nota="Términos por vencer"
        accion={{ href: "/agenda", texto: "Ver toda la agenda" }}
      >
        {/* Escritorio: tabla */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                <th scope="col" className="px-4 py-2 font-medium">Asunto</th>
                <th scope="col" className="px-4 py-2 font-medium">Qué vence</th>
                <th scope="col" className="px-4 py-2 font-medium">Cuándo</th>
                <th scope="col" className="px-4 py-2 font-medium">Responsable</th>
              </tr>
            </thead>
            <tbody>
              {TERMINOS.map((t) => (
                <tr key={t.asuntoId + t.queVence} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/60">
                  <td className="px-4 py-3">
                    <Link href={`/asuntos/${t.asuntoId}`} className="font-medium text-[var(--verde)] underline-offset-2 hover:underline">
                      {t.asunto}
                    </Link>
                    <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                      {t.procedimiento}
                      {t.expediente && ` · ${t.expediente}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">{t.queVence}</td>
                  <td className="px-4 py-3">
                    <ChipEstado estado={t.estado} />
                    <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                      {t.cuando} · {t.fecha}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-[var(--muted)] text-[10px] font-medium text-[var(--verde)]">
                        {t.iniciales}
                      </span>
                      {t.responsable}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Teléfono: cada fila es una tarjeta con los tres datos que importan */}
        <ul className="divide-y divide-[var(--border)] md:hidden">
          {TERMINOS.map((t) => (
            <li key={t.asuntoId + t.queVence}>
              <Link href={`/asuntos/${t.asuntoId}`} className="block px-4 py-3">
                <p className="font-medium text-[var(--verde)]">{t.queVence}</p>
                <p className="mt-0.5 text-sm">{t.asunto}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <ChipEstado estado={t.estado} />
                  <span>{t.fecha}</span>
                  <span>· {t.responsable}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Seccion>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Audiencias de la semana */}
        <Seccion titulo="Audiencias de la semana" accion={{ href: "/agenda", texto: "Ver agenda completa" }}>
          <ul className="divide-y divide-[var(--border)]">
            {AUDIENCIAS.map((a) => (
              <li key={a.dia + a.fecha} className="flex gap-4 px-4 py-3">
                <span className="flex w-12 shrink-0 flex-col items-center border-r border-[var(--border)] pr-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">{a.dia}</span>
                  <span className="font-[family-name:var(--font-serif)] text-lg text-[var(--verde)]">{a.fecha}</span>
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{a.tipo} · {a.hora}</span>
                  <span className="block text-xs text-[var(--muted-foreground)]">{a.organo}</span>
                  <span className="block truncate text-xs text-[var(--muted-foreground)]">{a.asunto}</span>
                </span>
              </li>
            ))}
          </ul>
        </Seccion>

        {/* Últimos movimientos */}
        <Seccion titulo="Últimos movimientos" accion={{ href: "/asuntos", texto: "Ver todos" }}>
          <ul className="divide-y divide-[var(--border)]">
            {MOVIMIENTOS.map((m) => (
              <li key={m.texto} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] text-[10px] font-medium text-[var(--verde)]">
                  {m.iniciales}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm">{m.texto}</span>
                  <span className="block text-xs text-[var(--muted-foreground)]">{m.cuando}</span>
                </span>
              </li>
            ))}
          </ul>
        </Seccion>
      </div>

      {/* Asuntos recientes */}
      <Seccion
        titulo="Asuntos recientes"
        nota="Con movimiento reciente"
        accion={{ href: "/asuntos", texto: "Ver todos los asuntos" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                <th scope="col" className="px-4 py-2 font-medium">Cliente</th>
                <th scope="col" className="px-4 py-2 font-medium">Asunto / expediente</th>
                <th scope="col" className="px-4 py-2 font-medium">Estado</th>
                <th scope="col" className="px-4 py-2 font-medium">Última actualización</th>
              </tr>
            </thead>
            <tbody>
              {recientes.map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/60">
                  <td className="px-4 py-3">{a.cliente}</td>
                  <td className="px-4 py-3">
                    <Link href={`/asuntos/${a.id}`} className="font-medium text-[var(--verde)] underline-offset-2 hover:underline">
                      {a.procedimiento}
                    </Link>
                    {a.expediente && <span className="text-[var(--muted-foreground)]"> · {a.expediente}</span>}
                  </td>
                  <td className="px-4 py-3">{a.estado}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{a.ultimaActualizacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Seccion>

      <p className="text-xs text-[var(--muted-foreground)]">
        Armazón visual con datos ficticios. Las pantallas se conectan a la base en los
        pasos 5 a 9 de la fase 1.
      </p>
    </div>
  );
}

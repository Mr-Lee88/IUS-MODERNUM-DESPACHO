import Link from "next/link";
import { Plus, UserRound } from "lucide-react";
import { Indicador, Seccion } from "@/components/app/piezas";
import { requerirSesion } from "@/lib/sesion";
import { uno } from "@/lib/supabase/relaciones";
import { crearClienteServidor } from "@/lib/supabase/server";

export const metadata = { title: "Asuntos del día" };

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
  "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function fechaDeHoy() {
  const d = new Date();
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export default async function PaginaPanel() {
  const perfil = await requerirSesion();
  const supabase = await crearClienteServidor();

  const hoy = new Date().toISOString().slice(0, 10);
  const enOchoDias = new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10);

  const [activos, totales, clientes, terminos, audiencias, recientes] = await Promise.all([
    supabase.from("asunto").select("id", { count: "exact", head: true })
      .is("archivado_en", null).eq("estado_asunto", "activo"),
    supabase.from("asunto").select("id", { count: "exact", head: true }).is("archivado_en", null),
    supabase.from("cliente").select("id", { count: "exact", head: true }).is("archivado_en", null),
    supabase.from("evento")
      .select("id, titulo, fecha_limite, estado_verificacion, asunto:asunto_id (id, nombre)")
      .eq("clase", "termino").is("archivado_en", null)
      .not("fecha_limite", "is", null).lte("fecha_limite", enOchoDias)
      .order("fecha_limite").limit(8),
    supabase.from("evento")
      .select("id, titulo, fecha_hora, asunto:asunto_id (id, nombre), organo:organo_id (nombre)")
      .eq("clase", "audiencia").is("archivado_en", null)
      .gte("fecha_hora", hoy).order("fecha_hora").limit(6),
    supabase.from("gestion")
      .select("id, titulo, ocurrio_en, tipo, asunto:asunto_id (id, nombre), autor:autor_id (nombre)")
      .is("archivado_en", null).order("creado_en", { ascending: false }).limit(6),
  ]);

  const sinNada = (totales.count ?? 0) === 0 && (clientes.count ?? 0) === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-x-4">
        <div>
          <h1 className="text-xl text-[var(--verde)]">Asuntos del día</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)] first-letter:uppercase">
            {fechaDeHoy()}
          </p>
        </div>
      </div>

      {sinNada ? (
        <div className="filete-dorado border border-[var(--border)] bg-white p-8 text-center">
          <UserRound className="mx-auto size-8 text-[var(--dorado-tinta)]" aria-hidden />
          <h2 className="mt-3 text-base text-[var(--verde)]">El despacho está vacío</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
            Hay dos maneras de alimentarlo, y ninguna depende de la otra: capturar a
            mano, o cargar varios registros de golpe con la plantilla de Excel.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/clientes/nuevo" className="flex h-11 items-center gap-2 rounded-sm bg-[var(--verde)] px-4 text-sm font-medium text-white hover:bg-[var(--verde-claro)]">
              <Plus className="size-4" aria-hidden />
              Dar de alta un cliente
            </Link>
            <Link href="/importar" className="flex h-11 items-center rounded-sm border border-[var(--border)] px-4 text-sm hover:border-[var(--verde-claro)]">
              Cargar con plantilla
            </Link>
          </div>
          <p className="mt-4 text-xs text-[var(--muted-foreground)]">
            Entró como <strong>{perfil.nombre}</strong>, con rol de {perfil.rol}.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Indicador etiqueta="Vencen en 8 días" valor={String(terminos.data?.length ?? 0)} pie="Términos" />
            <Indicador etiqueta="Audiencias" valor={String(audiencias.data?.length ?? 0)} pie="Próximas" />
            <Indicador
              etiqueta="Asuntos activos"
              valor={String(activos.count ?? 0)}
              pie={`De ${totales.count ?? 0} en total`}
            />
            <Indicador etiqueta="Clientes" valor={String(clientes.count ?? 0)} pie="Dados de alta" />
          </div>

          <Seccion
            titulo="Lo que vence primero"
            nota="Términos por vencer"
            accion={{ href: "/agenda", texto: "Ver toda la agenda" }}
          >
            {!terminos.data?.length ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                No hay términos capturados con vencimiento próximo.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {terminos.data.map((t) => (
                  <li key={t.id} className="px-4 py-3">
                    <Link href={`/asuntos/${uno(t.asunto)?.id}?t=terminos`} className="font-medium text-[var(--verde)] underline-offset-2 hover:underline">
                      {t.titulo}
                    </Link>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      {uno(t.asunto)?.nombre} · vence {t.fecha_limite}
                      {t.estado_verificacion === "pendiente_verificar" && " · sin verificar"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Seccion>

          <div className="grid gap-5 xl:grid-cols-2">
            <Seccion titulo="Próximas audiencias" accion={{ href: "/agenda", texto: "Ver agenda" }}>
              {!audiencias.data?.length ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                  Sin audiencias programadas.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {audiencias.data.map((a) => (
                    <li key={a.id} className="px-4 py-3">
                      <p className="text-sm font-medium">{a.titulo}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {uno(a.asunto)?.nombre}
                        {uno(a.organo)?.nombre && ` · ${uno(a.organo)?.nombre}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Seccion>

            <Seccion titulo="Últimos movimientos" accion={{ href: "/asuntos", texto: "Ver todos" }}>
              {!recientes.data?.length ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                  Todavía no hay gestiones anotadas.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {recientes.data.map((g) => (
                    <li key={g.id} className="px-4 py-3">
                      <Link href={`/asuntos/${uno(g.asunto)?.id}?t=bitacora`} className="text-sm font-medium text-[var(--verde)] underline-offset-2 hover:underline">
                        {g.titulo}
                      </Link>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {uno(g.asunto)?.nombre} · {g.ocurrio_en} · {uno(g.autor)?.nombre ?? "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Seccion>
          </div>
        </>
      )}
    </div>
  );
}

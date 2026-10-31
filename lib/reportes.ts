import "server-only";
import { diaDe, diasHasta, hoyIso, horaDe, sumarDias } from "@/lib/agenda";
import { uno } from "@/lib/supabase/relaciones";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { DatosReporte } from "@/lib/pdf/reporte";

/**
 * Reúne las cifras del reporte del despacho.
 *
 * Una sola función para la pantalla y para el PDF: si los dos leyeran por su
 * cuenta, tarde o temprano dirían cosas distintas y nadie sabría cuál creer.
 *
 * Las secciones de dinero solo se llenan para el socio. No es una decisión de
 * presentación: la RLS tampoco le daría esas filas a nadie más.
 */
export async function reunirReporte(
  emitidoPor: string,
  esSocio: boolean,
): Promise<DatosReporte> {
  const supabase = await crearClienteServidor();
  const hoy = hoyIso();
  const enTreinta = sumarDias(hoy, 30);

  const [
    { data: asuntos }, { count: archivados }, { count: clientes },
    { data: eventos }, { count: docsPendientes },
    { data: honorarios }, { data: pagos }, { data: gastos },
  ] = await Promise.all([
    supabase.from("asunto")
      .select("id, etapa, materia:materia_clave (nombre), responsable:responsable_id (nombre), etapa_ref:etapa (nombre)")
      .is("archivado_en", null),
    supabase.from("asunto").select("id", { count: "exact", head: true })
      .not("archivado_en", "is", null),
    supabase.from("cliente").select("id", { count: "exact", head: true })
      .is("archivado_en", null),
    supabase.from("evento")
      .select(`
        id, clase, titulo, fecha_hora, fecha_limite, estado, estado_verificacion,
        bloqueado_por_falta_de_datos, asunto:asunto_id (nombre), organo:organo_id (nombre)
      `)
      .is("archivado_en", null),
    supabase.from("documento").select("id", { count: "exact", head: true })
      .eq("estado_revision", "pendiente").is("archivado_en", null),
    esSocio
      ? supabase.from("honorario").select("importe, tipo").is("archivado_en", null).eq("estado", "vigente")
      : Promise.resolve({ data: [] as { importe: number; tipo: string }[] }),
    esSocio
      ? supabase.from("pago").select("importe").is("archivado_en", null)
      : Promise.resolve({ data: [] as { importe: number }[] }),
    esSocio
      ? supabase.from("gasto").select("importe").is("archivado_en", null)
      : Promise.resolve({ data: [] as { importe: number }[] }),
  ]);

  const lista = asuntos ?? [];

  /** Cuenta por una etiqueta y ordena de mayor a menor. */
  function contar(clave: (a: (typeof lista)[number]) => string) {
    const mapa = new Map<string, number>();
    for (const a of lista) {
      const k = clave(a) || "Sin asignar";
      mapa.set(k, (mapa.get(k) ?? 0) + 1);
    }
    return [...mapa.entries()]
      .map(([etiqueta, valor]) => ({ etiqueta, valor }))
      .sort((x, z) => z.valor - x.valor);
  }

  const todosEventos = eventos ?? [];

  const vencimientos = todosEventos
    .filter((e) => e.clase === "termino" && e.fecha_limite
      && e.estado !== "cumplido" && e.estado !== "cancelado"
      && e.fecha_limite <= enTreinta)
    .sort((a, b) => (a.fecha_limite ?? "").localeCompare(b.fecha_limite ?? ""))
    .map((e) => ({
      titulo: e.titulo,
      asunto: uno(e.asunto)?.nombre ?? "—",
      fecha: e.fecha_limite,
      faltan: e.fecha_limite ? diasHasta(e.fecha_limite) : null,
      verificado: e.estado_verificacion === "verificado",
      bloqueado: e.bloqueado_por_falta_de_datos,
    }));

  const audiencias = todosEventos
    .filter((e) => e.clase === "audiencia" && e.fecha_hora && (diaDe(e.fecha_hora) ?? "") >= hoy)
    .sort((a, b) => (a.fecha_hora ?? "").localeCompare(b.fecha_hora ?? ""))
    .map((e) => ({
      titulo: e.titulo,
      asunto: uno(e.asunto)?.nombre ?? "—",
      fecha: diaDe(e.fecha_hora),
      hora: horaDe(e.fecha_hora),
      organo: uno(e.organo)?.nombre ?? null,
    }));

  const suma = (xs: { importe: number | string }[]) => xs.reduce((t, x) => t + Number(x.importe), 0);
  const devengado = suma((honorarios ?? []).filter((h) => h.tipo === "devengado"));
  const cobrado = suma(pagos ?? []);

  return {
    despacho: "IUS MODERNUM Abogados",
    emitidoPor,
    corteAl: hoy,
    asuntosActivos: lista.length,
    asuntosArchivados: archivados ?? 0,
    clientes: clientes ?? 0,
    porMateria: contar((a) => uno(a.materia)?.nombre ?? ""),
    porResponsable: contar((a) => uno(a.responsable)?.nombre ?? ""),
    porEtapa: contar((a) => uno(a.etapa_ref)?.nombre ?? a.etapa),
    vencimientos,
    audiencias,
    documentosPendientes: docsPendientes ?? 0,
    terminosSinVerificar: todosEventos.filter(
      (e) => e.clase === "termino" && e.estado_verificacion === "pendiente_verificar").length,
    terminosBloqueados: todosEventos.filter(
      (e) => e.clase === "termino" && e.bloqueado_por_falta_de_datos).length,
    finanzas: esSocio
      ? { devengado, cobrado, saldo: devengado - cobrado, gastos: suma(gastos ?? []) }
      : null,
  };
}

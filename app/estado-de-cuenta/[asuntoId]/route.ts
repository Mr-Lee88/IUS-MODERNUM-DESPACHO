import { NextResponse, type NextRequest } from "next/server";
import { perfilDeLaPeticion } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { generarEstadoDeCuenta } from "@/lib/pdf/estado-de-cuenta";
import { uno } from "@/lib/supabase/relaciones";

/**
 * Estado de cuenta de un asunto, en PDF.
 *
 * No hace falta comprobar el rol a mano: las tablas de honorarios, pagos,
 * gastos y facturas solo tienen política para el socio. Quien no lo sea recibe
 * cero filas, y entonces esta ruta contesta 404 en lugar de entregar un PDF
 * vacío que pareciera un error del sistema.
 */
export async function GET(
  _peticion: NextRequest,
  { params }: { params: Promise<{ asuntoId: string }> },
) {
  const { asuntoId } = await params;
  const supabase = await crearClienteServidor();

  const perfil = await perfilDeLaPeticion();
  if (!perfil) return new NextResponse("No autorizado", { status: 401 });
  if (perfil.rol !== "socio") return new NextResponse("No encontrado", { status: 404 });

  const { data: asunto } = await supabase
    .from("asunto")
    .select(`
      id, nombre, numero_expediente, anio,
      materia:materia_clave (nombre),
      organo:organo_id (nombre),
      partes:parte (nombre, es_nuestro_cliente, cliente:cliente_id (nombre_o_razon_social, rfc))
    `)
    .eq("id", asuntoId)
    .single();

  if (!asunto) return new NextResponse("No encontrado", { status: 404 });

  const [{ data: honorarios }, { data: pagos }, { data: gastos }, { data: facturas }] =
    await Promise.all([
      supabase.from("honorario").select("concepto, tipo, importe, fecha, notas")
        .eq("asunto_id", asuntoId).is("archivado_en", null).eq("estado", "vigente").order("fecha"),
      supabase.from("pago").select("concepto, importe, fecha, forma_pago, referencia")
        .eq("asunto_id", asuntoId).is("archivado_en", null).order("fecha"),
      supabase.from("gasto").select("concepto, importe, fecha, reembolsable, reembolsado")
        .eq("asunto_id", asuntoId).is("archivado_en", null).order("fecha"),
      supabase.from("factura").select("folio, folio_fiscal, fecha, total, estado")
        .eq("asunto_id", asuntoId).is("archivado_en", null).order("fecha"),
    ]);

  const parteCliente = (asunto.partes ?? []).find((p) => p.es_nuestro_cliente);
  const clienteRef = uno(parteCliente?.cliente);

  const pdf = await generarEstadoDeCuenta({
    despacho: "IUS MODERNUM Abogados",
    cliente: clienteRef?.nombre_o_razon_social ?? parteCliente?.nombre ?? "Sin cliente",
    rfcCliente: clienteRef?.rfc ?? null,
    asunto: asunto.nombre,
    expediente: asunto.numero_expediente
      ? `Expediente ${asunto.numero_expediente}/${asunto.anio ?? ""}`
      : null,
    organo: uno(asunto.organo)?.nombre ?? null,
    materia: uno(asunto.materia)?.nombre ?? "",
    honorariosPactados: (honorarios ?? [])
      .filter((h) => h.tipo === "pactado" || h.tipo === "presupuesto")
      .map((h) => ({ concepto: h.concepto, fecha: h.fecha, importe: Number(h.importe), nota: h.notas })),
    devengados: (honorarios ?? [])
      .filter((h) => h.tipo === "devengado")
      .map((h) => ({ concepto: h.concepto, fecha: h.fecha, importe: Number(h.importe), nota: h.notas })),
    pagos: (pagos ?? []).map((p) => ({
      concepto: p.concepto,
      fecha: p.fecha,
      importe: Number(p.importe),
      nota: [p.forma_pago, p.referencia].filter(Boolean).join(" · ") || null,
    })),
    gastos: (gastos ?? []).map((g) => ({
      concepto: g.concepto,
      fecha: g.fecha,
      importe: Number(g.importe),
      nota: g.reembolsable
        ? (g.reembolsado ? "Reembolsable · ya reembolsado" : "Reembolsable · pendiente de reembolso")
        : "No reembolsable",
    })),
    facturas: (facturas ?? []).map((f) => ({
      folio: f.folio ?? "—",
      folioFiscal: f.folio_fiscal,
      fecha: f.fecha,
      total: Number(f.total),
      estado: f.estado,
    })),
    emitidoPor: perfil.nombre,
  });

  const nombre = `estado-de-cuenta-${(asunto.numero_expediente ?? asunto.id.slice(0, 8))}.pdf`;

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombre}"`,
      // Lleva cifras del despacho: que no se quede en ninguna caché intermedia.
      "Cache-Control": "private, no-store",
    },
  });
}

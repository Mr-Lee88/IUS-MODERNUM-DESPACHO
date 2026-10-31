import { type PDFPage } from "pdf-lib";
import {
  ALTO, ANCHO, DORADO, GRAFITO, GRIS, LINEA, MARFIL, MARGEN, PESOS, ROJO,
  UTIL, VERDE, VERDE_CLARO, abrirDocumento, dibujarMembrete, dibujarPies,
  fechaDelForo, recortar,
} from "./comun";

/**
 * Reporte general del despacho, en PDF (§4, módulo 7).
 *
 * Lo que no se sabe se dice: si una sección no tiene datos, el reporte lo
 * escribe. Un reporte que calla lo que falta es peor que uno que lo señala.
 */

export interface FilaConteo { etiqueta: string; valor: number; nota?: string }

export interface FilaVencimiento {
  titulo: string;
  asunto: string;
  fecha: string | null;
  faltan: number | null;
  verificado: boolean;
  bloqueado: boolean;
}

export interface FilaAudiencia {
  titulo: string;
  asunto: string;
  fecha: string | null;
  hora: string | null;
  organo: string | null;
}

export interface DatosReporte {
  despacho: string;
  emitidoPor: string;
  corteAl: string;
  asuntosActivos: number;
  asuntosArchivados: number;
  clientes: number;
  porMateria: FilaConteo[];
  porResponsable: FilaConteo[];
  porEtapa: FilaConteo[];
  vencimientos: FilaVencimiento[];
  audiencias: FilaAudiencia[];
  documentosPendientes: number;
  terminosSinVerificar: number;
  terminosBloqueados: number;
  /** Solo si quien lo pide es el socio. */
  finanzas: { devengado: number; cobrado: number; saldo: number; gastos: number } | null;
}

export async function generarReporte(d: DatosReporte): Promise<Uint8Array> {
  const doc = await abrirDocumento(`Reporte del despacho · ${d.corteAl}`, d.despacho);
  const { normal, negrita } = doc;

  let pagina: PDFPage = doc.pdf.addPage([ANCHO, ALTO]);
  await dibujarMembrete(doc, pagina, "REPORTE DEL DESPACHO", `Corte al ${fechaDelForo(d.corteAl)}`);
  let y = ALTO - ALTO_ENCABEZADO();

  function ALTO_ENCABEZADO() { return 112; }

  async function nuevaPagina() {
    pagina = doc.pdf.addPage([ANCHO, ALTO]);
    await dibujarMembrete(doc, pagina, "REPORTE DEL DESPACHO", `Corte al ${fechaDelForo(d.corteAl)}`);
    y = ALTO - ALTO_ENCABEZADO();
  }

  async function sitio(alto: number) {
    if (y - alto < MARGEN + 40) await nuevaPagina();
  }

  function texto(t: string, x: number, tam: number, fuente = normal, color = GRAFITO) {
    pagina.drawText(t, { x, y, size: tam, font: fuente, color });
  }

  function derecha(t: string, xFin: number, tam: number, fuente = normal, color = GRAFITO) {
    pagina.drawText(t, { x: xFin - fuente.widthOfTextAtSize(t, tam), y, size: tam, font: fuente, color });
  }

  function regla(grosor = 0.6, color = LINEA) {
    pagina.drawLine({ start: { x: MARGEN, y }, end: { x: ANCHO - MARGEN, y }, thickness: grosor, color });
  }

  async function titulo(t: string) {
    y -= 24;
    await sitio(50);
    texto(t.toUpperCase(), MARGEN, 9.5, negrita, VERDE);
    y -= 6;
    regla();
  }

  // ---------- Cifras de cabecera ----------
  const tarjetas: [string, string][] = [
    ["Asuntos activos", String(d.asuntosActivos)],
    ["Archivados", String(d.asuntosArchivados)],
    ["Clientes", String(d.clientes)],
    ["Audiencias próximas", String(d.audiencias.length)],
  ];
  const anchoTarjeta = (UTIL - 3 * 10) / 4;
  tarjetas.forEach(([etiqueta, valor], i) => {
    const x = MARGEN + i * (anchoTarjeta + 10);
    pagina.drawRectangle({
      x, y: y - 44, width: anchoTarjeta, height: 52,
      color: MARFIL, borderColor: LINEA, borderWidth: 0.6,
    });
    pagina.drawRectangle({ x, y: y + 7, width: anchoTarjeta, height: 1.6, color: DORADO });
    pagina.drawText(etiqueta.toUpperCase(), {
      x: x + 9, y: y - 8, size: 6.5, font: negrita, color: GRIS,
    });
    pagina.drawText(valor, { x: x + 9, y: y - 32, size: 19, font: negrita, color: VERDE });
  });
  y -= 52;

  // ---------- Reparto de los asuntos ----------
  function barras(t: string, filas: FilaConteo[], total: number) {
    y -= 20;
    texto(t, MARGEN, 8, negrita, GRIS);
    if (filas.length === 0) {
      y -= 14;
      texto("Sin datos.", MARGEN, 8.5, normal, GRIS);
      return;
    }
    for (const f of filas) {
      y -= 15;
      texto(recortar(f.etiqueta, normal, 9, 160), MARGEN, 9);
      const anchoBarra = total > 0 ? Math.max(2, (f.valor / total) * 200) : 2;
      pagina.drawRectangle({ x: MARGEN + 170, y: y - 1, width: 200, height: 7, color: MARFIL });
      pagina.drawRectangle({ x: MARGEN + 170, y: y - 1, width: anchoBarra, height: 7, color: VERDE_CLARO });
      texto(String(f.valor), MARGEN + 380, 9, negrita);
      if (f.nota) texto(f.nota, MARGEN + 400, 7.5, normal, GRIS);
    }
  }

  await titulo("Cómo se reparten los asuntos");
  const totalMateria = d.porMateria.reduce((t, f) => t + f.valor, 0);
  barras("POR MATERIA", d.porMateria, totalMateria);
  await sitio(90);
  barras("POR ABOGADO RESPONSABLE", d.porResponsable, totalMateria);
  await sitio(90);
  barras("POR ETAPA PROCESAL", d.porEtapa, totalMateria);

  // ---------- Vencimientos ----------
  await titulo("Próximos vencimientos");
  if (d.vencimientos.length === 0) {
    y -= 16;
    texto("No hay términos con vencimiento próximo.", MARGEN, 9, normal, GRIS);
  } else {
    for (const v of d.vencimientos) {
      y -= 16;
      await sitio(26);
      texto(recortar(v.titulo, normal, 9.5, UTIL - 200), MARGEN, 9.5);
      texto(fechaDelForo(v.fecha), MARGEN + UTIL - 195, 8.5, normal, GRIS);
      const cuando = v.faltan === null ? "—"
        : v.faltan < 0 ? `venció hace ${Math.abs(v.faltan)} d`
        : v.faltan === 0 ? "vence hoy"
        : `en ${v.faltan} d`;
      derecha(cuando, ANCHO - MARGEN, 8.5, negrita,
        v.faltan !== null && v.faltan <= 0 ? ROJO : GRAFITO);
      y -= 10;
      texto(recortar(v.asunto, normal, 7.5, UTIL - 220), MARGEN + 8, 7.5, normal, GRIS);
      const marcas = [
        !v.verificado ? "sin verificar" : null,
        v.bloqueado ? "falta un dato para computar" : null,
      ].filter(Boolean).join(" · ");
      if (marcas) derecha(marcas, ANCHO - MARGEN, 7, normal, ROJO);
    }
  }

  // ---------- Audiencias ----------
  await titulo("Audiencias programadas");
  if (d.audiencias.length === 0) {
    y -= 16;
    texto("No hay audiencias programadas.", MARGEN, 9, normal, GRIS);
  } else {
    for (const a of d.audiencias) {
      y -= 16;
      await sitio(26);
      texto(recortar(a.titulo, normal, 9.5, UTIL - 200), MARGEN, 9.5);
      texto(`${fechaDelForo(a.fecha)}${a.hora ? `, ${a.hora} h` : ""}`, MARGEN + UTIL - 195, 8.5, normal, GRIS);
      y -= 10;
      texto(recortar([a.asunto, a.organo].filter(Boolean).join("  ·  "), normal, 7.5, UTIL - 40),
        MARGEN + 8, 7.5, normal, GRIS);
    }
  }

  // ---------- Lo que pide atención ----------
  await titulo("Lo que pide atención");
  const avisos: [string, number, string][] = [
    ["Términos sin verificar", d.terminosSinVerificar,
      "Nadie los ha confirmado: el sistema no los da por buenos."],
    ["Términos bloqueados por falta de datos", d.terminosBloqueados,
      "Falta la fecha de notificación o la de efectos; sin eso no se computa."],
    ["Documentos pendientes de revisión", d.documentosPendientes,
      "Los subió un cliente y no han entrado al expediente."],
  ];
  for (const [etiqueta, valor, explicacion] of avisos) {
    y -= 16;
    await sitio(26);
    texto(etiqueta, MARGEN, 9.5);
    derecha(String(valor), ANCHO - MARGEN, 10, negrita, valor > 0 ? ROJO : VERDE);
    y -= 10;
    texto(explicacion, MARGEN + 8, 7.5, normal, GRIS);
  }

  // ---------- Finanzas, solo para el socio ----------
  if (d.finanzas) {
    await titulo("Honorarios");
    const filas: [string, number][] = [
      ["Devengado", d.finanzas.devengado],
      ["Cobrado", d.finanzas.cobrado],
      ["Por cobrar", d.finanzas.saldo],
      ["Gastos del despacho", d.finanzas.gastos],
    ];
    for (const [etiqueta, importe] of filas) {
      y -= 16;
      await sitio(20);
      texto(etiqueta, MARGEN, 9.5);
      derecha(PESOS.format(importe), ANCHO - MARGEN, 9.5,
        etiqueta === "Por cobrar" ? negrita : normal,
        etiqueta === "Por cobrar" ? VERDE : GRAFITO);
    }
    y -= 14;
    texto("Esta sección solo aparece en el reporte del socio.", MARGEN, 7.5, normal, GRIS);
  }

  // ---------- Advertencia ----------
  y -= 26;
  await sitio(56);
  pagina.drawRectangle({
    x: MARGEN, y: y - 34, width: UTIL, height: 46,
    color: MARFIL, borderColor: DORADO, borderWidth: 0.8,
  });
  y -= 4;
  texto("SOBRE LAS FECHAS DE ESTE REPORTE", MARGEN + 12, 7.5, negrita, VERDE);
  y -= 12;
  texto("El sistema no computa plazos. Las fechas límite son las capturadas por una persona y están",
    MARGEN + 12, 7.5, normal, GRIS);
  y -= 10;
  texto("pendientes de verificación. El cómputo y su revisión corresponden al abogado responsable.",
    MARGEN + 12, 7.5, normal, GRIS);

  dibujarPies(doc, d.despacho, d.emitidoPor);
  return doc.pdf.save();
}

import { type PDFPage } from "pdf-lib";
import {
  ALTO, ALTO_MEMBRETE, ANCHO, DORADO, GRAFITO, GRIS, LINEA, MARFIL, MARGEN, PESOS,
  UTIL, VERDE, abrirDocumento, dibujarMembrete, dibujarPies, fechaDelForo, recortar,
} from "./comun";

/**
 * Estado de cuenta de un asunto, en PDF.
 *
 * §6 del encargo: todo documento que el sistema redacte sale en PDF. El
 * membrete, la paleta y el pie salen de `comun.ts`: lo que emite el despacho
 * tiene que verse siempre igual.
 */

export interface Renglon {
  concepto: string;
  fecha: string | null;
  importe: number;
  nota?: string | null;
}

export interface DatosEstadoDeCuenta {
  despacho: string;
  cliente: string;
  rfcCliente: string | null;
  asunto: string;
  expediente: string | null;
  organo: string | null;
  materia: string;
  honorariosPactados: Renglon[];
  devengados: Renglon[];
  pagos: Renglon[];
  gastos: Renglon[];
  facturas: { folio: string; folioFiscal: string | null; fecha: string; total: number; estado: string }[];
  emitidoPor: string;
}

export async function generarEstadoDeCuenta(d: DatosEstadoDeCuenta): Promise<Uint8Array> {
  const doc = await abrirDocumento(`Estado de cuenta · ${d.asunto}`, d.despacho);
  const { normal, negrita } = doc;

  let pagina: PDFPage = doc.pdf.addPage([ANCHO, ALTO]);
  await dibujarMembrete(doc, pagina, "ESTADO DE CUENTA");
  let y = ALTO;

  /** Abre página nueva cuando ya no cabe lo que sigue. */
  function sitio(alto: number) {
    if (y - alto < MARGEN + 40) {
      pagina = doc.pdf.addPage([ANCHO, ALTO]);
      y = ALTO - MARGEN;
    }
  }

  function texto(t: string, x: number, tam: number, fuente = normal, color = GRAFITO) {
    pagina.drawText(t, { x, y, size: tam, font: fuente, color });
  }

  function derecha(t: string, xFin: number, tam: number, fuente = normal, color = GRAFITO) {
    pagina.drawText(t, { x: xFin - fuente.widthOfTextAtSize(t, tam), y, size: tam, font: fuente, color });
  }

  function regla(grosor = 0.6, color = LINEA) {
    pagina.drawLine({
      start: { x: MARGEN, y }, end: { x: ANCHO - MARGEN, y },
      thickness: grosor, color,
    });
  }


  // ---------- Identificación del asunto ----------
  y = ALTO - 112;
  texto("ASUNTO", MARGEN, 8, negrita, GRIS);
  y -= 14;
  texto(recortar(d.asunto, negrita, 13, UTIL), MARGEN, 13, negrita, VERDE);
  y -= 16;
  const linea2 = [d.materia, d.organo, d.expediente].filter(Boolean).join("  ·  ");
  texto(recortar(linea2, normal, 9, UTIL), MARGEN, 9, normal, GRIS);

  y -= 22;
  texto("CLIENTE", MARGEN, 8, negrita, GRIS);
  y -= 14;
  texto(recortar(d.cliente, normal, 11, UTIL), MARGEN, 11);
  if (d.rfcCliente) {
    y -= 13;
    texto(`RFC ${d.rfcCliente}`, MARGEN, 9, normal, GRIS);
  }

  y -= 18;
  regla(1.2, DORADO);

  // ---------- Tablas ----------
  function tabla(titulo: string, renglones: Renglon[], vacio: string) {
    y -= 20;
    sitio(64);
    texto(titulo.toUpperCase(), MARGEN, 9, negrita, VERDE);
    y -= 6;
    regla();

    if (renglones.length === 0) {
      y -= 16;
      texto(vacio, MARGEN, 9, normal, GRIS);
      y -= 6;
      return 0;
    }

    let suma = 0;
    for (const r of renglones) {
      y -= 15.5;
      sitio(16);
      texto(recortar(r.concepto, normal, 9.5, UTIL - 170), MARGEN, 9.5);
      texto(fechaDelForo(r.fecha), MARGEN + UTIL - 170, 8.5, normal, GRIS);
      derecha(PESOS.format(r.importe), ANCHO - MARGEN, 9.5);
      suma += r.importe;
      if (r.nota) {
        y -= 11;
        sitio(11);
        texto(recortar(r.nota, normal, 8, UTIL - 120), MARGEN + 8, 8, normal, GRIS);
      }
    }

    y -= 8;
    regla();
    y -= 14;
    derecha("Suma", ANCHO - MARGEN - 110, 9, negrita);
    derecha(PESOS.format(suma), ANCHO - MARGEN, 9, negrita);
    y -= 4;
    return suma;
  }

  tabla("Honorarios pactados", d.honorariosPactados, "No hay honorarios pactados registrados.");
  const devengado = tabla("Honorarios devengados", d.devengados, "No hay honorarios devengados.");
  const cobrado = tabla("Pagos recibidos", d.pagos, "No se ha recibido ningún pago.");
  const gastos = tabla("Gastos del asunto", d.gastos, "No hay gastos registrados.");

  // ---------- Resumen ----------
  y -= 22;
  sitio(104);
  const saldo = devengado - cobrado;

  pagina.drawRectangle({
    x: MARGEN, y: y - 74, width: UTIL, height: 92,
    color: MARFIL,
    borderColor: LINEA, borderWidth: 0.6,
  });
  y -= 4;
  texto("RESUMEN", MARGEN + 14, 9, negrita, VERDE);

  const filas: [string, number][] = [
    ["Honorarios devengados", devengado],
    ["Pagos recibidos", -cobrado],
    ["Gastos del asunto", gastos],
  ];
  for (const [etiqueta, importe] of filas) {
    y -= 16;
    texto(etiqueta, MARGEN + 14, 9.5);
    derecha(PESOS.format(importe), ANCHO - MARGEN - 14, 9.5);
  }

  y -= 8;
  pagina.drawLine({
    start: { x: MARGEN + 14, y }, end: { x: ANCHO - MARGEN - 14, y },
    thickness: 0.8, color: DORADO,
  });
  y -= 17;
  texto("SALDO POR HONORARIOS", MARGEN + 14, 10.5, negrita, VERDE);
  derecha(PESOS.format(saldo), ANCHO - MARGEN - 14, 12, negrita, VERDE);
  y -= 13;
  texto("Los gastos se facturan y se reembolsan por separado.", MARGEN + 14, 7.5, normal, GRIS);

  // ---------- Facturas ----------
  if (d.facturas.length) {
    y -= 26;
    sitio(56);
    texto("FACTURAS REGISTRADAS", MARGEN, 9, negrita, VERDE);
    y -= 6;
    regla();
    for (const f of d.facturas) {
      y -= 16;
      sitio(16);
      texto(`Folio ${f.folio}`, MARGEN, 9);
      texto(f.folioFiscal ?? "Sin folio fiscal", MARGEN + 70, 7.5, normal, GRIS);
      texto(fechaDelForo(f.fecha), MARGEN + UTIL - 230, 8.5, normal, GRIS);
      texto(f.estado, MARGEN + UTIL - 130, 8.5, normal, GRIS);
      derecha(PESOS.format(f.total), ANCHO - MARGEN, 9);
    }
    y -= 10;
    texto("Las facturas las emite el contador. Aquí solo se registran.", MARGEN, 7.5, normal, GRIS);
  }

  dibujarPies(doc, d.despacho, d.emitidoPor);
  return doc.pdf.save();
}

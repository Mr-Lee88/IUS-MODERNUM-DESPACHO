import { readFile } from "node:fs/promises";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { rutaPublica } from "@/lib/archivos-publicos";

/**
 * Lo que comparten todos los documentos que emite el sistema: la paleta del
 * despacho, el membrete con el logo, el pie de página y las utilidades de
 * medida. Un documento que sale del despacho tiene que verse siempre igual.
 */

export const VERDE = rgb(0x10 / 255, 0x3d / 255, 0x32 / 255);
export const VERDE_CLARO = rgb(0x28 / 255, 0x5f / 255, 0x50 / 255);
export const DORADO = rgb(0xd8 / 255, 0xc5 / 255, 0xa0 / 255);
export const DORADO_TINTA = rgb(0x8a / 255, 0x6d / 255, 0x32 / 255);
export const GRAFITO = rgb(0x30 / 255, 0x3a / 255, 0x40 / 255);
export const GRIS = rgb(0.45, 0.45, 0.45);
export const LINEA = rgb(0.85, 0.85, 0.83);
export const MARFIL = rgb(0.973, 0.965, 0.949);
export const BLANCO = rgb(1, 1, 1);
export const ROJO = rgb(0x8c / 255, 0x2f / 255, 0x2f / 255);

export const ANCHO = 612;
export const ALTO = 792;
export const MARGEN = 52;
export const UTIL = ANCHO - MARGEN * 2;
export const ALTO_MEMBRETE = 82;

export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export const PESOS = new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", minimumFractionDigits: 2,
});

/** Las fechas de documentos del foro llevan el mes con letra y sin abreviar. */
export function fechaDelForo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

/** Corta un texto para que no se desborde del ancho dado. */
export function recortar(texto: string, fuente: PDFFont, tam: number, ancho: number): string {
  if (fuente.widthOfTextAtSize(texto, tam) <= ancho) return texto;
  let t = texto;
  while (t.length > 1 && fuente.widthOfTextAtSize(t + "…", tam) > ancho) t = t.slice(0, -1);
  return t + "…";
}

export interface Documento {
  pdf: PDFDocument;
  normal: PDFFont;
  negrita: PDFFont;
}

export async function abrirDocumento(titulo: string, despacho: string): Promise<Documento> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(titulo);
  pdf.setAuthor(despacho);
  pdf.setCreator("IUS MODERNUM");
  pdf.setProducer("IUS MODERNUM");
  return {
    pdf,
    normal: await pdf.embedFont(StandardFonts.Helvetica),
    negrita: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
}

/**
 * Membrete verde con el logo del despacho. Si el archivo no aparece, el
 * documento sale con el nombre en texto: un membrete no es lo que lo hace
 * válido, pero el fallo se registra en lugar de pasar desapercibido.
 */
export async function dibujarMembrete(
  d: Documento,
  pagina: PDFPage,
  titulo: string,
  subtitulo?: string,
) {
  pagina.drawRectangle({ x: 0, y: ALTO - ALTO_MEMBRETE, width: ANCHO, height: ALTO_MEMBRETE, color: VERDE });

  const ruta = rutaPublica("logo.png");
  let huboLogo = false;
  if (ruta) {
    try {
      const logo = await d.pdf.embedPng(await readFile(ruta));
      const anchoLogo = 178;
      const escala = anchoLogo / logo.width;
      pagina.drawImage(logo, {
        x: MARGEN,
        y: ALTO - ALTO_MEMBRETE + (ALTO_MEMBRETE - logo.height * escala) / 2,
        width: anchoLogo,
        height: logo.height * escala,
      });
      huboLogo = true;
    } catch (e) {
      console.warn("No se pudo embeber el logo en el PDF:", e);
    }
  } else {
    console.warn("No se encontró public/logo.png: el PDF sale sin membrete.");
  }
  if (!huboLogo) {
    pagina.drawText("IUS MODERNUM", {
      x: MARGEN, y: ALTO - 50, size: 17, font: d.negrita, color: BLANCO,
    });
  }

  const y = ALTO - 50;
  pagina.drawText(titulo, {
    x: ANCHO - MARGEN - d.negrita.widthOfTextAtSize(titulo, 13),
    y, size: 13, font: d.negrita, color: BLANCO,
  });
  const pie = subtitulo ?? `Emitido el ${fechaDelForo(new Date().toISOString())}`;
  pagina.drawText(pie, {
    x: ANCHO - MARGEN - d.normal.widthOfTextAtSize(pie, 8),
    y: y - 16, size: 8, font: d.normal, color: DORADO,
  });
}

/** Pie de página en todas las hojas, al final. */
export function dibujarPies(d: Documento, despacho: string, emitidoPor: string) {
  const paginas = d.pdf.getPages();
  paginas.forEach((p, i) => {
    p.drawLine({
      start: { x: MARGEN, y: MARGEN - 14 }, end: { x: ANCHO - MARGEN, y: MARGEN - 14 },
      thickness: 0.6, color: LINEA,
    });
    p.drawText(`${despacho}  ·  Documento interno, sujeto a secreto profesional`, {
      x: MARGEN, y: MARGEN - 26, size: 7.5, font: d.normal, color: GRIS,
    });
    const pie = `Generado por ${emitidoPor}  ·  ${i + 1} de ${paginas.length}`;
    p.drawText(pie, {
      x: ANCHO - MARGEN - d.normal.widthOfTextAtSize(pie, 7.5),
      y: MARGEN - 26, size: 7.5, font: d.normal, color: GRIS,
    });
  });
}

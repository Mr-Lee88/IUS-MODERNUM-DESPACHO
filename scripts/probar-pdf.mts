/**
 * Genera un estado de cuenta de muestra para revisar cómo queda el PDF, sin
 * tener que pasar por la aplicación ni por la sesión.
 *
 *   npx tsx scripts/probar-pdf.ts [salida.pdf]
 */
import { writeFile } from "node:fs/promises";
import { generarEstadoDeCuenta } from "@/lib/pdf/estado-de-cuenta";

const pdf = await generarEstadoDeCuenta({
  despacho: "IUS MODERNUM Abogados",
  cliente: "Uc Tzab, María Guadalupe",
  rfcCliente: "UCTM850314HG2",
  asunto: "Uc Tzab contra actos del Director de Catastro Municipal",
  expediente: "Expediente 601/2026",
  organo: "Juzgado Primero de Distrito en el Estado de Campeche",
  materia: "Amparo",
  honorariosPactados: [
    { concepto: "Honorarios por el juicio de amparo indirecto, primera instancia", fecha: "2026-10-08", importe: 45000, nota: "Convenio firmado. No incluye recurso de revisión." },
  ],
  devengados: [
    { concepto: "Estudio del caso y elaboración de la demanda", fecha: "2026-10-09", importe: 20000 },
    { concepto: "Seguimiento hasta la audiencia constitucional", fecha: "2026-10-22", importe: 15000 },
  ],
  pagos: [
    { concepto: "Anticipo", fecha: "2026-10-08", importe: 20000, nota: "transferencia · SPEI 8842193" },
  ],
  gastos: [
    { concepto: "Copias certificadas del expediente administrativo", fecha: "2026-10-10", importe: 850, nota: "Reembolsable · ya reembolsado" },
    { concepto: "Traslado al Juzgado de Distrito", fecha: "2026-10-22", importe: 600, nota: "Reembolsable · pendiente de reembolso" },
  ],
  facturas: [
    { folio: "1042", folioFiscal: "A1B2C3D4-0000-4000-8000-DEMO00000001", fecha: "2026-10-08", total: 23200, estado: "pagada" },
  ],
  emitidoPor: "Prueba Temporal",
});

const destino = process.argv[2] ?? "muestra-estado-de-cuenta.pdf";
await writeFile(destino, pdf);
console.log(`PDF de muestra: ${destino}  (${Math.round(pdf.length / 1024)} KB)`);

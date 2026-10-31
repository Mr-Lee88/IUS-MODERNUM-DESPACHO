/**
 * Genera un reporte de muestra para revisar el PDF sin pasar por la aplicación.
 *   npx tsx scripts/probar-reporte.mts [salida.pdf]
 */
import { writeFile } from "node:fs/promises";
import { generarReporte } from "@/lib/pdf/reporte";

const pdf = await generarReporte({
  despacho: "IUS MODERNUM Abogados",
  emitidoPor: "Prueba Temporal",
  corteAl: "2026-10-31",
  asuntosActivos: 4,
  asuntosArchivados: 0,
  clientes: 4,
  porMateria: [
    { etiqueta: "Mercantil", valor: 2 },
    { etiqueta: "Amparo", valor: 1 },
    { etiqueta: "Familiar", valor: 1 },
  ],
  porResponsable: [{ etiqueta: "Sin asignar", valor: 4 }],
  porEtapa: [
    { etiqueta: "Contestación", valor: 1 },
    { etiqueta: "Informe", valor: 1 },
    { etiqueta: "Pruebas", valor: 1 },
    { etiqueta: "Consulta", valor: 1 },
  ],
  vencimientos: [
    { titulo: "Contestar la demanda y oponer excepciones", asunto: "Grupo Peninsular del Sureste vs. Díaz Alcocer", fecha: "2026-11-03", faltan: 3, verificado: false, bloqueado: false },
    { titulo: "Exhibir los comprobantes de ingresos del demandado", asunto: "Divorcio incausado Pat Chablé", fecha: "2026-11-04", faltan: 4, verificado: false, bloqueado: false },
    { titulo: "Alegatos antes de la audiencia constitucional", asunto: "Uc Tzab contra actos del Director de Catastro Municipal", fecha: "2026-11-11", faltan: 11, verificado: false, bloqueado: true },
    { titulo: "Rendir informe justificado (plazo de las responsables)", asunto: "Uc Tzab contra actos del Director de Catastro Municipal", fecha: "2026-11-13", faltan: 13, verificado: false, bloqueado: false },
    { titulo: "Ofrecer pruebas", asunto: "Grupo Peninsular del Sureste vs. Díaz Alcocer", fecha: "2026-11-24", faltan: 24, verificado: false, bloqueado: false },
  ],
  audiencias: [
    { titulo: "Segunda junta de avenencia", asunto: "Divorcio incausado Pat Chablé", fecha: "2026-11-06", hora: "11:00", organo: "Juzgado Primero Familiar de Primera Instancia" },
    { titulo: "Audiencia constitucional", asunto: "Uc Tzab contra actos del Director de Catastro Municipal", fecha: "2026-11-12", hora: "10:30", organo: "Juzgado Primero de Distrito en el Estado de Campeche" },
    { titulo: "Audiencia de desahogo de pruebas", asunto: "Grupo Peninsular del Sureste vs. Díaz Alcocer", fecha: "2026-11-19", hora: "09:00", organo: "Juzgado Tercero Civil de Primera Instancia" },
  ],
  documentosPendientes: 0,
  terminosSinVerificar: 6,
  terminosBloqueados: 1,
  finanzas: { devengado: 117000, cobrado: 100000, saldo: 17000, gastos: 17970 },
});

const destino = process.argv[2] ?? "muestra-reporte.pdf";
await writeFile(destino, pdf);
console.log(`Reporte de muestra: ${destino}  (${Math.round(pdf.length / 1024)} KB)`);

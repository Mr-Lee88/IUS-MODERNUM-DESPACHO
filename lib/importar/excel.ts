import "server-only";
import * as XLSX from "xlsx";
import { perfilarTabla, type PerfilArchivo } from "./perfil";

function celdaATexto(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) {
    return `${String(v.getUTCDate()).padStart(2, "0")}-${String(v.getUTCMonth() + 1).padStart(2, "0")}-${v.getUTCFullYear()}`;
  }
  return String(v).trim();
}

export function leerExcel(bytes: Uint8Array): { perfil: PerfilArchivo; hojas: Record<string, string[][]> } {
  const libro = XLSX.read(bytes, { type: "array", cellDates: true });
  const hojas: Record<string, string[][]> = {};
  const tablas = libro.SheetNames.map((nombre) => {
    const hoja = libro.Sheets[nombre];
    const filas = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: true, defval: "" }) as unknown[][];
    const texto = filas.map((f) => f.map(celdaATexto));
    hojas[nombre] = texto;
    return perfilarTabla(nombre, texto);
  });
  return { perfil: { tipoArchivo: "xlsx", tablas }, hojas };
}

/**
 * Vuelve a generar lib/pdf/logo.ts desde public/logo.png.
 * Hay que ejecutarlo cada vez que cambie el logo:
 *   node scripts/empotrar-logo.mjs
 */
import { readFile, writeFile } from "node:fs/promises";

const png = await readFile("public/logo.png");

// Una sola cadena, no mil concatenadas: partirla hacía que el analizador de
// eslint se quedara sin pila.
await writeFile("lib/pdf/logo.ts", `/**
 * Logo del despacho empotrado en base64. ARCHIVO GENERADO: no se edita a mano.
 *
 * NO se lee de \`public/\` con fs a propósito: en Vercel las funciones no tienen
 * la carpeta public en su sistema de archivos, así que el PDF saldría sin
 * membrete en producción y en silencio. Además, un acceso dinámico al disco
 * obliga a Next a empaquetar todo el proyecto dentro de la función.
 *
 * Se regenera con: node scripts/empotrar-logo.mjs
 */
const BASE64 =
  "${png.toString("base64")}";

/** Los bytes del logo, listos para pdf-lib. */
export function logoPng(): Uint8Array {
  return Uint8Array.from(Buffer.from(BASE64, "base64"));
}
`);
console.log("lib/pdf/logo.ts regenerado");

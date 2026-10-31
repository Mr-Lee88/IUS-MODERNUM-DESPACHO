import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Localiza un archivo de `public/` en tiempo de ejecución.
 *
 * `process.cwd()` no sirve por sí solo: depende de desde dónde se lanzó el
 * proceso. Con `next dev --port 3100 ius-modernum` lanzado desde la carpeta de
 * arriba, cwd es la carpeta padre y `public/logo.png` no aparece por ningún
 * lado. Eso fue justo lo que pasó: el PDF salía sin membrete y nadie se
 * enteraba, porque el fallo estaba envuelto en un try/catch.
 *
 * Devuelve la primera ruta que exista, o null.
 */
export function rutaPublica(nombre: string): string | null {
  const aqui = dirname(fileURLToPath(import.meta.url));

  const candidatos = [
    join(process.cwd(), "public", nombre),
    // Lanzado desde la carpeta de arriba.
    join(process.cwd(), "ius-modernum", "public", nombre),
    // Relativo a este módulo: lib/ → raíz del proyecto.
    join(aqui, "..", "public", nombre),
    // Y desde .next/server/... cuando el código va empaquetado.
    join(aqui, "..", "..", "public", nombre),
    join(aqui, "..", "..", "..", "public", nombre),
  ];

  for (const c of candidatos) {
    try {
      if (existsSync(c)) return c;
    } catch {
      // Una ruta ilegible no es motivo para dejar de buscar en las demás.
    }
  }
  return null;
}

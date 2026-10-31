/**
 * Perfilado de archivos tabulares (Excel/Word): qué columnas hay, de qué tipo,
 * con qué valores. Es lo que ElectroLEX guarda para "entender" la estructura
 * de los archivos de trabajo antes de importarlos.
 */
export type TipoColumna = "entero" | "decimal" | "fecha" | "texto" | "vacio";

export interface PerfilColumna {
  indice: number;
  encabezado: string;
  tipo: TipoColumna;
  noVacios: number;
  distintos: number;
  muestras: string[];        // hasta 5 valores distintos
  patron?: string;           // patrón detectado: 'expediente', 'guia_correos', 'codigo_estafeta', 'mesa', 'fecha_ddmmaaaa', 'oficio'
}

export interface PerfilTabla {
  nombre: string;            // hoja o "Tabla N"
  filas: number;             // sin encabezado
  columnas: PerfilColumna[];
  primerasFilas: string[][]; // hasta 8 filas
  filasAnomalas: { indice: number; motivo: string; valores: string[] }[];
  esquemaDetectado?: "lista_oficios" | "piezas_postales" | "estafeta" | null;
}

export interface PerfilArchivo {
  tipoArchivo: "xlsx" | "docx";
  tablas: PerfilTabla[];
  parrafos?: string[];       // docx: texto fuera de tablas
}

const PATRONES: { nombre: string; re: RegExp }[] = [
  { nombre: "guia_correos", re: /^R[NA]\d{9}MX$/ },
  { nombre: "codigo_estafeta", re: /^\d{10}$/ },
  { nombre: "expediente", re: /^\d{1,6}\/\d{4}$/ },
  { nombre: "mesa", re: /^(I|II|III|IV|V|VI|VII|VIII)-[AB]$/ },
  { nombre: "fecha_ddmmaaaa", re: /^\d{2}-\d{2}-\d{4}$/ },
  { nombre: "fecha_ddmesaaaa", re: /^\d{2}-[A-ZÁÉÍÓÚ]+-\d{4}$/ },
  { nombre: "oficio", re: /^\d{1,6}$/ },
  { nombre: "tipo_expediente", re: /^(JA|INC|CV|AR|CA)$/ },
];

function inferirTipo(valores: string[]): TipoColumna {
  if (!valores.length) return "vacio";
  const n = valores.length;
  const enteros = valores.filter((v) => /^-?\d+$/.test(v)).length;
  const decimales = valores.filter((v) => /^-?\d+[.,]\d+$/.test(v)).length;
  const fechas = valores.filter((v) => /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(v) || /^\d{4}-\d{2}-\d{2}/.test(v)).length;
  if (fechas / n > 0.8) return "fecha";
  if (enteros / n > 0.9) return "entero";
  if ((enteros + decimales) / n > 0.9) return "decimal";
  return "texto";
}

function detectarPatron(valores: string[]): string | undefined {
  if (!valores.length) return undefined;
  for (const p of PATRONES) {
    const ok = valores.filter((v) => p.re.test(v)).length;
    if (ok / valores.length >= 0.8) return p.nombre;
  }
  return undefined;
}

function normalizarEncabezado(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function detectarEsquema(columnas: PerfilColumna[]): PerfilTabla["esquemaDetectado"] {
  const enc = columnas.map((c) => normalizarEncabezado(c.encabezado));
  const tiene = (s: string) => enc.some((e) => e.includes(s));
  if (tiene("remitente") && tiene("contenido") && tiene("codigo")) return "estafeta";
  if (tiene("guia")) return "piezas_postales";
  if (tiene("oficio") && tiene("expediente") && tiene("mesa")) return "lista_oficios";
  return null;
}

/** Recibe filas ya como texto (fila 0 = encabezado) y produce el perfil. */
export function perfilarTabla(nombre: string, filas: string[][]): PerfilTabla {
  const encabezado = (filas[0] ?? []).map((h) => String(h ?? "").trim());
  const cuerpo = filas.slice(1).filter((f) => f.some((c) => String(c ?? "").trim() !== ""));
  const nCols = Math.max(encabezado.length, ...cuerpo.map((f) => f.length));

  const columnas: PerfilColumna[] = [];
  for (let j = 0; j < nCols; j++) {
    const valores = cuerpo.map((f) => String(f[j] ?? "").trim()).filter((v) => v !== "");
    const distintos = [...new Set(valores)];
    columnas.push({
      indice: j,
      encabezado: encabezado[j] || `Columna ${j + 1}`,
      tipo: inferirTipo(valores),
      noVacios: valores.length,
      distintos: distintos.length,
      muestras: distintos.slice(0, 5),
      patron: detectarPatron(valores),
    });
  }

  // Filas anómalas: repiten el encabezado, tienen una sola celda (título de sección) o rompen el patrón de la columna
  const filasAnomalas: PerfilTabla["filasAnomalas"] = [];
  const encNorm = encabezado.map(normalizarEncabezado).join("|");
  cuerpo.forEach((f, i) => {
    const vals = f.map((c) => String(c ?? "").trim());
    const llenas = vals.filter((v) => v !== "");
    if (vals.map(normalizarEncabezado).join("|") === encNorm) filasAnomalas.push({ indice: i + 2, motivo: "encabezado repetido", valores: vals });
    else if (llenas.length === 1 && nCols > 2) filasAnomalas.push({ indice: i + 2, motivo: "fila de título/sección", valores: vals });
    else {
      for (const col of columnas) {
        const v = vals[col.indice];
        if (v && col.patron) {
          const p = PATRONES.find((x) => x.nombre === col.patron)!;
          if (!p.re.test(v)) { filasAnomalas.push({ indice: i + 2, motivo: `"${col.encabezado}" no cumple patrón ${col.patron}: "${v}"`, valores: vals }); break; }
        }
      }
    }
  });

  return {
    nombre,
    filas: cuerpo.length,
    columnas,
    primerasFilas: cuerpo.slice(0, 8).map((f) => Array.from({ length: nCols }, (_, j) => String(f[j] ?? "").trim())),
    filasAnomalas: filasAnomalas.slice(0, 30),
    esquemaDetectado: detectarEsquema(columnas),
  };
}

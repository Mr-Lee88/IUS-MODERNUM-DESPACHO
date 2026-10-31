/**
 * Datos ficticios para el armazón visual (paso 1 de la fase 1).
 *
 * TODO lo que está aquí es inventado. El §5 del prompt maestro prohíbe usar
 * información real de clientes durante el desarrollo, así que estas pantallas se
 * arman contra este archivo y no contra la base. En el paso 5 lo sustituyen las
 * consultas a Supabase y este archivo se borra.
 *
 * Las materias, etapas y caracteres salen del catálogo real de
 * `plantilla-ius-modernum.xlsx`: Civil · Mercantil · Familiar · Sucesorio · Amparo.
 */

export type Materia = "Civil" | "Mercantil" | "Familiar" | "Sucesorio" | "Amparo";
export type Ambito = "Federal" | "Local Campeche";
export type EstadoTermino = "vence_hoy" | "proximo" | "cumplido" | "por_verificar";

export interface Asunto {
  id: string;
  nombre: string;
  cliente: string;
  materia: Materia;
  procedimiento: string;
  ambito: Ambito;
  organo: string;
  expediente: string | null;
  etapa: string;
  estado: string;
  responsable: string;
  iniciales: string;
  ultimaActualizacion: string;
}

export interface Termino {
  asuntoId: string;
  asunto: string;
  procedimiento: string;
  expediente: string | null;
  queVence: string;
  cuando: string;
  fecha: string;
  estado: EstadoTermino;
  responsable: string;
  iniciales: string;
  /** §4: ningún término importado o capturado nace verificado. */
  verificado: boolean;
}

export interface Audiencia {
  dia: string;
  fecha: string;
  tipo: string;
  hora: string;
  organo: string;
  asunto: string;
}

export interface Movimiento {
  texto: string;
  cuando: string;
  iniciales: string;
}

export const ASUNTOS: Asunto[] = [
  {
    id: "a-001",
    nombre: "Rosado Pech vs. Constructora del Golfo",
    cliente: "Rosado Pech, Juan",
    materia: "Mercantil",
    procedimiento: "Ordinario mercantil",
    ambito: "Local Campeche",
    organo: "Juzgado 1.º Civil",
    expediente: "412/2026",
    etapa: "Demanda",
    estado: "Término por vencer",
    responsable: "Abogado 1",
    iniciales: "A1",
    ultimaActualizacion: "Hace 3 días",
  },
  {
    id: "a-002",
    nombre: "Sucesión intestamentaria Canul May",
    cliente: "Canul May, familia",
    materia: "Sucesorio",
    procedimiento: "Intestamentario",
    ambito: "Local Campeche",
    organo: "Juzgado 2.º Civil",
    expediente: "88/2025",
    etapa: "Pruebas",
    estado: "En trámite",
    responsable: "Abogado 2",
    iniciales: "A2",
    ultimaActualizacion: "Ayer",
  },
  {
    id: "a-003",
    nombre: "Amparo Uc Tzab contra acto de autoridad",
    cliente: "Uc Tzab, María",
    materia: "Amparo",
    procedimiento: "Amparo indirecto",
    ambito: "Federal",
    organo: "Juzgado de Distrito",
    expediente: "601/2026",
    etapa: "Informe",
    estado: "En trámite",
    responsable: "Abogado 1",
    iniciales: "A1",
    ultimaActualizacion: "Hace 2 días",
  },
  {
    id: "a-004",
    nombre: "Hernández Soberanis vs. Transportes del Sureste",
    cliente: "Hernández S., Luis",
    materia: "Civil",
    procedimiento: "Ordinario civil",
    ambito: "Local Campeche",
    organo: "Juzgado 3.º Civil",
    expediente: "1245/2025",
    etapa: "Pruebas",
    estado: "Audiencia programada",
    responsable: "Abogado 3",
    iniciales: "A3",
    ultimaActualizacion: "Hace 3 días",
  },
  {
    id: "a-005",
    nombre: "Grupo Peninsular vs. Díaz Alcocer",
    cliente: "Grupo Peninsular, S.A.",
    materia: "Mercantil",
    procedimiento: "Ejecutivo mercantil",
    ambito: "Local Campeche",
    organo: "Juzgado 3.º Civil",
    expediente: "73/2026",
    etapa: "Ejecución",
    estado: "En trámite",
    responsable: "Abogado 2",
    iniciales: "A2",
    ultimaActualizacion: "Hace 2 horas",
  },
  {
    id: "a-006",
    nombre: "Comercializadora Ah Kim Pech — revisión de contratos",
    cliente: "Ah Kim Pech, S. de R.L.",
    materia: "Mercantil",
    procedimiento: "Consulta",
    ambito: "Local Campeche",
    organo: "Sin litigio",
    expediente: null,
    etapa: "Consulta",
    estado: "Nuevo",
    responsable: "Abogado 1",
    iniciales: "A1",
    ultimaActualizacion: "Ayer",
  },
  {
    id: "a-007",
    nombre: "Divorcio incausado Pat Chablé",
    cliente: "Pat Chablé, Rosa",
    materia: "Familiar",
    procedimiento: "Divorcio incausado",
    ambito: "Local Campeche",
    organo: "Juzgado 4.º Familiar",
    expediente: "902/2026",
    etapa: "Sentencia",
    estado: "En trámite",
    responsable: "Abogado 3",
    iniciales: "A3",
    ultimaActualizacion: "Hace 6 días",
  },
];

export const TERMINOS: Termino[] = [
  {
    asuntoId: "a-001",
    asunto: "Rosado Pech vs. Constructora del Golfo",
    procedimiento: "Ordinario mercantil",
    expediente: "412/2026",
    queVence: "Contestar demanda",
    cuando: "Hoy",
    fecha: "31 oct 2026",
    estado: "vence_hoy",
    responsable: "Abogado 1",
    iniciales: "A1",
    verificado: true,
  },
  {
    asuntoId: "a-002",
    asunto: "Sucesión Canul May",
    procedimiento: "Intestamentario",
    expediente: "88/2025",
    queVence: "Desahogar prevención",
    cuando: "Mañana",
    fecha: "01 nov 2026",
    estado: "proximo",
    responsable: "Abogado 2",
    iniciales: "A2",
    verificado: true,
  },
  {
    asuntoId: "a-003",
    asunto: "Amparo Uc Tzab",
    procedimiento: "Amparo indirecto",
    expediente: "601/2026",
    queVence: "Rendir informe",
    cuando: "En 3 días",
    fecha: "03 nov 2026",
    estado: "proximo",
    responsable: "Abogado 1",
    iniciales: "A1",
    verificado: true,
  },
  {
    asuntoId: "a-004",
    asunto: "Hernández Soberanis",
    procedimiento: "Ordinario civil",
    expediente: "1245/2025",
    queVence: "Ofrecer pruebas",
    cuando: "En 5 días",
    fecha: "05 nov 2026",
    estado: "por_verificar",
    responsable: "Abogado 3",
    iniciales: "A3",
    verificado: false,
  },
  {
    asuntoId: "a-005",
    asunto: "Grupo Peninsular",
    procedimiento: "Ejecutivo mercantil",
    expediente: "73/2026",
    queVence: "Recurrir el auto",
    cuando: "En 6 días",
    fecha: "06 nov 2026",
    estado: "proximo",
    responsable: "Abogado 2",
    iniciales: "A2",
    verificado: true,
  },
];

export const AUDIENCIAS: Audiencia[] = [
  { dia: "Lun", fecha: "03", tipo: "Audiencia preliminar", hora: "10:00", organo: "Juzgado 1.º Civil", asunto: "Rosado Pech vs. Constructora del Golfo" },
  { dia: "Mar", fecha: "04", tipo: "Desahogo de testimonial", hora: "09:30", organo: "Juzgado 2.º Civil", asunto: "Sucesión Canul May" },
  { dia: "Jue", fecha: "06", tipo: "Audiencia de pruebas", hora: "11:00", organo: "Juzgado 3.º Civil", asunto: "Hernández Soberanis" },
  { dia: "Vie", fecha: "07", tipo: "Audiencia constitucional", hora: "12:00", organo: "Juzgado de Distrito", asunto: "Amparo Uc Tzab" },
];

export const MOVIMIENTOS: Movimiento[] = [
  { texto: "Se notificó el acuerdo en Grupo Peninsular", cuando: "Hace 2 horas", iniciales: "A1" },
  { texto: "Alta de cliente Comercializadora Ah Kim Pech", cuando: "Ayer", iniciales: "A2" },
  { texto: "Pago recibido de Sucesión Canul May", cuando: "Ayer", iniciales: "A3" },
  { texto: "Se programó audiencia en Hernández Soberanis", cuando: "Hace 3 días", iniciales: "A1" },
  { texto: "Se subió documento en Rosado Pech", cuando: "Hace 3 días", iniciales: "A2" },
];

export const INDICADORES = {
  terminosSemana: 7,
  audienciasSemana: 4,
  asuntosActivos: 38,
  asuntosTotales: 52,
  porCobrar: 420500,
  clientesPorCobrar: 9,
};

export const MATERIAS: Materia[] = ["Civil", "Mercantil", "Familiar", "Sucesorio", "Amparo"];

export const ETAPAS = [
  "Consulta", "Demanda", "Contestación", "Pruebas", "Alegatos",
  "Sentencia", "Recurso", "Ejecución", "Informe", "Concluido",
];

export const RESPONSABLES = ["Abogado 1", "Abogado 2", "Abogado 3"];

/* ---------- Bitácora del asunto a-001 (ficticia) ---------- */

/** §2.B: se distinguen los hechos procesales de las notas internas y lo administrativo. */
export type ClaseGestion = "hecho_procesal" | "nota_interna" | "administrativa";

export interface Gestion {
  id: string;
  asuntoId: string;
  ocurrioEn: string;
  hora: string;
  tipo: string;
  clase: ClaseGestion;
  titulo: string;
  descripcion: string;
  autor: string;
  iniciales: string;
  documento?: { nombre: string; peso: string };
  /** Si el cliente puede verla en el portal (§6: solo lo expresamente publicado). */
  publicada: boolean;
}

export const GESTIONES: Gestion[] = [
  {
    id: "g-001", asuntoId: "a-001", ocurrioEn: "29 de octubre de 2026", hora: "10:15",
    tipo: "Plazo", clase: "hecho_procesal",
    titulo: "Se nos emplazó a juicio",
    descripcion: "Corre el término de nueve días para contestar. Vence hoy, 31 de octubre.",
    autor: "Abogado 1", iniciales: "A1",
    documento: { nombre: "cedula-notificacion.pdf", peso: "320 KB" },
    publicada: true,
  },
  {
    id: "g-002", asuntoId: "a-001", ocurrioEn: "24 de octubre de 2026", hora: "16:30",
    tipo: "Reunión", clase: "administrativa",
    titulo: "Reunión con el cliente",
    descripcion: "Entregó los contratos y las facturas. Falta el estado de cuenta bancario.",
    autor: "Abogado 2", iniciales: "A2",
    publicada: true,
  },
  {
    id: "g-003", asuntoId: "a-001", ocurrioEn: "18 de octubre de 2026", hora: "11:20",
    tipo: "Honorarios", clase: "administrativa",
    titulo: "Anticipo recibido",
    descripcion: "Se registró la factura emitida por el contador.",
    autor: "Abogado 3", iniciales: "A3",
    documento: { nombre: "factura-001235.pdf", peso: "245 KB" },
    publicada: false,
  },
  {
    id: "g-004", asuntoId: "a-001", ocurrioEn: "15 de octubre de 2026", hora: "09:40",
    tipo: "Acuerdo", clase: "hecho_procesal",
    titulo: "Se abrió el asunto",
    descripcion: "Revisión de conflicto de intereses: sin coincidencias con la contraparte.",
    autor: "Abogado 1", iniciales: "A1",
    publicada: true,
  },
  {
    id: "g-005", asuntoId: "a-001", ocurrioEn: "12 de octubre de 2026", hora: "14:10",
    tipo: "Nota", clase: "nota_interna",
    titulo: "Análisis inicial",
    descripcion: "Se revisó la documentación entregada por el cliente. Estrategia reservada.",
    autor: "Abogado 2", iniciales: "A2",
    documento: { nombre: "analisis-inicial.pdf", peso: "120 KB" },
    publicada: false,
  },
];

export interface DocumentoAsunto {
  nombre: string;
  fecha: string;
  peso: string;
  /** §5 y módulo 3: el acceso se decide documento por documento. */
  nivelAcceso: "socio" | "equipo" | "cliente";
}

export const DOCUMENTOS: DocumentoAsunto[] = [
  { nombre: "cedula-notificacion.pdf", fecha: "29/10/2026", peso: "320 KB", nivelAcceso: "cliente" },
  { nombre: "contrato-de-obra.pdf", fecha: "24/10/2026", peso: "1.4 MB", nivelAcceso: "cliente" },
  { nombre: "poder-notarial.pdf", fecha: "15/10/2026", peso: "580 KB", nivelAcceso: "equipo" },
  { nombre: "factura-001235.pdf", fecha: "18/10/2026", peso: "245 KB", nivelAcceso: "socio" },
];

export interface Parte {
  nombre: string;
  caracter: string;
  esCliente: boolean;
  representante?: string;
}

export const PARTES: Parte[] = [
  { nombre: "Rosado Pech, Juan", caracter: "Demandado", esCliente: true },
  { nombre: "Constructora del Golfo, S.A. de C.V.", caracter: "Actor", esCliente: false, representante: "Lic. apoderado legal" },
];

export const HONORARIOS = { presupuesto: 150000, anticipo: 50000, saldo: 100000 };

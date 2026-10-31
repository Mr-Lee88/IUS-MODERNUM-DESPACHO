/**
 * Tipos y listas fijas de los catálogos. Sin dependencias de servidor, para que
 * los formularios (componentes de cliente) puedan importarlos.
 * La lectura desde la base vive en `lib/catalogos-servidor.ts`.
 */
export interface Opcion { clave: string; nombre: string }

export interface Catalogos {
  materias: Opcion[];
  procedimientos: (Opcion & { materia_clave: string })[];
  etapas: Opcion[];
  caracteres: Opcion[];
  tiposGestion: (Opcion & { clase: string })[];
  tiposDocumento: Opcion[];
  organos: { clave: string; nombre: string; ambito: string }[];
  responsables: Opcion[];
}

export const AMBITOS: Opcion[] = [
  { clave: "federal", nombre: "Federal" },
  { clave: "local_campeche", nombre: "Local Campeche" },
];

export const TIPOS_PERSONA: Opcion[] = [
  { clave: "fisica", nombre: "Persona física" },
  { clave: "moral", nombre: "Persona moral" },
];

export const ESTADOS_CLIENTE: Opcion[] = [
  { clave: "activo", nombre: "Activo" },
  { clave: "prospecto", nombre: "Prospecto" },
  { clave: "inactivo", nombre: "Inactivo" },
];

export const ESTADOS_ASUNTO: Opcion[] = [
  { clave: "activo", nombre: "Activo" },
  { clave: "suspendido", nombre: "Suspendido" },
  { clave: "concluido", nombre: "Concluido" },
  { clave: "archivado", nombre: "Archivado" },
];

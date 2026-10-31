"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { requerirSesion } from "@/lib/sesion";

export type EstadoFormulario = { error?: string; aviso?: string };

/** 25 MB: el mismo tope que acepta el servidor de acciones (next.config.ts). */
const TOPE_BYTES = 25 * 1024 * 1024;

/**
 * Tipos permitidos. Lista cerrada a propósito: el §3 habla de «PDF y otros
 * formatos autorizados», no de cualquier cosa. Nada de ejecutables ni comprimidos.
 */
const TIPOS_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const esquema = z.object({
  asunto_id: z.string().uuid(),
  tipo_documental: z.string().min(1, "Elija el tipo de documento"),
  nivel_acceso: z.enum(["socio", "equipo", "cliente"]),
  fecha_documento: z.string().optional(),
  descripcion: z.string().trim().optional(),
});

/** Nombre de archivo seguro: minúsculas, sin acentos ni espacios. */
export async function nombreSeguro(nombre: string): Promise<string> {
  const punto = nombre.lastIndexOf(".");
  const base = punto > 0 ? nombre.slice(0, punto) : nombre;
  const ext = punto > 0 ? nombre.slice(punto).toLowerCase() : "";
  const limpio = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return (limpio || "documento") + ext;
}

export async function subirDocumento(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const perfil = await requerirSesion();

  const archivo = datos.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Elija un archivo" };
  }
  if (archivo.size > TOPE_BYTES) {
    return { error: `El archivo pesa ${Math.round(archivo.size / 1048576)} MB y el tope son 25 MB` };
  }
  if (!TIPOS_MIME.has(archivo.type)) {
    return { error: `No se admiten archivos de tipo «${archivo.type || "desconocido"}»` };
  }

  const r = esquema.safeParse({
    asunto_id: datos.get("asunto_id"),
    tipo_documental: datos.get("tipo_documental"),
    nivel_acceso: datos.get("nivel_acceso"),
    fecha_documento: datos.get("fecha_documento"),
    descripcion: datos.get("descripcion"),
  });
  if (!r.success) return { error: r.error.issues[0].message };
  const d = r.data;

  // Solo el socio puede guardar un documento que solo él verá.
  if (d.nivel_acceso === "socio" && perfil.rol !== "socio") {
    return { error: "Solo el socio puede marcar un documento como reservado para él" };
  }

  const supabase = await crearClienteServidor();
  const limpio = await nombreSeguro(archivo.name);
  const ruta = `asuntos/${d.asunto_id}/${crypto.randomUUID()}-${limpio}`;

  const { error: errorSubida } = await supabase.storage
    .from("documentos")
    .upload(ruta, archivo, { contentType: archivo.type, upsert: false });

  if (errorSubida) return { error: `No se pudo guardar el archivo: ${errorSubida.message}` };

  const { error: errorFicha } = await supabase.from("documento").insert({
    ruta,
    nombre_original: archivo.name,
    mime: archivo.type,
    tamano: archivo.size,
    tipo_documental: d.tipo_documental,
    fecha_documento: d.fecha_documento || null,
    nivel_acceso: d.nivel_acceso,
    asunto_id: d.asunto_id,
    origen: "interno",
    estado_revision: "aprobado",
    descripcion: d.descripcion || null,
    subido_por: perfil.id,
  });

  if (errorFicha) {
    // Si la ficha falla, el archivo huérfano no sirve de nada: se retira.
    await supabase.storage.from("documentos").remove([ruta]);
    return { error: `No se pudo registrar el documento: ${errorFicha.message}` };
  }

  revalidatePath(`/asuntos/${d.asunto_id}`);
  return { aviso: `Se guardó «${archivo.name}».` };
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { requerirSesion } from "@/lib/sesion";

export type EstadoFormulario = { error?: string };

const esquemaAsunto = z.object({
  nombre: z.string().trim().min(5, "Escriba cómo se llama el asunto"),
  cliente_id: z.string().uuid("Elija el cliente"),
  caracter_cliente: z.string().min(1, "Diga con qué carácter actúa el cliente"),
  materia_clave: z.string().min(1, "Elija la materia"),
  procedimiento_clave: z.string().optional(),
  ambito: z.enum(["federal", "local_campeche"]),
  organo_id: z.string().optional(),
  numero_expediente: z.string().trim().optional(),
  anio: z.string().optional(),
  etapa: z.string().min(1, "Elija la etapa"),
  responsable_id: z.string().optional(),
  fecha_apertura: z.string().min(1, "Falta la fecha de apertura"),
  cuantia: z.string().optional(),
  contrapartes: z.string().trim().optional(),
  caracter_contraparte: z.string().optional(),
  observaciones: z.string().trim().optional(),
});

function nulo(v: string | undefined) {
  return v && v.length > 0 ? v : null;
}

export async function crearAsunto(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirSesion();

  const r = esquemaAsunto.safeParse(Object.fromEntries(datos));
  if (!r.success) return { error: r.error.issues[0].message };
  const d = r.data;

  // Si hay número de expediente tiene que haber año: un expediente sin año no
  // identifica nada, y el cómputo de plazos lo va a necesitar después.
  if (d.numero_expediente && !d.anio) {
    return { error: "Si captura número de expediente, indique también el año" };
  }

  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: asunto, error } = await supabase
    .from("asunto")
    .insert({
      nombre: d.nombre,
      materia_clave: d.materia_clave,
      procedimiento_clave: nulo(d.procedimiento_clave),
      ambito: d.ambito,
      organo_id: nulo(d.organo_id),
      numero_expediente: nulo(d.numero_expediente),
      anio: d.anio ? Number(d.anio) : null,
      etapa: d.etapa,
      responsable_id: nulo(d.responsable_id),
      fecha_apertura: d.fecha_apertura,
      cuantia: d.cuantia ? Number(d.cuantia) : null,
      observaciones: nulo(d.observaciones),
      creado_por: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: `No se pudo guardar el asunto: ${error.message}` };

  // El cliente entra como parte procesal, con su carácter.
  const { data: cliente } = await supabase
    .from("cliente")
    .select("nombre_o_razon_social")
    .eq("id", d.cliente_id)
    .single();

  const partes: Record<string, unknown>[] = [{
    asunto_id: asunto.id,
    cliente_id: d.cliente_id,
    nombre: cliente?.nombre_o_razon_social ?? "Cliente",
    caracter: d.caracter_cliente,
    es_nuestro_cliente: true,
  }];

  // Varias contrapartes, separadas por punto y coma. Cada una es su propia parte:
  // un litisconsorcio no cabe en un campo de texto.
  if (d.contrapartes) {
    for (const nombre of d.contrapartes.split(";").map((s) => s.trim()).filter(Boolean)) {
      partes.push({
        asunto_id: asunto.id,
        cliente_id: null,
        nombre,
        caracter: d.caracter_contraparte || "demandado",
        es_nuestro_cliente: false,
      });
    }
  }

  const { error: errorPartes } = await supabase.from("parte").insert(partes);
  if (errorPartes) {
    return { error: `El asunto se guardó, pero las partes no: ${errorPartes.message}` };
  }

  revalidatePath("/asuntos");
  redirect(`/asuntos/${asunto.id}`);
}

const esquemaGestion = z.object({
  asunto_id: z.string().uuid(),
  ocurrio_en: z.string().min(1, "Falta la fecha en que ocurrió"),
  hora: z.string().optional(),
  tipo: z.string().min(1, "Elija el tipo de gestión"),
  titulo: z.string().trim().min(3, "Escriba un título"),
  descripcion: z.string().trim().optional(),
  publicada_al_cliente: z.string().optional(),
});

/** Anotar una gestión en la bitácora. Es la captura más frecuente del día a día. */
export async function registrarGestion(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirSesion();

  const r = esquemaGestion.safeParse(Object.fromEntries(datos));
  if (!r.success) return { error: r.error.issues[0].message };
  const d = r.data;

  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();

  // La clase (hecho procesal / nota interna / administrativa) la manda el tipo,
  // no el capturista: así la bitácora queda consistente.
  const { data: tipo } = await supabase
    .from("tipo_gestion")
    .select("clase")
    .eq("clave", d.tipo)
    .single();

  const esNotaInterna = tipo?.clase === "nota_interna";

  const { error } = await supabase.from("gestion").insert({
    asunto_id: d.asunto_id,
    ocurrio_en: d.ocurrio_en,
    hora: nulo(d.hora),
    tipo: d.tipo,
    clase: tipo?.clase ?? "hecho_procesal",
    titulo: d.titulo,
    descripcion: nulo(d.descripcion),
    // Una nota interna nunca se publica al cliente, aunque marquen la casilla.
    publicada_al_cliente: esNotaInterna ? false : d.publicada_al_cliente === "on",
    autor_id: user?.id ?? null,
  });

  if (error) return { error: `No se pudo anotar: ${error.message}` };

  revalidatePath(`/asuntos/${d.asunto_id}`);
  return {};
}

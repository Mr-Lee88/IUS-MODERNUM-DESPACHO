"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";
import { requerirSesion } from "@/lib/sesion";

export type EstadoFormulario = { error?: string };

/** El RFC es opcional, pero si se escribe tiene que tener forma de RFC. */
const RFC = /^([A-ZÑ&]{3,4})\d{6}([A-Z\d]{3})$/i;

const esquema = z.object({
  tipo_persona: z.enum(["fisica", "moral"]),
  nombre_o_razon_social: z.string().trim().min(3, "Escriba el nombre o la razón social"),
  rfc: z.string().trim().toUpperCase().refine((v) => v === "" || RFC.test(v), "El RFC no tiene forma válida").optional(),
  representante: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  correo: z.string().trim().refine((v) => v === "" || z.string().email().safeParse(v).success, "El correo no es válido").optional(),
  calle_y_numero: z.string().trim().optional(),
  colonia: z.string().trim().optional(),
  ciudad: z.string().trim().optional(),
  estado: z.string().trim().optional(),
  cp: z.string().trim().optional(),
  cliente_desde: z.string().optional(),
  estado_cliente: z.enum(["activo", "prospecto", "inactivo"]),
  observaciones_internas: z.string().trim().optional(),
});

function vacioANulo(v: string | undefined) {
  return v && v.length > 0 ? v : null;
}

export async function crearCliente(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await requerirSesion();

  const r = esquema.safeParse(Object.fromEntries(datos));
  if (!r.success) return { error: r.error.issues[0].message };
  const d = r.data;

  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();

  // Una persona moral sin representante se puede guardar, pero conviene avisar:
  // sin representante no hay quién firme. No se bloquea, se deja en observaciones.
  const { data: nuevo, error } = await supabase
    .from("cliente")
    .insert({
      tipo_persona: d.tipo_persona,
      nombre_o_razon_social: d.nombre_o_razon_social,
      rfc: vacioANulo(d.rfc),
      representante: vacioANulo(d.representante),
      telefono: vacioANulo(d.telefono),
      correo: vacioANulo(d.correo),
      calle_y_numero: vacioANulo(d.calle_y_numero),
      colonia: vacioANulo(d.colonia),
      ciudad: vacioANulo(d.ciudad),
      estado: vacioANulo(d.estado),
      cp: vacioANulo(d.cp),
      cliente_desde: vacioANulo(d.cliente_desde),
      estado_cliente: d.estado_cliente,
      observaciones_internas: vacioANulo(d.observaciones_internas),
      creado_por: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: `No se pudo guardar: ${error.message}` };

  revalidatePath("/clientes");
  redirect(`/clientes/${nuevo.id}`);
}

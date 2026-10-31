"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase/server";

const esquemaIngreso = z.object({
  correo: z.string().email("El correo no es válido"),
  contrasena: z.string().min(1, "Falta la contraseña"),
});

const esquemaAlta = z.object({
  nombre: z.string().min(3, "Escriba su nombre completo"),
  correo: z.string().email("El correo no es válido"),
  contrasena: z.string().min(8, "La contraseña necesita al menos 8 caracteres"),
});

export type EstadoFormulario = { error?: string };

/** Supabase contesta en inglés. Aquí se traduce lo que el usuario puede ver. */
function enEspanol(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("is invalid") && m.includes("email")) {
    return "Ese correo no lo acepta el servidor. Use un dominio real.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Ya hay una cuenta con ese correo.";
  }
  if (m.includes("password") && m.includes("at least")) {
    return "La contraseña es demasiado corta.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Demasiados intentos seguidos. Espere un momento.";
  }
  return mensaje;
}

export async function ingresar(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const r = esquemaIngreso.safeParse({
    correo: datos.get("correo"),
    contrasena: datos.get("contrasena"),
  });
  if (!r.success) return { error: r.error.issues[0].message };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: r.data.correo,
    password: r.data.contrasena,
  });
  // No se distingue «no existe» de «contraseña incorrecta»: decirlo ayudaría a
  // averiguar qué correos tienen cuenta en el despacho.
  if (error) return { error: "Correo o contraseña incorrectos" };

  revalidatePath("/", "layout");
  redirect("/");
}

/** Alta del primer usuario: el socio. Después, las cuentas las crea él. */
export async function crearPrimerUsuario(
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const r = esquemaAlta.safeParse({
    nombre: datos.get("nombre"),
    correo: datos.get("correo"),
    contrasena: datos.get("contrasena"),
  });
  if (!r.success) return { error: r.error.issues[0].message };

  const supabase = await crearClienteServidor();

  const { data: yaHay } = await supabase.rpc("hay_usuarios");
  if (yaHay) return { error: "El despacho ya tiene usuarios. Pida su cuenta al socio." };

  const { error } = await supabase.auth.signUp({
    email: r.data.correo,
    password: r.data.contrasena,
    options: { data: { nombre: r.data.nombre } },
  });
  if (error) return { error: enEspanol(error.message) };

  revalidatePath("/", "layout");
  redirect("/");
}

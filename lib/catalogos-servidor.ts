import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Catalogos } from "@/lib/catalogos";

/**
 * Lee del sistema los mismos catálogos que validan las listas desplegables de
 * `plantilla-ius-modernum.xlsx`: lo que se captura a mano y lo que se importa
 * tienen que caber en el mismo cajón.
 */
export async function leerCatalogos(): Promise<Catalogos> {
  const supabase = await crearClienteServidor();

  const [materias, procedimientos, etapas, caracteres, tiposGestion, tiposDocumento, organos, perfiles] =
    await Promise.all([
      supabase.from("materia").select("clave, nombre").order("orden"),
      supabase.from("procedimiento").select("clave, nombre, materia_clave").order("orden"),
      supabase.from("etapa").select("clave, nombre").order("orden"),
      supabase.from("caracter_parte").select("clave, nombre").order("orden"),
      supabase.from("tipo_gestion").select("clave, nombre, clase").order("orden"),
      supabase.from("tipo_documento").select("clave, nombre").order("orden"),
      supabase.from("organo").select("id, nombre, ambito").is("archivado_en", null).order("nombre"),
      supabase.from("perfil").select("id, nombre").in("rol", ["socio", "abogado", "pasante"]).eq("activo", true),
    ]);

  return {
    materias: materias.data ?? [],
    procedimientos: procedimientos.data ?? [],
    etapas: etapas.data ?? [],
    caracteres: caracteres.data ?? [],
    tiposGestion: tiposGestion.data ?? [],
    tiposDocumento: tiposDocumento.data ?? [],
    organos: (organos.data ?? []).map((o) => ({ clave: o.id, nombre: o.nombre, ambito: o.ambito })),
    responsables: (perfiles.data ?? []).map((p) => ({ clave: p.id, nombre: p.nombre })),
  };
}

import { NextResponse, type NextRequest } from "next/server";
import { perfilDeLaPeticion } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";

/**
 * Entrega un documento del almacenamiento privado.
 *
 * El bucket no es público: no hay URL permanente que se pueda pasar por ahí.
 * Esta ruta comprueba la sesión, deja que la RLS decida si ese usuario puede ver
 * ese documento —si no puede, la consulta devuelve cero filas— y solo entonces
 * firma un enlace de dos minutos.
 */
const VIGENCIA_SEGUNDOS = 120;

export async function GET(
  _peticion: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await crearClienteServidor();

  if (!(await perfilDeLaPeticion())) return new NextResponse("No autorizado", { status: 401 });

  const { data: documento } = await supabase
    .from("documento")
    .select("ruta, nombre_original")
    .eq("id", id)
    .is("archivado_en", null)
    .single();

  // Sin fila: o no existe, o la RLS lo escondió. Se contesta igual en los dos
  // casos, para no revelar que el documento existe.
  if (!documento?.ruta) return new NextResponse("No encontrado", { status: 404 });

  const { data: firmado, error } = await supabase.storage
    .from("documentos")
    .createSignedUrl(documento.ruta, VIGENCIA_SEGUNDOS, {
      download: documento.nombre_original,
    });

  if (error || !firmado) return new NextResponse("No encontrado", { status: 404 });

  return NextResponse.redirect(firmado.signedUrl);
}

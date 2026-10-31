import { NextResponse, type NextRequest } from "next/server";
import { generarReporte } from "@/lib/pdf/reporte";
import { reunirReporte } from "@/lib/reportes";
import { crearClienteServidor } from "@/lib/supabase/server";

/** Reporte del despacho en PDF. Las cifras de dinero solo salen para el socio. */
export async function GET(_peticion: NextRequest) {
  const supabase = await crearClienteServidor();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const { data: perfil } = await supabase
    .from("perfil").select("nombre, rol").eq("id", user.id).single();
  if (!perfil) return new NextResponse("No autorizado", { status: 401 });
  if (perfil.rol === "cliente") return new NextResponse("No encontrado", { status: 404 });

  const datos = await reunirReporte(perfil.nombre, perfil.rol === "socio");
  const pdf = await generarReporte(datos);

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reporte-despacho-${datos.corteAl}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

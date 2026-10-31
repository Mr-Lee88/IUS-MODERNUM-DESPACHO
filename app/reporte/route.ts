import { NextResponse } from "next/server";
import { generarReporte } from "@/lib/pdf/reporte";
import { reunirReporte } from "@/lib/reportes";
import { perfilDeLaPeticion } from "@/lib/sesion";

/** Reporte del despacho en PDF. Las cifras de dinero solo salen para el socio. */
export async function GET() {
  const perfil = await perfilDeLaPeticion();
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

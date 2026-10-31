import { NextResponse, type NextRequest } from "next/server";
import { crearClienteDeAcceso } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await crearClienteDeAcceso();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/ingresar", request.url));
}

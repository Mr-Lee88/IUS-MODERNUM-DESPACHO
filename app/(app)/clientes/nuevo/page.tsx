import Link from "next/link";
import { FormularioCliente } from "./formulario";

export const metadata = { title: "Nuevo cliente" };

export default function PaginaNuevoCliente() {
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <nav className="text-xs text-[var(--muted-foreground)]">
        <Link href="/clientes" className="underline-offset-2 hover:underline">Clientes</Link>
        <span aria-hidden> › </span>
        <span>Nuevo</span>
      </nav>

      <div>
        <h1 className="text-xl text-[var(--verde)]">Nuevo cliente</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Solo el nombre y el tipo de persona son obligatorios. Lo demás se puede
          completar después.
        </p>
      </div>

      <FormularioCliente hoy={hoy} />
    </div>
  );
}

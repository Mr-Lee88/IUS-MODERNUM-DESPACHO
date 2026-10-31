import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Pantalla que todavía no se construye. Dice en qué paso del plan llega, para que
 * nadie confunda «falta» con «está roto».
 */
export function Pendiente({
  titulo,
  paso,
  descripcion,
}: {
  titulo: string;
  paso: string;
  descripcion: string;
}) {
  return (
    <div className="space-y-5">
      <h1 className="text-xl text-[var(--verde)]">{titulo}</h1>
      <div className="filete-dorado border border-[var(--border)] bg-white p-6">
        <p className="text-[11px] uppercase tracking-wider text-[var(--dorado-tinta)]">{paso}</p>
        <p className="mt-2 max-w-prose text-sm">{descripcion}</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--verde)] underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver a los asuntos del día
        </Link>
      </div>
    </div>
  );
}
